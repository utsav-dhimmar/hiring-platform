import hashlib
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.files import File as DBFile
from app.v1.db.models.interviews import Interview
from app.v1.db.models.transcript_chunks import TranscriptChunk
from app.v1.db.models.transcripts import Transcript
from app.v1.db.models.evaluations import Evaluation
from app.v1.utils.transcript_parser import process_transcript_file
from app.v1.core.storage import resolve_storage_path
from app.v1.services.evaluation_tasks import evaluate_candidate_transcript_task

router = APIRouter(prefix="/transcripts", tags=["transcripts"])

@router.post("/upload/{candidate_stage_id}")
async def upload_transcript(
    candidate_stage_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an interview transcript (.docx, .pdf) for a candidate stage.
    
    Takes the candidate_stage_id directly, looks up the candidate and stage,
    processes the file (cleans, chunks, embeds), and triggers AI evaluation.
    """
    # 1. Validate File Ext
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = ""
    if "." in file.filename:
        ext = f".{file.filename.split('.')[-1].lower()}"
        
    if ext not in {".docx", ".pdf", ".txt"}:
        raise HTTPException(status_code=400, detail="Only .docx, .pdf, and .txt files are allowed for transcripts.")

    # 2. Fetch the CandidateStage directly
    current_stage = await db.get(CandidateStage, candidate_stage_id, options=[selectinload(CandidateStage.job_stage)])
    if not current_stage:
        raise HTTPException(status_code=404, detail="Candidate stage not found")

    candidate_id = current_stage.candidate_id

    # 3. Fetch Candidate
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 4. Save File to Disk
    content = await file.read()
    
    import os
    filename = f"{uuid.uuid4()}_{file.filename}"
    storage_path = f"uploads/transcripts/{filename}"
    abs_path = resolve_storage_path(storage_path)
    
    # Ensure directory exists
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(abs_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 5. Update Candidate Stage Status to Processing
    current_stage.status = "processing"
    await db.commit()
    
    # 6. Trigger Celery Task for Asynchronous Processing
    from app.v1.services.transcript_tasks import process_transcript_task
    print(f"DEBUG: Triggering Transcript Processing task for candidate_stage {current_stage.id}")
    try:
        task = process_transcript_task.delay(str(current_stage.id), storage_path, file.filename)
        print(f"DEBUG: Task successfully sent to Redis. Task ID: {task.id}")
    except Exception as celery_err:
        print(f"ERROR: Failed to send task to Celery: {celery_err}")

    return {
        "message": "Transcript uploaded successfully. Processing has started in the background.",
        "candidate_stage_id": current_stage.id,
        "next_step": "Transcript parsing and AI Evaluation are running in the background."
    }



@router.get("/{transcript_id}")
async def get_transcript(
    transcript_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a specific transcript by its ID."""
    transcript = await db.get(Transcript, transcript_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return transcript

@router.get("/candidate/{candidate_id}")
async def get_candidate_transcript(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the transcript(s) for a specific candidate."""
    query = (
        select(Transcript)
        .join(Interview, Transcript.interview_id == Interview.id)
        .where(Interview.candidate_id == candidate_id)
    )
    result = await db.execute(query)
    transcripts = result.scalars().all()
    return transcripts
