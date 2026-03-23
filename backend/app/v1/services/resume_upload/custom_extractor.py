"""
Service for dynamic custom extraction from resumes.
"""

import json
import logging
import uuid

import openai
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.config import settings
from app.v1.core.extractor import DocumentParser
from app.v1.repository.resume_upload_repository import resume_upload_repository
from app.v1.schemas.upload import (
    CustomExtractionRequest,
    CustomExtractionResponse,
    CustomFieldResponse,
)

logger = logging.getLogger(__name__)

class CustomResumeExtractorService:
    async def extract_custom_fields(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        request: CustomExtractionRequest,
    ) -> CustomExtractionResponse:
        
        resume_record = await resume_upload_repository.get_resume_for_job(
            db, job_id=job_id, resume_id=resume_id, owner_id=None
        )
        if not resume_record:
            raise HTTPException(status_code=404, detail="Resume not found")

        file_record = resume_record.file
        if not file_record:
            raise HTTPException(status_code=404, detail="Resume file not found")

        # Fetch the raw text from database generated during original upload
        from sqlalchemy import select
        from app.v1.db.models.resume_chunks import ResumeChunk
        
        chunk = await db.scalar(
            select(ResumeChunk).where(ResumeChunk.resume_id == resume_id).limit(1)
        )
        
        if not chunk or not chunk.raw_text:
            raise HTTPException(status_code=500, detail="Resume text not found in database")

        raw_text = chunk.raw_text

        # LLM inference
        fields_json = json.dumps([{"title": f.title, "description": f.description} for f in request.fields], indent=2)
        
        system_prompt = (
            "You are an expert HR data parser. Your task is to extract dynamic fields from a resume.\n"
            "CRITICAL:\n"
            "1. You MUST output ONLY valid JSON format.\n"
            "2. Your output MUST be a JSON object with a single key 'results' which is an array.\n"
            "3. If a requested field is NOT found in the resume, set its value exactly to 'no'.\n"
            "4. Be very concise with your answers."
        )
        
        user_prompt = f"""
Extract exactly these fields from the candidate's resume:
{fields_json}

Output Format Example (JSON ONLY):
{{
  "results": [
    {{"title": "Requested Title 1", "value": "Extracted string or 'no'"}},
    {{"title": "Requested Title 2", "value": "..."}}
  ]
}}

RESUME TEXT:
{raw_text[:6000]}
"""

        try:
            client = openai.AsyncOpenAI(
                base_url=settings.OLLAMA_URL,
                api_key=settings.OLLAMA_API_KEY or "ollama"
            )
            response = await client.chat.completions.create(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )

            response_text = response.choices[0].message.content or "{}"
            # Clean up potential markdown wrappers
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            data = json.loads(response_text)
            results = data.get("results", [])
            
            # Map back to models
            responses = []
            for item in results:
                responses.append(CustomFieldResponse(
                    title=item.get("title", "Unknown"),
                    value=str(item.get("value", "no"))
                ))
            
            return CustomExtractionResponse(
                job_id=job_id,
                resume_id=resume_id,
                results=responses
            )

        except Exception as e:
            logger.error("LLM Extraction failed: %s", e)
            raise HTTPException(status_code=500, detail=f"LLM Extraction failed: {str(e)}")

custom_extractor_service = CustomResumeExtractorService()
