"""
Stage 1 evaluation route.

Endpoint:
    POST /interviews/{interview_id}/evaluate
         → triggers LLM evaluation for the linked transcript
         → returns the full evaluation result

HR workflow:
    1. Upload transcript  →  POST /interviews/{id}/transcript
    2. Poll until ready   →  GET  /interviews/{id}/transcript/{tid}
    3. Trigger evaluation →  POST /interviews/{id}/evaluate?transcript_id={tid}
    4. View result        →  included in response
    5. Make decision      →  PATCH /interviews/{id}/decision
"""

import uuid

from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.auth import get_current_user
from app.v1.schemas.user import UserRead
from app.v1.services.stage1 import stage1_service
from fastapi.responses import JSONResponse
router = APIRouter()


@router.post(
    "/interviews/{interview_id}/evaluate",
    status_code=status.HTTP_200_OK,
    summary="Run Stage 1 LLM evaluation",
)
async def run_stage1_evaluation(
    interview_id: uuid.UUID,
    transcript_id: uuid.UUID = Query(..., description="ID of the completed transcript to evaluate"),
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> dict:
    """
    Trigger the Stage 1 LLM-as-a-Judge evaluation for a completed transcript.

    The transcript must have `processing_status = completed` before calling this.

    Returns the full evaluation including per-criterion scores, red flags,
    weighted stage score, recommendation (PROCEED/REJECT/MAYBE), and summaries.
    """
    return await stage1_service.run_evaluation(
        db=db,
        interview_id=interview_id,
        transcript_id=transcript_id,
    )

@router.post(
    "/test-evaluation",
    status_code=status.HTTP_200_OK,
    summary="Test Stage 1 evaluation without DB",
)
async def test_stage1_evaluation_parsing(
    file: UploadFile = File(...),
    job_description: str = Form("Software Engineer"),
    candidate_name: str = Form(""),
) -> JSONResponse:
    from fastapi.responses import JSONResponse
    from app.v1.services.transcript.processor import TranscriptProcessor
    from app.v1.services.stage1.evaluator import Stage1Evaluator
    from app.v1.services.stage1.service import (
        _count_filler_words,
        _extract_candidate_speech,
        _build_response,
    )

    content = await file.read()

    # Parse transcript
    t_processor = TranscriptProcessor()
    t_result = t_processor.process(content)
    full_text = t_result.get("clean_text", "")
    dialogues = t_result.get("dialogues", [])
    metadata = t_result.get("metadata", {})

    c_name = candidate_name or metadata.get("candidate_name", "")
    candidate_text = _extract_candidate_speech(dialogues, c_name)
    filler_count = _count_filler_words(candidate_text)

    # Use the updated two-call evaluator
    evaluator = Stage1Evaluator()
    result = evaluator.evaluate(
        full_text=full_text,
        candidate_text=candidate_text,
        jd=job_description,
        filler_count=filler_count,
    )

    return JSONResponse(content=_build_response(result, filler_count))
@router.post(
    "/test-raw-agent",
    status_code=status.HTTP_200_OK,
    summary="Debug — see raw agent output",
)
async def test_raw_agent(
    file: UploadFile = File(...),
    job_description: str = Form("Software Engineer"),
) -> JSONResponse:
    from app.v1.services.transcript.processor import TranscriptProcessor
    from app.v1.services.stage1.service import _count_filler_words, _extract_candidate_speech
    from autogen import AssistantAgent, UserProxyAgent
    from app.v1.core.config import settings
    from app.v1.prompts.stage1 import STAGE1_SYSTEM_PROMPT, STAGE1_USER_PROMPT
    from fastapi.responses import JSONResponse

    content = await file.read()

    # Parse transcript
    t_processor = TranscriptProcessor()
    t_result = t_processor.process(content)
    full_text = t_result.get("clean_text", "")
    dialogues = t_result.get("dialogues", [])
    candidate_text = _extract_candidate_speech(dialogues, "")
    filler_count = _count_filler_words(candidate_text)

    # Run agent
    llm_config = {
        "config_list": [
            {
                "model":    settings.OLLAMA_MODEL,
                "base_url": settings.OLLAMA_URL,
                "api_key":  settings.OLLAMA_API_KEY or "ollama",
            }
        ],
        "temperature": 0.1,
        "timeout": 120,
    }

    hr_evaluator = AssistantAgent(
        name="HREvaluator",
        llm_config=llm_config,
        system_message=STAGE1_SYSTEM_PROMPT,
    )
    user_proxy = UserProxyAgent(
        name="HR_Coordinator",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
        code_execution_config=False,
    )

    user_message = STAGE1_USER_PROMPT.format(
        jd=job_description,
        full_text=full_text[:500],   # short for debug
        candidate_text=candidate_text[:300],
        filler_count=filler_count,
    )

    user_proxy.initiate_chat(hr_evaluator, message=user_message)

    # Collect ALL messages
    messages = user_proxy.chat_messages.get(hr_evaluator, [])
    raw_messages = [
        {"role": m.get("role"), "content": m.get("content", "")[:1000]}
        for m in messages
    ]

    return JSONResponse(content={
        "full_text_length": len(full_text),
        "candidate_text_length": len(candidate_text),
        "filler_count": filler_count,
        "message_count": len(messages),
        "messages": raw_messages,
    })    