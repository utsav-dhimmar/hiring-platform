from datetime import datetime, timezone
import uuid

from sqlalchemy import func, or_, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate
from app.v1.db.models.hr_decisions import HrDecision
from app.v1.db.models.resumes import Resume
from app.v1.db.models.resume_version_results import ResumeVersionResult
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.schemas.upload import CandidateResponse, ResumeMatchAnalysis
from app.v1.schemas.response import PaginatedData
from app.v1.schemas.candidate_stage import CandidateStageSummary


class CandidateAdminService:
    """
    Service for admin-level candidate management operations.
    """

    async def get_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        query: str | None = None,
        hr_decision: str | None = None,
        jd_version: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> PaginatedData[CandidateResponse]:
        from app.v1.db.models.cross_job_matches import CrossJobMatch

        # 1. Fetch direct candidates
        dir_filter = or_(
            Candidate.applied_job_id == job_id,
            Candidate.id.in_(
                select(HrDecision.candidate_id).where(HrDecision.job_id == job_id)
            )
        )
        
        # Apply date filters to direct candidates
        if start_date:
            dir_filter = and_(dir_filter, Candidate.created_at >= start_date)
        if end_date:
            dir_filter = and_(dir_filter, Candidate.created_at <= end_date)

        dir_stmt = select(Candidate).where(dir_filter)

        search_filter = None
        if query:
            search_filter = or_(
                Candidate.first_name.ilike(f"%{query}%"),
                Candidate.last_name.ilike(f"%{query}%"),
                Candidate.email.ilike(f"%{query}%"),
            )
            dir_stmt = dir_stmt.where(search_filter)

        if hr_decision:
            latest_decision_subq = (
                select(HrDecision.decision)
                .where(HrDecision.candidate_id == Candidate.id)
                .order_by(HrDecision.decided_at.desc())
                .limit(1)
                .scalar_subquery()
            )
            dir_stmt = dir_stmt.where(latest_decision_subq == hr_decision)

        if jd_version is not None:
            dir_stmt = dir_stmt.where(Candidate.applied_version_number == jd_version)

        dir_stmt = dir_stmt.options(
            selectinload(Candidate.resumes).selectinload(Resume.version_results).selectinload(ResumeVersionResult.job),
            selectinload(Candidate.hr_decisions),
            selectinload(Candidate.applied_job),
            selectinload(Candidate.stages).selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.template),
            selectinload(Candidate.location_rel),
        )
        dir_result = await db.execute(dir_stmt)
        direct_candidates = list(dir_result.scalars().unique().all())

        # 2. Fetch cross-matched candidates
        xm_filter = CrossJobMatch.matched_job_id == job_id
        if start_date:
            xm_filter = and_(xm_filter, CrossJobMatch.created_at >= start_date)
        if end_date:
            xm_filter = and_(xm_filter, CrossJobMatch.created_at <= end_date)

        xm_stmt = (
            select(CrossJobMatch)
            .where(xm_filter)
            .options(
                selectinload(CrossJobMatch.candidate).selectinload(Candidate.resumes).selectinload(Resume.version_results).selectinload(ResumeVersionResult.job),
                selectinload(CrossJobMatch.candidate).selectinload(Candidate.hr_decisions),
                selectinload(CrossJobMatch.candidate).selectinload(Candidate.stages).selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.template),
                selectinload(CrossJobMatch.candidate).selectinload(Candidate.location_rel),
                selectinload(CrossJobMatch.matched_job),
            )
        )
        if search_filter is not None:
            xm_stmt = xm_stmt.join(
                Candidate, CrossJobMatch.candidate_id == Candidate.id
            ).where(search_filter)

        xm_result = await db.execute(xm_stmt)
        cross_matches = list(xm_result.scalars().unique().all())

        # 3. Map to responses
        responses = []
        seen_candidate_ids = set()
        seen_emails = set()
        
        for c in direct_candidates:
            responses.append(self._map_candidate_to_response(c, target_job_id=job_id))
            seen_candidate_ids.add(c.id)
            if c.email:
                seen_emails.add(c.email.lower().strip())

        for xm in cross_matches:
            if not xm.candidate:
                continue
            
            # Skip if already in the list (by ID or by Email)
            if xm.candidate_id in seen_candidate_ids:
                continue
            
            cand_email = (xm.candidate.email.lower().strip() if xm.candidate.email else None)
            if cand_email and cand_email in seen_emails:
                continue

            # Record that we've seen this candidate
            seen_candidate_ids.add(xm.candidate_id)
            if cand_email:
                seen_emails.add(cand_email)

            # Map candidate normally
            resp = self._map_candidate_to_response(xm.candidate, target_job_id=job_id)

            # Apply hr_decision filter in-memory for cross-matches if needed
            if hr_decision:
                if resp.hr_decision != hr_decision:
                    continue

            # Retrieve match analysis as object (OVERRIDE)
            analysis_obj = None
            if xm.match_analysis:
                try:
                    analysis_obj = ResumeMatchAnalysis.model_validate(xm.match_analysis)
                except Exception:
                    pass

            # Calculate pass_fail dynamically based on this job's threshold
            match_score_val = (
                float(xm.match_score) if xm.match_score is not None else 0.0
            )
            threshold_val = (
                float(xm.matched_job.passing_threshold)
                if xm.matched_job and xm.matched_job.passing_threshold
                else 70.0
            )
            derived_pass_fail = (
                "passed" if match_score_val >= threshold_val else "failed"
            )

            # Override with cross-match data securely via model_copy
            resp = resp.model_copy(
                update={
                    "applied_version_number": (
                        xm.matched_job.version if xm.matched_job else resp.applied_version_number
                    ),
                    "resume_score": match_score_val,
                    "pass_fail": derived_pass_fail,
                    "resume_analysis": analysis_obj,
                    "created_at": xm.created_at,
                }
            )

            responses.append(resp)

        # 4. Sort entirely by created_at (most recent first)
        responses.sort(key=lambda x: x.created_at, reverse=True)

        # 5. Paginate
        total = len(responses)
        paginated_responses = responses[skip : skip + limit]

        return PaginatedData[CandidateResponse](
            data=paginated_responses,
            total=total,
        )

    # Note: search_candidates_for_job has been merged into get_candidates_for_job


    async def search_candidates(
        self,
        db: AsyncSession,
        query: str | None = None,
        job: str | None = None,
        hr_decision: str | None = None,
        city: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> PaginatedData[CandidateResponse]:
        """Search candidates across all jobs with advanced filtering."""
        from app.v1.db.models.jobs import Job
        from app.v1.db.models.locations import Location

        # Data and count queries
        from app.v1.db.models.cross_job_matches import CrossJobMatch
        from sqlalchemy import exists

        # Base filter: Candidate must have a primary job OR at least one cross-match entry
        base_filter = or_(
            Candidate.applied_job_id.is_not(None),
            exists().where(CrossJobMatch.candidate_id == Candidate.id)
        )

        stmt = select(Candidate).where(base_filter)
        total_stmt = select(func.count()).select_from(Candidate).where(base_filter)

        # 1. Base query filter
        if query:
            search_filter = or_(
                Candidate.first_name.ilike(f"%{query}%"),
                Candidate.last_name.ilike(f"%{query}%"),
                Candidate.email.ilike(f"%{query}%"),
            )
            stmt = stmt.where(search_filter)
            total_stmt = total_stmt.where(search_filter)

        # 2. Job filter (UUID or Title)
        if job:
            is_uuid = False
            try:
                uuid.UUID(str(job))
                is_uuid = True
            except ValueError:
                pass

            if is_uuid:
                # Direct UUID comparison
                xm_subq = select(CrossJobMatch.candidate_id).where(CrossJobMatch.matched_job_id == job)
                stmt = stmt.where(or_(Candidate.applied_job_id == job, Candidate.id.in_(xm_subq)))
                total_stmt = total_stmt.where(or_(Candidate.applied_job_id == job, Candidate.id.in_(xm_subq)))
            else:
                # Title search
                xm_subq = select(CrossJobMatch.candidate_id).join(Job, CrossJobMatch.matched_job_id == Job.id).where(Job.title.ilike(f"%{job}%"))
                stmt = stmt.outerjoin(Job, Candidate.applied_job_id == Job.id).where(
                    or_(Job.title.ilike(f"%{job}%"), Candidate.id.in_(xm_subq))
                )
                total_stmt = total_stmt.outerjoin(Job, Candidate.applied_job_id == Job.id).where(
                    or_(Job.title.ilike(f"%{job}%"), Candidate.id.in_(xm_subq))
                )

        # 3. City filter
        if city:
            stmt = stmt.join(Location, Candidate.location_id == Location.id).where(Location.name.ilike(f"%{city}%"))
            total_stmt = total_stmt.join(Location, Candidate.location_id == Location.id).where(Location.name.ilike(f"%{city}%"))

        # 4. HR Decision filter
        if hr_decision:
            # Map user-friendly labels to database values
            decision_map = {
                "approved": "approve",
                "proceed": "approve",
                "rejected": "reject",
                "maybe": "May Be"
            }
            mapped_decision = decision_map.get(hr_decision.lower(), hr_decision)

            latest_decision_subq = (
                select(HrDecision.decision)
                .where(HrDecision.candidate_id == Candidate.id)
                .order_by(HrDecision.decided_at.desc())
                .limit(1)
                .scalar_subquery()
            )
            stmt = stmt.where(latest_decision_subq == mapped_decision)
            total_stmt = total_stmt.where(latest_decision_subq == mapped_decision)

        # 5. Date filters
        if start_date:
            stmt = stmt.where(Candidate.created_at >= start_date)
            total_stmt = total_stmt.where(Candidate.created_at >= start_date)
        if end_date:
            stmt = stmt.where(Candidate.created_at <= end_date)
            total_stmt = total_stmt.where(Candidate.created_at <= end_date)

        total = await db.scalar(total_stmt)

        # Apply paging and ordering
        stmt = (
            stmt.options(
                selectinload(Candidate.resumes).selectinload(Resume.version_results).selectinload(ResumeVersionResult.job),
                selectinload(Candidate.hr_decisions),
                selectinload(Candidate.applied_job),
                selectinload(Candidate.stages).selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.template),
                selectinload(Candidate.location_rel),
            )
            .order_by(Candidate.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        candidates = list(result.scalars().unique().all())

        return PaginatedData[CandidateResponse](
            data=[self._map_candidate_to_response(c) for c in candidates],
            total=total or 0,
        )

    def _map_candidate_to_response(
        self, candidate: Candidate, target_job_id: uuid.UUID | None = None
    ) -> CandidateResponse:
        """Helper to map Candidate model to CandidateResponse schema."""
        resumes = getattr(candidate, "resumes", [])
        latest_resume = (
            max(resumes, key=lambda resume: resume.uploaded_at) if resumes else None
        )

        analysis = None
        is_parsed = True
        resume_score = None
        pass_fail = None
        processing_status = None
        processing_error = None
        location = candidate.location_name
        linkedin_url = None
        github_url = None

        search_sources = []
        if candidate.info and isinstance(candidate.info, dict):
            search_sources.append(candidate.info)

        if latest_resume:
            if latest_resume.parse_summary:
                search_sources.append(latest_resume.parse_summary)
                if "extracted_data" in latest_resume.parse_summary:
                    search_sources.append(latest_resume.parse_summary["extracted_data"])

            for source in search_sources:
                if not isinstance(source, dict):
                    continue

                if not location:
                    loc_val = source.get("location")
                    if isinstance(loc_val, str) and loc_val.strip().lower() not in (
                        "not mentioned",
                        "null",
                        "none",
                    ):
                        location = loc_val.strip()
                    elif isinstance(loc_val, list) and loc_val:
                        for entry in loc_val:
                            loc_text = ""
                            if isinstance(entry, dict):
                                loc_text = (
                                    entry.get("text") or entry.get("location") or ""
                                )
                            else:
                                loc_text = str(entry)

                            if loc_text and loc_text.strip().lower() not in (
                                "not mentioned",
                                "null",
                                "none",
                            ):
                                location = loc_text.strip()
                                break

                links = source.get("links") or source.get("social_links")
                if links:
                    if isinstance(links, str):
                        import re

                        link_list = [
                            link.strip() for link in re.split(r"[;,]", links) if link.strip()
                        ]
                    elif isinstance(links, list):
                        link_list = links
                    else:
                        link_list = []

                    for link_item in link_list:
                        url = ""
                        if isinstance(link_item, dict):
                            url = link_item.get("url") or link_item.get("text") or ""
                        elif isinstance(link_item, str):
                            url = link_item

                        if not url or not isinstance(url, str):
                            continue

                        url_lower = url.lower()
                        if "linkedin.com" in url_lower and not linkedin_url:
                            linkedin_url = url
                        elif "github.com" in url_lower and not github_url:
                            github_url = url

            is_parsed = bool(latest_resume.parsed)
            resume_score = latest_resume.resume_score
            pass_fail = latest_resume.pass_fail
            parse_summary = latest_resume.parse_summary or {}

            processing_info = parse_summary.get("processing", {})
            if isinstance(processing_info, dict):
                processing_status = processing_info.get("status")
                processing_error = processing_info.get("error")

            analysis_payload = parse_summary.get("analysis")
            if isinstance(analysis_payload, dict):
                analysis = ResumeMatchAnalysis.model_validate(analysis_payload)

        # Get latest HR decision
        hr_decisions = getattr(candidate, "hr_decisions", [])
        if not hr_decisions:
             hr_decisions = []

        if target_job_id:
            target_job_str = str(target_job_id).lower()
            filtered_decisions = []
            for d in hr_decisions:
                d_job_id = getattr(d, "job_id", None)
                if d_job_id:
                    if str(d_job_id).lower() == target_job_str:
                        filtered_decisions.append(d)
                else:
                    if str(candidate.applied_job_id).lower() == target_job_str:
                        filtered_decisions.append(d)
                    elif target_job_id:
                        filtered_decisions.append(d)
            hr_decisions = filtered_decisions

        latest_decision = None
        if hr_decisions:
            latest_decision = max(hr_decisions, key=lambda d: d.decided_at if d.decided_at else datetime.min.replace(tzinfo=timezone.utc))

        # Normalize decision string for frontend
        status = "Pending"
        if latest_decision:
            raw_status = str(latest_decision.decision).lower().strip()
            if raw_status == "approve":
                status = "Approve"
            elif raw_status == "reject":
                status = "Reject"
            elif raw_status in ["may be", "maybe"]:
                status = "May Be"
            else:
                status = latest_decision.decision

        # Get version history
        version_results = None
        if latest_resume and hasattr(latest_resume, "version_results") and latest_resume.version_results:
            version_results = [
                {
                    "id": str(vr.id),
                    "resume_id": str(vr.resume_id),
                    "job_id": str(vr.job_id),
                    "job_name": vr.job.title if vr.job else None,
                    "job_version_number": vr.job_version_number,
                    "resume_score": float(vr.resume_score) if vr.resume_score is not None else None,
                    "pass_fail": vr.pass_fail,
                    "analysis_data": vr.analysis_data,
                    "analyzed_at": vr.analyzed_at.isoformat() if vr.analyzed_at else None,
                }
                for vr in latest_resume.version_results
            ]
        
        # Get pipeline and current stage
        candidate_stages = getattr(candidate, "stages", [])
        if not candidate_stages:
            candidate_stages = []
        
        # Filter by target_job_id if provided
        effective_filter_job_id = target_job_id or candidate.applied_job_id
        if effective_filter_job_id:
            eff_job_str = str(effective_filter_job_id).lower()
            candidate_stages = [
                cs for cs in candidate_stages 
                if cs.job_stage and str(cs.job_stage.job_id).lower() == eff_job_str
            ]

        # Create a lookup for decisions by stage_config_id
        decisions_by_stage = {}
        for d in hr_decisions:
            if d.stage_config_id:
                # Keep the latest decision for each stage
                if d.stage_config_id not in decisions_by_stage or (
                    d.decided_at > decisions_by_stage[d.stage_config_id].decided_at
                ):
                    decisions_by_stage[d.stage_config_id] = d
        
        def _map_stage(cs) -> CandidateStageSummary:
            is_finished = cs.status in ["completed", "failed", "skipped"]
            response_status = "completed" if is_finished else cs.status
            
            # Default result based on status (this is the AI result if status is set by AI)
            ai_result_val = {
                "completed": "passed",
                "failed": "failed",
                "skipped": "skipped",
                "active": "ongoing",
                "pending": "pending",
            }.get(cs.status, cs.status)

            # Check for explicit HR decision
            hr_decision_val = None
            if cs.job_stage_id in decisions_by_stage:
                hr_decision_val = decisions_by_stage[cs.job_stage_id].decision

            # Result is primarily HR decision if it exists, otherwise AI result
            result_val = hr_decision_val or ai_result_val

            return CandidateStageSummary(
                stage_id=cs.id,
                template_name=cs.job_stage.template.name if cs.job_stage and cs.job_stage.template else "Unknown",
                status=response_status,
                order=cs.job_stage.stage_order if cs.job_stage else 0,
                job_id=cs.job_stage.job_id if cs.job_stage else None,
                job_name=cs.job_stage.job.title if cs.job_stage and cs.job_stage.job else None,
                completed_at=cs.completed_at,
                completed=is_finished,
                result=result_val,
                ai_result=ai_result_val,
                hr_decision=hr_decision_val
            )

        sorted_stages = sorted(candidate_stages, key=lambda x: x.job_stage.stage_order if x.job_stage else 0)
        pipeline = [_map_stage(cs) for cs in sorted_stages]
        
        current_stage = None
        for cs in candidate_stages:
            if cs.status == "active":
                current_stage = _map_stage(cs)
                break
        
        if not current_stage and pipeline:
            non_pending_stages = [s for s in pipeline if s.status != "pending"]
            if non_pending_stages:
                current_stage = non_pending_stages[-1]
            else:
                current_stage = pipeline[0]

        # Job Context Overrides
        mapping_job_id = effective_filter_job_id
        mapping_job_name = None
        is_cross_match = False
        
        if target_job_id and candidate.applied_job_id:
            if str(candidate.applied_job_id).lower() != str(target_job_id).lower():
                is_cross_match = True

        if mapping_job_id:
            if candidate.applied_job and str(candidate.applied_job.id).lower() == str(mapping_job_id).lower():
                mapping_job_name = candidate.applied_job.title
            elif latest_resume and hasattr(latest_resume, "version_results"):
                for vr in latest_resume.version_results:
                    if str(vr.job_id).lower() == str(mapping_job_id).lower():
                        mapping_job_name = vr.job.title if vr.job else None
                        break
        
        def _title(val: str | None) -> str | None:
            if not val: return val
            return val.strip().title()

        return CandidateResponse(
            id=candidate.id,
            first_name=_title(candidate.first_name),
            last_name=_title(candidate.last_name),
            email=candidate.email,
            phone=candidate.phone,
            location=location,
            linkedin_url=linkedin_url,
            github_url=github_url,
            current_status=candidate.current_status,
            applied_job_id=candidate.applied_job_id,
            applied_version_number=candidate.applied_version_number,
            job_id=mapping_job_id,
            job_name=mapping_job_name,
            is_cross_match=is_cross_match,
            resume_id=latest_resume.id if latest_resume else None,
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
            processing_error=processing_error,
            hr_decision=status,
            version_results=version_results,
            current_stage=current_stage,
            pipeline=pipeline,
        )


    async def delete_candidate_by_identifier(
        self, db: AsyncSession, identifier: str
    ) -> bool:
        """
        Delete a candidate by ID or Email for testing purposes.
        """
        # Try to parse identifier as UUID
        candidate_id = None
        try:
            candidate_id = uuid.UUID(identifier)
        except ValueError:
            pass

        if candidate_id:
            stmt = select(Candidate).where(Candidate.id == candidate_id)
        else:
            stmt = select(Candidate).where(Candidate.email == identifier)

        result = await db.execute(stmt)
        candidate = result.scalar_one_or_none()

        if not candidate:
            return False

        # 1. Manually cleanup interview-related data first (Evaluation -> Transcript -> Recording -> Interview)
        # This is necessary because Transcripts reference Files, and Files are cascaded from Candidate.
        from sqlalchemy import delete
        from app.v1.db.models.interviews import Interview
        from app.v1.db.models.transcripts import Transcript
        from app.v1.db.models.evaluations import Evaluation
        from app.v1.db.models.recordings import Recording

        # Get all interview IDs for this candidate
        interview_ids_stmt = select(Interview.id).where(Interview.candidate_id == candidate.id)
        interview_ids_res = await db.execute(interview_ids_stmt)
        interview_ids = [row[0] for row in interview_ids_res.all()]

        if interview_ids:
            # Delete Evaluations linked to these interviews
            await db.execute(delete(Evaluation).where(Evaluation.interview_id.in_(interview_ids)))
            # Delete Transcripts linked to these interviews
            await db.execute(delete(Transcript).where(Transcript.interview_id.in_(interview_ids)))
            # Delete Recordings linked to these interviews
            await db.execute(delete(Recording).where(Recording.interview_id.in_(interview_ids)))
            # Delete the Interviews themselves
            await db.execute(delete(Interview).where(Interview.id.in_(interview_ids)))

        # 2. Manually delete resume_chunks (no cascade in DB constraint)
        from sqlalchemy import text
        from app.v1.db.models.resumes import Resume
        resume_ids_result = await db.execute(
            select(Resume.id).where(Resume.candidate_id == candidate.id)
        )
        resume_ids = [row[0] for row in resume_ids_result.all()]
        if resume_ids:
            await db.execute(
                text("DELETE FROM resume_chunks WHERE resume_id = ANY(:ids)"),
                {"ids": resume_ids}
            )

        await db.delete(candidate)
        await db.commit()
        return True



    async def get_candidate_timeline(
        self, 
        db: AsyncSession, 
        candidate_id: uuid.UUID, 
        job_id: uuid.UUID | None = None,
        query: str | None = None
    ) -> dict[str, Any]:
        """
        Aggregate stages, decisions, and results into a chronological timeline.
        Consolidates redundant events and ensures logical sequencing.
        """
        from app.v1.db.models.candidate_stages import CandidateStage
        from app.v1.db.models.hr_decisions import HrDecision
        from app.v1.db.models.evaluations import Evaluation
        from app.v1.db.models.job_stage_configs import JobStageConfig
        from sqlalchemy import select, and_, or_
        from sqlalchemy.orm import selectinload
        from app.v1.db.models.resumes import Resume
        from app.v1.db.models.resume_version_results import ResumeVersionResult
        from app.v1.db.models.candidates import Candidate

        # Fetch candidate for base created_at fallback
        candidate = await db.get(Candidate, candidate_id)
        if not candidate:
             raise HTTPException(status_code=404, detail="Candidate not found")
             
        created_at_fallback = candidate.created_at

        events_map = {} # Keyed by (event_type, stage_id) or unique string

        # 1. Fetch Stages
        stmt = select(CandidateStage).join(JobStageConfig).where(CandidateStage.candidate_id == candidate_id).options(
            selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.template)
        )
        if job_id:
            stmt = stmt.where(JobStageConfig.job_id == job_id)
        
        stages = (await db.execute(stmt)).scalars().all()

        # Build a map for easy lookup by JobStageConfig ID to match with Decisions
        config_to_candidate_stage_map = {s.job_stage_id: s.id for s in stages}
        
        # Track the 'first' stage (usually Resume Screening) per job for consolidation
        first_stage_per_job = {} # job_id -> event_key
        
        for stage in stages:
            # Fetch latest evaluation for this stage
            eval_stmt = select(Evaluation).where(Evaluation.candidate_stage_id == stage.id).order_by(Evaluation.created_at.desc()).limit(1)
            eval_obj = (await db.execute(eval_stmt)).scalar_one_or_none()

            title = stage.job_stage.template.name if stage.job_stage else "Unknown Stage"
            
            metadata = stage.evaluation_data
            if eval_obj:
                result = eval_obj.result
                score = eval_obj.overall_score
                
                # Format to match exactly what evaluation_service.py returns for the Evaluation API
                signals = stage.evaluation_data.get("signals", {}) if stage.evaluation_data else {}
                is_hr_round = "hr screening" in title.lower()
                
                metadata = {
                    "id": str(eval_obj.id),
                    "interview_id": str(eval_obj.interview_id) if eval_obj.interview_id else None,
                    "transcript_id": str(eval_obj.transcript_id) if eval_obj.transcript_id else None,
                    "candidate_stage_id": str(eval_obj.candidate_stage_id),
                    "version": eval_obj.attempt_number,
                    "overall_score": float(eval_obj.overall_score) if eval_obj.overall_score is not None else None,
                    "result": eval_obj.result,
                    "created_at": eval_obj.created_at.isoformat() if eval_obj.created_at else None,
                }
                
                # Only include detailed AI insights for non-HR rounds
                if not is_hr_round:
                    metadata["evaluation_data"] = eval_obj.structured_evaluation_data
                    metadata["highlights"] = eval_obj.highlights
                    metadata["sim_jd_resume"] = float(eval_obj.sim_jd_resume) if eval_obj.sim_jd_resume is not None else signals.get("profile_fit", 0.0)
                    metadata["sim_jd_transcript"] = float(eval_obj.sim_jd_transcript) if eval_obj.sim_jd_transcript is not None else signals.get("tech_alignment", 0.0)
                    metadata["sim_resume_transcript"] = float(eval_obj.sim_resume_transcript) if eval_obj.sim_resume_transcript is not None else signals.get("consistency", 0.0)
            else:
                result = {
                    "completed": "passed",
                    "failed": "failed",
                    "skipped": "skipped",
                    "active": "ongoing",
                    "pending": "pending",
                }.get(stage.status, "Pending")
                score = None
                
            event_date = stage.started_at or created_at_fallback
            event_key = f"stage_{stage.id}"
            
            events_map[event_key] = {
                "event_type": "stage",
                "event_date": event_date,
                "title": title,
                "description": f"Candidate was in {title}",
                "result": result,
                "score": float(score) if score is not None else None,
                "stage_id": stage.id,
                "stage_name": title,
                "job_id": stage.job_stage.job_id,
                "stage_order": stage.job_stage.stage_order if stage.job_stage else 0,
                "metadata": metadata
            }
            
            # Track as first stage if order is 0 or matches name patterns
            if stage.job_stage and stage.job_stage.stage_order == 0:
                first_stage_per_job[stage.job_stage.job_id] = event_key
            elif "screening" in title.lower() or "resume" in title.lower():
                # Fallback matching for non-zero order if it's the lowest one found so far
                existing_key = first_stage_per_job.get(stage.job_stage.job_id)
                if not existing_key or events_map[existing_key]["stage_order"] > stage.job_stage.stage_order:
                    first_stage_per_job[stage.job_stage.job_id] = event_key

        # 2. Fetch Resume Screening (Stage 0) and Consolidate
        resume_stmt = (
            select(ResumeVersionResult)
            .join(Resume, ResumeVersionResult.resume_id == Resume.id)
            .where(Resume.candidate_id == candidate_id)
            .options(selectinload(ResumeVersionResult.job))
            .order_by(ResumeVersionResult.analyzed_at.desc())
        )
        if job_id:
            resume_stmt = resume_stmt.where(ResumeVersionResult.job_id == job_id)
        
        resume_results = (await db.execute(resume_stmt)).scalars().all()
        
        seen_job_screenings = set()
        for r_res in resume_results:
            if r_res.job_id in seen_job_screenings:
                continue
            seen_job_screenings.add(r_res.job_id)
            
            # 🌟 CONSOLIDATION MAGIC: Check if we have a stage to merge into
            target_stage_key = first_stage_per_job.get(r_res.job_id)
            
            if target_stage_key and target_stage_key in events_map:
                # Merge into existing stage
                ev = events_map[target_stage_key]
                if "AI matched resume" not in ev["description"]:
                    ev["description"] = f"AI matched resume. {ev['description']}"
                
                # Merge metadata
                if not ev["metadata"] or not isinstance(ev["metadata"], dict):
                    ev["metadata"] = {}
                
                # Add Resume Screening data directly to metadata
                ev["metadata"].update(r_res.analysis_data or {})
                resume_score_val = float(r_res.resume_score) if r_res.resume_score is not None else None
                ev["metadata"]["resume_score"] = resume_score_val
                
                # For HR Screening, specifically suppress detailed interview criteria and clarify scores
                if "hr screening" in ev["title"].lower():
                    if "evaluation_data" in ev["metadata"]:
                        del ev["metadata"]["evaluation_data"]
                    
                    # Rename interview score for clarity if it exists
                    if "overall_score" in ev["metadata"]:
                        ev["metadata"]["interview_score"] = ev["metadata"].pop("overall_score")
                    
                    # 🌟 IMPORTANT: Prioritize Resume Match Score as the primary 'Screening' score
                    if resume_score_val is not None:
                        ev["score"] = resume_score_val
                else:
                    # If stage has no score, use resume score as fallback
                    if ev.get("score") is None:
                        ev["score"] = resume_score_val
                
                # Use analysis date if earlier than stage start (usually is)
                if r_res.analyzed_at and r_res.analyzed_at < ev["event_date"]:
                    ev["event_date"] = r_res.analyzed_at
            else:
                # Add as standalone event if no stage found
                event_key = f"screening_{r_res.id}"
                events_map[event_key] = {
                    "event_type": "screening",
                    "event_date": r_res.analyzed_at or created_at_fallback,
                    "title": "Resume Screening",
                    "description": f"AI matched resume against {r_res.job.title if r_res.job else 'job'}",
                    "result": r_res.pass_fail,
                    "score": float(r_res.resume_score) if r_res.resume_score is not None else None,
                    "job_id": r_res.job_id,
                    "stage_id": None,
                    "stage_name": "Resume Screening",
                    "stage_order": 0,
                    "metadata": r_res.analysis_data
                }

        # 3. Fetch HR Decisions and enrich stages
        decision_stmt = select(HrDecision).where(HrDecision.candidate_id == candidate_id).options(
            selectinload(HrDecision.stage_config).selectinload(JobStageConfig.template)
        )
        if job_id:
            decision_stmt = decision_stmt.where(HrDecision.job_id == job_id)
        
        decisions = (await db.execute(decision_stmt)).scalars().all()

        for dec in decisions:
            candidate_stage_id = config_to_candidate_stage_map.get(dec.stage_config_id)
            stage_key = f"stage_{candidate_stage_id}" if candidate_stage_id else None
            
            if stage_key and stage_key in events_map:
                ev = events_map[stage_key]
                ev["result"] = dec.decision
                if dec.notes:
                    ev["description"] = f"{ev['description']}. HR Notes: {dec.notes}"
                # Use decision date as the event date if it's the latest thing that happened in this stage
                if dec.decided_at and dec.decided_at > ev["event_date"]:
                    ev["event_date"] = dec.decided_at

        # 4. Finalize and Sort
        events = list(events_map.values())
        
        if query:
            q_lower = query.lower()
            events = [
                e for e in events 
                if q_lower in e["title"].lower() or 
                   (e["description"] and q_lower in e["description"].lower()) or
                   (e["result"] and q_lower in (e["result"] or "").lower())
            ]

        def sort_key(x):
            # Sort primarily by stage_order (lowest first) then by date (earliest first)
            # This shows the hiring journey from start to finish (Pipeline order)
            dt = x["event_date"]
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return (x["stage_order"], dt)

        events.sort(key=sort_key)

        # 4. Determine Latest Decision & Current Stage (Sync with CandidateResponse logic)
        latest_decision = "Pending"
        if decisions:
            sorted_decisions = sorted(decisions, key=lambda d: d.decided_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
            latest_decision = sorted_decisions[0].decision

        current_stage_name = "Resume Screening"
        if stages:
            active_stages = [s for s in stages if s.status == "active"]
            if active_stages:
                sorted_active = sorted(active_stages, key=lambda s: s.job_stage.stage_order if s.job_stage else 0)
                current_stage_name = sorted_active[0].job_stage.template.name if sorted_active[0].job_stage else "Unknown"
            else:
                finished_stages = [s for s in stages if s.status in ["completed", "failed", "skipped"]]
                if finished_stages:
                    sorted_finished = sorted(finished_stages, key=lambda s: s.job_stage.stage_order if s.job_stage else 0, reverse=True)
                    current_stage_name = sorted_finished[0].job_stage.template.name if sorted_finished[0].job_stage else "Unknown"
                else:
                    sorted_all = sorted(stages, key=lambda s: s.job_stage.stage_order if s.job_stage else 0)
                    current_stage_name = sorted_all[0].job_stage.template.name if sorted_all[0].job_stage else "Unknown"

        return {
            "candidate_id": candidate_id,
            "latest_decision": latest_decision,
            "current_stage": current_stage_name,
            "events": events
        }


candidate_admin_service = CandidateAdminService()
