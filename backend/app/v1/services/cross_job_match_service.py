import uuid
import math
import logging
import asyncio
from typing import List, Dict, Any

from sentence_transformers import CrossEncoder

from app.v1.db.session import async_session_maker
from app.v1.repository.cross_job_match_repository import cross_job_match_repository
from app.v1.core.embeddings import embedding_service
from app.v1.utils.text import build_job_text, build_candidate_text
from app.v1.db.models.resume_chunks import ResumeChunk
from app.v1.core.config import settings
from app.v1.core.heuristic_analyzer import heuristic_analyzer
from sqlalchemy import select

_log = logging.getLogger(__name__)

CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_SHORTLIST_N = 20        # bi-encoder narrows to this many
_FINAL_N = 10            # reranker keeps this many
_MIN_SCORE_TO_STORE = 40.0

class CrossJobMatchService:
    """Service for cross-job matching using bi-encoder and cross-encoder reranking."""

    async def run_cross_match(self, *, resume_id: uuid.UUID, original_job_id: uuid.UUID) -> None:
        """Execute the two-stage cross-job matching process.
        
        1. Bi-encoder: fast similarity shortlist (top 20).
        2. Cross-encoder: precise reranking (top 10).
        """
        async with async_session_maker() as db:
            # Stage 0: Load resume and its embedding
            resume = await cross_job_match_repository.get_resume_with_embedding(db, resume_id=resume_id)
            if not resume or resume.resume_embedding is None:
                _log.warning("No embedding found for resume_id=%s. Skipping cross-match.", resume_id)
                return

            # Stage 1: Bi-encoder shortlist (fast)
            other_jobs = await cross_job_match_repository.get_all_active_jobs_with_embeddings(
                db, exclude_job_id=original_job_id
            )
            if not other_jobs:
                _log.info("No other active jobs with embeddings found for cross-matching.")
                return

            scored_shortlist = []
            for job in other_jobs:
                bi_score = embedding_service.get_semantic_score_from_embeddings(
                    resume.resume_embedding, job.jd_embedding
                )
                _log.info("Job %s | Bi-Score: %s", job.id, bi_score)
                scored_shortlist.append({"job": job, "bi_score": bi_score})

            # Sort by bi_score descending and take top N
            scored_shortlist.sort(key=lambda x: x["bi_score"], reverse=True)
            shortlist = scored_shortlist[:_SHORTLIST_N]

            if not shortlist:
                await cross_job_match_repository.upsert_matches(
                    db, resume_id=resume_id, original_job_id=original_job_id, matches=[]
                )
                await db.commit()
                return

        
            # Need raw resume text reconstructed from ResumeChunk
            result = await db.execute(
                select(ResumeChunk.parsed_json, ResumeChunk.raw_text)
                .where(ResumeChunk.resume_id == resume_id)
                .limit(1)
            )
            chunk_data = result.first()
            
            if chunk_data:
                resume_text = build_candidate_text(
                    parsed_summary=chunk_data.parsed_json or {},
                    raw_text=chunk_data.raw_text or ""
                )
                candidate_skills = (chunk_data.parsed_json or {}).get("skills", [])
            else:
                _log.warning("No ResumeChunk found for resume_id=%s. Falling back to bi-encoder scores.", resume_id)
                resume_text = None
                candidate_skills = []

            final_matches = []
            if resume_text:
                # Use Heuristic (Local) or LLM analysis depending on settings
                for item in shortlist:
                    try:
                        job = item["job"]
                        from app.v1.repository.resume_upload_repository import resume_upload_repository
                        job_skills = await resume_upload_repository.get_job_skills(db, job_id=job.id)
                        
                        if settings.USE_LLM_FOR_ANALYSIS: # renamed from USE_LLM_FOR_CROSS_MATCH to be consistent
                            from app.v1.core.analyzer import ResumeJdAnalyzer
                            analyzer = ResumeJdAnalyzer()
                            analysis = analyzer.analyze(
                                resume_text=resume_text,
                                job_text=build_job_text(job),
                                job_skills=[s.name for s in job_skills],
                                candidate_skills=candidate_skills,
                                semantic_score=item["bi_score"]
                            )
                        else:
                            analysis = heuristic_analyzer.analyze(
                                resume_text=resume_text,
                                job_text=build_job_text(job),
                                job_skills=[s.name for s in job_skills],
                                candidate_skills=candidate_skills,
                                semantic_score=item["bi_score"]
                            )
                        
                        item["final_score"] = analysis["match_percentage"]
                    except Exception:
                        _log.exception("Reranking failed for job=%s", item["job"].id)
                        item["final_score"] = round(item["bi_score"], 2)
                for item in shortlist:
                    item["final_score"] = round(item["bi_score"], 2)

            # Stage 3: Keep top-N above threshold
            reranked = sorted(shortlist, key=lambda x: x["final_score"], reverse=True)
            _log.info("Reranked matches: %s", [{ "id": str(i["job"].id), "score": i["final_score"] } for i in reranked])
            top_matches = [
                {"matched_job_id": item["job"].id, "match_score": item["final_score"]}
                for item in reranked
                if item["final_score"] >= 0.0
            ][:_FINAL_N]

            # Persist results
            await cross_job_match_repository.upsert_matches(
                db, 
                resume_id=resume_id, 
                original_job_id=original_job_id, 
                matches=top_matches
            )
            await db.commit()
            _log.info("Cross-job matches updated for resume_id=%s. Found %d matches.", resume_id, len(top_matches))

cross_job_match_service = CrossJobMatchService()
