"""
Schema converters and status builders for resume processing.
"""

from __future__ import annotations

import uuid
from typing import Any

from app.v1.schemas.upload import (
    JobResumeInfoResponse,
    ResumeMatchAnalysis,
    ResumeProcessingInfo,
    ResumeStatusResponse,
    ResumeUploadResponse,
)


def build_processing_info(
    *,
    status_value: str,
    error: str | None = None,
) -> dict[str, str]:
    """Build a dictionary representing resume processing status.

    Args:
        status_value: The string status (e.g., 'queued', 'processing', 'completed', 'failed').
        error: Optional error message if the processing failed.

    Returns:
        A dictionary with status and optional error.
    """
    processing = {"status": status_value}
    if error:
        processing["error"] = error
    return processing


def merge_processing_info(
    parse_summary: dict[str, object] | None,
    *,
    status_value: str,
    error: str | None = None,
) -> dict[str, object]:
    """Merge new processing info into an existing parse summary dictionary.

    Args:
        parse_summary: Existing summary or None.
        status_value: New status string.
        error: Optional new error message.

    Returns:
        Updated parse summary dictionary.
    """
    summary = dict(parse_summary or {})
    summary["processing"] = build_processing_info(
        status_value=status_value,
        error=error,
    )
    return summary


def parse_processing_info(
    parse_summary: dict[str, object] | None,
) -> ResumeProcessingInfo:
    """Extract ResumeProcessingInfo schema from a raw parse summary dict.

    Args:
        parse_summary: The raw dictionary containing processing info.

    Returns:
        A validated ResumeProcessingInfo object.
    """
    processing = parse_summary.get("processing", {}) if parse_summary else {}
    status_value = str(processing.get("status", "queued"))
    error = processing.get("error")
    return ResumeProcessingInfo(
        status=status_value,
        error=str(error) if error else None,
    )


def status_response_from_resume(
    *,
    job_id: uuid.UUID,
    resume_record: Any,
) -> ResumeStatusResponse:
    """Convert a resume database record into a ResumeStatusResponse schema.

    Args:
        job_id: The job ID.
        resume_record: The Resume ORM object.

    Returns:
        A populated ResumeStatusResponse.
    """
    parse_summary = getattr(resume_record, "parse_summary", None) or {}
    analysis_payload = parse_summary.get("analysis")
    analysis = (
        ResumeMatchAnalysis.model_validate(analysis_payload)
        if isinstance(analysis_payload, dict)
        else None
    )
    candidate = getattr(resume_record, "candidate")
    file_record = getattr(resume_record, "file")

    return ResumeStatusResponse(
        job_id=job_id,
        candidate_id=candidate.id,
        file_id=file_record.id,
        resume_id=resume_record.id,
        file_name=file_record.file_name,
        file_type=file_record.file_type,
        size=file_record.size,
        source_url=file_record.source_url,
        parsed=bool(getattr(resume_record, "parsed", False)),
        processing=parse_processing_info(parse_summary),
        analysis=analysis,
    )


def upload_response_from_records(
    *,
    job_id: uuid.UUID,
    candidate_id: uuid.UUID,
    file_record: Any,
    resume_record: Any,
) -> ResumeUploadResponse:
    """Convert upload records into a ResumeUploadResponse schema.

    Args:
        job_id: The job ID.
        candidate_id: The candidate ID.
        file_record: The FileRecord ORM object.
        resume_record: The Resume ORM object.

    Returns:
        A populated ResumeUploadResponse.
    """
    processing = parse_processing_info(getattr(resume_record, "parse_summary", None))
    return ResumeUploadResponse(
        message="Resume uploaded successfully. Processing started.",
        job_id=job_id,
        candidate_id=candidate_id,
        file_id=file_record.id,
        resume_id=resume_record.id,
        file_name=file_record.file_name,
        file_type=file_record.file_type,
        size=file_record.size,
        source_url=file_record.source_url,
        parsed=bool(getattr(resume_record, "parsed", False)),
        processing=processing,
        analysis=None,
    )


def job_resume_response_from_resume(
    *,
    job_id: uuid.UUID,
    resume_record: Any,
) -> JobResumeInfoResponse:
    """Convert a resume record into a JobResumeInfoResponse schema.

    Args:
        job_id: The job ID.
        resume_record: The Resume ORM object.

    Returns:
        A populated JobResumeInfoResponse.
    """
    parse_summary = getattr(resume_record, "parse_summary", None) or {}
    analysis_payload = parse_summary.get("analysis")
    analysis = (
        ResumeMatchAnalysis.model_validate(analysis_payload)
        if isinstance(analysis_payload, dict)
        else None
    )
    candidate = getattr(resume_record, "candidate")
    file_record = getattr(resume_record, "file")

    return JobResumeInfoResponse(
        job_id=job_id,
        candidate_id=candidate.id,
        candidate_first_name=candidate.first_name,
        candidate_last_name=candidate.last_name,
        candidate_email=candidate.email,
        file_id=file_record.id,
        resume_id=resume_record.id,
        file_name=file_record.file_name,
        file_type=file_record.file_type,
        size=file_record.size,
        source_url=file_record.source_url,
        uploaded_at=resume_record.uploaded_at,
        parsed=bool(getattr(resume_record, "parsed", False)),
        processing=parse_processing_info(parse_summary),
        analysis=analysis,
        resume_score=(
            float(resume_record.resume_score)
            if getattr(resume_record, "resume_score", None) is not None
            else None
        ),
        pass_fail=getattr(resume_record, "pass_fail", None),
    )
