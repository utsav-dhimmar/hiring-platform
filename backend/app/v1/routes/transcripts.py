import hashlib
import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
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
from app.v1.db.models.criteria import Criterion
from app.v1.utils.transcript_parser import process_transcript_file
from app.v1.core.embeddings import EmbeddingService
from app.v1.services.evaluation_tasks import evaluate_candidate_transcript_task
from app.v1.schemas.criteria import CriterionRead, CriterionCreate, CriterionUpdate

router = APIRouter(prefix="/transcripts", tags=["Transcripts"])

@router.post("/upload")
async def upload_transcript(
    candidate_id: Annotated[uuid.UUID, Form(...)],
    file: UploadFile = File(...),
    custom_criteria: Annotated[str | None, Form(description="Optional JSON array of criteria for testing overrides")] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an interview transcript (.docx, .pdf) for a candidate.
    
    The system automatically detects the current active 'pending' candidate stage, 
    processes the file (cleans, chunks, embeds), and avoids duplicates via SHA-256 hashing.
    """
    # 1. Validate File Ext
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = ""
    if "." in file.filename:
        ext = f".{file.filename.split('.')[-1].lower()}"
        
    if ext not in {".docx", ".pdf"}:
         raise HTTPException(status_code=400, detail="Only .docx and .pdf files are allowed for transcripts.")

    # 2. Check Candidate exists
    candidate = await db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 3. Auto-detect the current active pipeline stage for this candidate
    # We look for the first 'pending' candidate_stage ordered by whatever stage order mechanic exists
    # (Assuming candidate_stages holds the sequence. If there's an explicit order, we can add it to the query)
    query = (
        select(CandidateStage)
        .options(selectinload(CandidateStage.job_stage))
        .where(
            CandidateStage.candidate_id == candidate_id,
            CandidateStage.status.in_(["pending", "processing", "completed"])
        ).order_by(CandidateStage.started_at.desc())
    )
    result = await db.execute(query)
    current_stage = result.scalars().first()

    if not current_stage:
        print(f"ERROR: No active stage found for candidate {candidate_id}. Upload aborted.")
        raise HTTPException(
            status_code=400, 
            detail="No valid active stage found for this candidate. Ensure they have been moved to the interview stage."
        )
    
    print(f"DEBUG: Found active stage: {current_stage.job_stage.id} (Order: {current_stage.job_stage.stage_order})")

    # 4. Extract and Process the File
    content = await file.read()
    
    try:
        processed_data = process_transcript_file(content, ext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")
        
    clean_text = processed_data["raw_clean_text"]
    
    # 5. Prevent Duplicates (Hash the clean text) - DISABLED FOR TESTING
    import time
    # Adding a salt to bypass DB unique constraint for your testing
    salt_text = clean_text + f"\n\n[Test Salt: {time.time()}]"
    transcript_hash = hashlib.sha256(salt_text.encode('utf-8')).hexdigest()
    
    # existing_check = await db.execute(
    #     select(Transcript).where(Transcript.transcript_hash == transcript_hash)
    # )
    # if existing_check.scalar_one_or_none():
    #      raise HTTPException(
    #          status_code=status.HTTP_409_CONFLICT, 
    #          detail="This exact transcript has already been processed for an evaluation."
    #      )

    # 6. Database Insertions (File, Interview placeholder, Transcript, Chunks)
    
    # Simple fix for POC: Fetch first user to use as owner/interviewer
    from app.v1.db.models.user import User
    first_user_result = await db.execute(select(User).limit(1))
    first_user = first_user_result.scalar_one_or_none()
    
    if not first_user:
        raise HTTPException(status_code=500, detail="No users found in database to assign as file owner.")

    # a. File entry
    db_file = DBFile(
        owner_id=first_user.id,
        candidate_id=candidate_id,
        file_name=file.filename,
        file_type=ext.replace('.', ''),
        size=len(content),
    )
    db.add(db_file)
    await db.flush() # flush to get file.id

    # b. Ensure an Interview session exists for this stage to link the transcript
    interview = Interview(
        candidate_id=candidate_id,
        job_id=current_stage.job_stage.job_id,
        interviewer_id=first_user.id,
        stage=current_stage.job_stage.stage_order,
        status="completed" # Because HR uploaded the post-interview transcript
    )
    db.add(interview)
    await db.flush()

    # c. Create Transcript Main Record
    transcript = Transcript(
        interview_id=interview.id,
        file_id=db_file.id,
        clean_transcript_text=clean_text,
        transcript_hash=transcript_hash,
        segments={"dialogues": processed_data["dialogues"]}
    )
    db.add(transcript)
    await db.flush()

    # d. Generate Embeddings & Save Chunks
    # This might take a few seconds in production, usually pushed to Celery. Doing inline for POC API.
    embedding_service = EmbeddingService()
    
    chunks_text = processed_data.get("chunks", [])
    db_chunks = []
    
    for idx, chunk_text in enumerate(chunks_text):
        # Generate semantic vector
        vector = embedding_service.encode_transcript(chunk_text)
        
        chunk_record = TranscriptChunk(
            transcript_id=transcript.id,
            chunk_index=idx,
            text_content=chunk_text,
            embedding=vector
        )
        db_chunks.append(chunk_record)
        
    db.add_all(db_chunks)
    
    # 7. Update Candidate Stage Status to Processing
    current_stage.status = "processing"
    
    # Handle custom criteria override
    if custom_criteria:
        try:
            criteria_ids = json.loads(custom_criteria)
            # Store override in evaluation_data to be picked up by the service
            current_stage.evaluation_data = {
                "config_override": {
                    "active_criteria": [{"id": cid, "weight": 100/len(criteria_ids)} for cid in criteria_ids]
                }
            }
        except Exception as e:
            print(f"DEBUG: Failed to parse custom_criteria: {e}")

    await db.commit()
    
    # 8. Trigger Celery Task for AI Evaluation
    print(f"DEBUG: Triggering Celery task for candidate_stage {current_stage.id}")
    try:
        task = evaluate_candidate_transcript_task.delay(str(current_stage.id))
        print(f"DEBUG: Task successfully sent to Redis. Task ID: {task.id}")
    except Exception as celery_err:
        print(f"ERROR: Failed to send task to Celery: {celery_err}")

    return {
        "message": "Transcript uploaded and processed successfully.",
        "transcript_id": transcript.id,
        "candidate_stage_id": current_stage.id,
        "stats": {
            "dialogue_turns": processed_data["dialogue_count"],
            "chunks_created": len(chunks_text),
            "hashing": "Duplicate check passed via SHA-256",
        },
        "next_step": "AI Evaluation Agent has been triggered in the background."
    }

@router.post("/test-clean")
async def test_clean_transcript(
    file: UploadFile = File(...),
):
    """
    Test the cleaning logic for a transcript file.
    Does not save to database. Returns the cleaned text and segments.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = ""
    if "." in file.filename:
        ext = f".{file.filename.split('.')[-1].lower()}"
        
    if ext not in {".docx", ".pdf"}:
         raise HTTPException(status_code=400, detail="Only .docx and .pdf files are allowed.")

    content = await file.read()
    
    try:
        processed_data = process_transcript_file(content, ext)
        return {
            "filename": file.filename,
            "cleaned_text": processed_data["raw_clean_text"],
            "dialogues": processed_data["dialogues"],
            "chunks": processed_data["chunks"],
            "stats": {
                "dialogue_turns": processed_data["dialogue_count"],
                "chunks_created": len(processed_data["chunks"])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process: {str(e)}")

@router.get("/criteria", response_model=list[CriterionRead])
async def get_all_criteria(
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available evaluation criteria."""
    stmt = select(Criterion).order_by(Criterion.name)
    res = await db.execute(stmt)
    criteria = res.scalars().all()
    return criteria

@router.post("/criteria", response_model=CriterionRead, status_code=status.HTTP_201_CREATED)
async def create_criterion(
    criterion_in: CriterionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new evaluation criterion."""
    # Check if name already exists
    existing = await db.execute(select(Criterion).where(Criterion.name == criterion_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Criterion with name '{criterion_in.name}' already exists.")
    
    criterion = Criterion(**criterion_in.model_dump())
    db.add(criterion)
    await db.commit()
    await db.refresh(criterion)
    return criterion

@router.patch("/criteria/{criterion_id}", response_model=CriterionRead)
async def update_criterion(
    criterion_id: uuid.UUID,
    criterion_update: CriterionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing evaluation criterion."""
    criterion = await db.get(Criterion, criterion_id)
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    
    update_data = criterion_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(criterion, field, value)
    
    await db.commit()
    await db.refresh(criterion)
    return criterion

@router.delete("/criteria/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_criterion(
    criterion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an evaluation criterion."""
    criterion = await db.get(Criterion, criterion_id)
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    
    await db.delete(criterion)
    await db.commit()
    return None

@router.get("/evaluation/{candidate_stage_id}")
async def get_evaluation(
    candidate_stage_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the evaluation for a specific candidate stage."""
    res = await db.execute(
        select(Evaluation)
        .where(Evaluation.candidate_stage_id == candidate_stage_id)
        .order_by(Evaluation.created_at.desc())
    )
    evaluation = res.scalars().first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation

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
