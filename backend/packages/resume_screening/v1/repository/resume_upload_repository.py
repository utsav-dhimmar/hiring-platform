"""
Resume upload repository module.

This module provides the data access layer for resume upload operations,
including candidate creation, file recording, and resume parsing summary storage.
"""

from datetime import UTC, datetime
import uuid

from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidate_skills import candidate_skills
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.files import File as FileRecord
from app.v1.db.models.jobs import Job
from app.v1.db.models.job_skills import job_skills
from app.v1.db.models.resume_chunks import ResumeChunk
from app.v1.db.models.resumes import Resume
from app.v1.db.models.skills import Skill


class ResumeUploadRepository:
    """Repository for resume upload database operations.

    Provides methods for managing candidates, file records, and resume data
    during the resume screening process.
    """

    async def get_job(self, db: AsyncSession, job_id: uuid.UUID) -> Job | None:
        """Retrieve a job by its unique ID.

        Args:
            db: The async database session.
            job_id: The UUID of the job to retrieve.

        Returns:
            The job object if found, None otherwise.
        """
        return await db.get(Job, job_id)

    async def get_candidate_for_job_and_email(
        self,
        self_db: AsyncSession,
        *,
        job_id: uuid.UUID,
        email: str,
    ) -> Candidate | None:
        """Get a candidate for a specific job by their email address.

        Args:
            db: The async database session.
            job_id: The ID of the job the candidate applied for.
            email: The candidate's email address.

        Returns:
            The candidate object if found, None otherwise.
        """
        return await self_db.scalar(
            select(Candidate).where(
                Candidate.applied_job_id == job_id,
                Candidate.email == email,
            )
        )

    async def create_candidate(
        self,
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
        email: str,
        first_name: str | None,
        last_name: str | None,
    ) -> Candidate:
        """Create a new candidate record.

        Args:
            db: The async database session.
            job_id: The ID of the job being applied for.
            email: The candidate's email address.
            first_name: The candidate's first name.
            last_name: The candidate's last name.

        Returns:
            The newly created candidate object.
        """
        candidate = Candidate(
            first_name=first_name,
            last_name=last_name,
            email=email,
            applied_job_id=job_id,
            current_status="applied",
        )
        db.add(candidate)
        await db.flush()
        return candidate

    async def create_file_record(
        self,
        db: AsyncSession,
        *,
        owner_id: uuid.UUID,
        candidate_id: uuid.UUID,
        file_name: str,
        file_type: str,
        source_url: str,
        size: int,
    ) -> FileRecord:
        """Create a new file record for an uploaded resume.

        Args:
            db: The async database session.
            owner_id: The ID of the user who owns the file.
            candidate_id: The ID of the candidate the file belongs to.
            file_name: The name of the file.
            file_type: The MIME type or extension of the file.
            source_url: The URL or path where the file is stored.
            size: The size of the file in bytes.

        Returns:
            The newly created file record object.
        """
        file_record = FileRecord(
            owner_id=owner_id,
            candidate_id=candidate_id,
            file_name=file_name,
            file_type=file_type,
            source_url=source_url,
            size=size,
        )
        db.add(file_record)
        await db.flush()
        return file_record

    async def create_resume_record(
        self,
        db: AsyncSession,
        *,
        candidate_id: uuid.UUID,
        file_id: uuid.UUID,
        parse_summary: dict[str, object],
        parsed: bool = True,
        resume_score: float | None = None,
        pass_fail: bool | None = None,
    ) -> Resume:
        """Create a new resume record with parsing summary.

        Args:
            db: The async database session.
            candidate_id: The ID of the candidate.
            file_id: The ID of the associated file record.
            parse_summary: A dictionary containing the extracted summary data.

        Returns:
            The newly created resume record object.
        """
        resume_record = Resume(
            candidate_id=candidate_id,
            file_id=file_id,
            parsed=parsed,
            parse_summary=parse_summary,
            resume_score=resume_score,
            pass_fail=pass_fail,
        )
        db.add(resume_record)
        await db.flush()
        return resume_record

    async def create_resume_chunk(
        self,
        db: AsyncSession,
        *,
        resume_id: uuid.UUID,
        parsed_json: dict[str, object],
        raw_text: str,
        chunk_embedding: list[float] | None = None,
    ) -> None:
        """Create a new resume chunk for detailed extraction data.

        Args:
            db: The async database session.
            resume_id: The ID of the associated resume record.
            parsed_json: The detailed structured data from the resume.
            raw_text: The full raw text extracted from the resume.
        """
        db.add(
            ResumeChunk(
                resume_id=resume_id,
                parsed_at=datetime.now(UTC),
                parsed_json=parsed_json,
                raw_text=raw_text,
                chunk_embedding=chunk_embedding,
            )
        )

    async def update_candidate_profile(
        self,
        db: AsyncSession,
        *,
        candidate: Candidate,
        first_name: str | None = None,
        last_name: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        info: dict[str, object],
        info_embedding: list[float] | None = None,
    ) -> Candidate:
        """Update a candidate's profile information.

        Args:
            db: The async database session.
            candidate: The candidate object to update.
            first_name: Updated first name.
            last_name: Updated last name.
            email: Updated email address.
            phone: Updated phone number.
            info: A dictionary containing additional candidate information.
            info_embedding: Vector embedding of candidate info.

        Returns:
            The updated candidate object.
        """
        candidate.first_name = first_name or candidate.first_name
        candidate.last_name = last_name or candidate.last_name

        # Only update email/phone if they were found in extraction and current ones are placeholders or empty
        if email and (not candidate.email or "pending_" in candidate.email):
            candidate.email = email
        if phone and not candidate.phone:
            candidate.phone = phone

        candidate.info = info
        candidate.info_embedding = info_embedding
        await db.flush()
        return candidate

    async def get_job_skills(
        self,
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
    ) -> list[Skill]:
        """Retrieve all skills associated with a specific job.

        Args:
            db: The async database session.
            job_id: The UUID of the job.

        Returns:
            A list of Skill objects.
        """
        return list(
            (
                await db.scalars(
                    select(Skill)
                    .join(job_skills, job_skills.c.skill_id == Skill.id)
                    .where(job_skills.c.job_id == job_id)
                )
            ).all()
        )

    async def get_resume_for_job(
        self,
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        owner_id: uuid.UUID | None = None,
    ) -> Resume | None:
        """Retrieve a specific resume record for a job, with optional ownership check.

        Args:
            db: The async database session.
            job_id: The UUID of the job.
            resume_id: The UUID of the resume.
            owner_id: Optional UUID of the user who owns the file.

        Returns:
            The Resume object if found, None otherwise.
        """
        query = (
            select(Resume)
            .options(
                selectinload(Resume.candidate),
                selectinload(Resume.file),
            )
            .join(Candidate, Candidate.id == Resume.candidate_id)
            .join(FileRecord, FileRecord.id == Resume.file_id)
            .where(
                Resume.id == resume_id,
                Candidate.applied_job_id == job_id,
            )
        )
        if owner_id is not None:
            query = query.where(FileRecord.owner_id == owner_id)
        return await db.scalar(query)

    async def mark_resume_failed(
        self,
        db: AsyncSession,
        *,
        resume_id: uuid.UUID,
        parse_summary: dict[str, object],
    ) -> None:
        """Mark a resume as failed in the database.

        Args:
            db: The async database session.
            resume_id: The UUID of the resume.
            parse_summary: A dictionary containing error details and status.
        """
        await db.execute(
            update(Resume)
            .where(Resume.id == resume_id)
            .values(
                parsed=False,
                parse_summary=parse_summary,
                resume_score=None,
                pass_fail=None,
            )
        )

    async def update_job_embedding(
        self,
        db: AsyncSession,
        *,
        job: Job,
        embedding: list[float],
    ) -> None:
        """Update the vector embedding for a job's description.

        Args:
            db: The async database session.
            job: The Job object to update.
            embedding: The vector embedding list.
        """
        job.jd_embedding = embedding
        await db.flush()

    async def update_skill_embeddings(
        self,
        db: AsyncSession,
        *,
        embeddings_by_skill_id: dict[uuid.UUID, list[float]],
    ) -> None:
        """Update vector embeddings for multiple skills.

        Args:
            db: The async database session.
            embeddings_by_skill_id: A dictionary mapping skill IDs to their embeddings.
        """
        if not embeddings_by_skill_id:
            return

        skills = (
            await db.scalars(
                select(Skill).where(Skill.id.in_(list(embeddings_by_skill_id)))
            )
        ).all()
        for skill in skills:
            skill.skill_embedding = embeddings_by_skill_id[skill.id]
        await db.flush()

    async def sync_candidate_skills(
        self,
        db: AsyncSession,
        *,
        candidate_id: uuid.UUID,
        skill_names: list[str],
    ) -> list[Skill]:
        """Synchronize a candidate's skills, creating new skills if necessary.

        Args:
            db: The async database session.
            candidate_id: The ID of the candidate.
            skill_names: A list of skill names to associate with the candidate.
        """
        if not skill_names:
            return []

        existing_skills = (
            await db.scalars(select(Skill).where(Skill.name.in_(skill_names)))
        ).all()
        skills_by_name = {skill.name.lower(): skill for skill in existing_skills}

        for skill_name in skill_names:
            key = skill_name.lower()
            if key in skills_by_name:
                continue
            skill = Skill(name=skill_name)
            db.add(skill)
            await db.flush()
            skills_by_name[key] = skill

        existing_links = await db.execute(
            select(candidate_skills.c.skill_id).where(
                candidate_skills.c.candidate_id == candidate_id
            )
        )
        linked_skill_ids = {row[0] for row in existing_links}

        rows_to_insert = [
            {"candidate_id": candidate_id, "skill_id": skill.id}
            for skill in skills_by_name.values()
            if skill.id not in linked_skill_ids
        ]
        if rows_to_insert:
            await db.execute(insert(candidate_skills), rows_to_insert)
        return list(skills_by_name.values())

    async def get_candidates_for_job(
        self,
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
    ) -> list[Candidate]:
        """Get all candidates for a specific job with their resumes.

        Args:
            db: The async database session.
            job_id: The ID of the job.

        Returns:
            A list of candidate objects with their resumes.
        """
        return list(
            (
                await db.scalars(
                    select(Candidate)
                    .options(
                        selectinload(Candidate.resumes).selectinload(Resume.file),
                    )
                    .where(Candidate.applied_job_id == job_id)
                )
            ).all()
        )

    async def get_resumes_for_job(
        self,
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
    ) -> list[Resume]:
        """Retrieve all resume records for a specific job, ordered by upload date.

        Args:
            db: The async database session.
            job_id: The UUID of the job.

        Returns:
            A list of Resume objects.
        """
        return list(
            (
                await db.scalars(
                    select(Resume)
                    .options(
                        selectinload(Resume.candidate),
                        selectinload(Resume.file),
                    )
                    .join(Candidate, Candidate.id == Resume.candidate_id)
                    .where(Candidate.applied_job_id == job_id)
                    .order_by(Resume.uploaded_at.desc())
                )
            ).all()
        )

    async def commit(self, db: AsyncSession) -> None:
        """Commit the current transaction.

        Args:
            db: The async database session.
        """
        await db.commit()

    async def flush(self, db: AsyncSession) -> None:
        """Flush the current session changes to the database.

        Args:
            db: The async database session.
        """
        await db.flush()

    async def rollback(self, db: AsyncSession) -> None:
        """Roll back the current transaction.

        Args:
            db: The async database session.
        """
        await db.rollback()

    async def refresh_file_and_resume(
        self,
        db: AsyncSession,
        *,
        file_record: FileRecord,
        resume_record: Resume,
    ) -> None:
        """Refresh the state of file and resume records from the database.

        Args:
            db: The async database session.
            file_record: The file record object to refresh.
            resume_record: The resume record object to refresh.
        """
        await db.refresh(file_record)
        await db.refresh(resume_record)


resume_upload_repository = ResumeUploadRepository()
