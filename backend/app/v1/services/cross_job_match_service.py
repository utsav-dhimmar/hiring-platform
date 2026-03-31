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
from sqlalchemy import select, func
from app.v1.db.models.resume_chunks import ResumeChunk
from app.v1.db.models.job_chunks import JobChunk
from app.v1.core.config import settings

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
            if resume is None:
                _log.warning("Resume not found resume_id=%s. Skipping cross-match.", resume_id)
                return

            # Fetch all resume chunks for this candidate early (we need them for Deep Match anyway)
            resume_chunk_result = await db.execute(
                select(ResumeChunk.chunk_embedding)
                .where(ResumeChunk.resume_id == resume_id)
            )
            resume_embeddings = [r for r in resume_chunk_result.scalars().all() if r is not None]

            # Use the main resume_embedding or the first chunk as a bi-encoder proxy
            base_embedding = resume.resume_embedding
            if base_embedding is None and resume_embeddings:
                base_embedding = resume_embeddings[0]
                _log.info("Using first chunk as fallback embedding for bi-encoder shortlist.")

            if base_embedding is None:
                _log.warning("No embedding found for resume_id=%s in either Resume or ResumeChunk. Skipping cross-match.", resume_id)
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
                    base_embedding, job.jd_embedding
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

        
            # Stage 2: Reranking with Deep Match (Chunk-level embeddings)
            if not resume_embeddings:
                _log.warning("No ResumeChunk embeddings found for resume_id=%s. Using bi-encoder scores.", resume_id)
                # Ensure all items have a final_score for sorting
                for item in shortlist:
                    item["final_score"] = item["bi_score"]
            else:
                for item in shortlist:
                    job = item["job"]
                    try:
                        # Fetch all job chunks for this job
                        job_chunk_result = await db.execute(
                            select(JobChunk.chunk_embedding)
                            .where(JobChunk.job_id == job.id)
                        )
                        job_chunk_embeddings = [j for j in job_chunk_result.scalars().all() if j is not None]
                        
                        max_sim = 0.0
                        if job_chunk_embeddings:
                            # Full Deep Match: Max similarity across ALL pairs (ResumeChunk, JobChunk)
                            for r_emb in resume_embeddings:
                                for j_emb in job_chunk_embeddings:
                                    sim = embedding_service.get_semantic_score_from_embeddings(r_emb, j_emb)
                                    if sim > max_sim:
                                        max_sim = sim
                        else:
                            # Fallback: Max similarity between ResumeChunks and the aggregate JD embedding
                            for r_emb in resume_embeddings:
                                sim = embedding_service.get_semantic_score_from_embeddings(r_emb, job.jd_embedding)
                                if sim > max_sim:
                                    max_sim = sim
                        
                        # Scale is already 0-100 from embedding_service
                        item["final_score"] = max_sim
                        _log.info("Job %s | Deep Match Score: %s", job.id, item["final_score"])
                        
                    except Exception:
                        _log.exception("Deep Match reranking failed for job=%s", job.id)
                        item["final_score"] = item["bi_score"]
            # Stage 3: Keep top-N above threshold
            reranked = sorted(shortlist, key=lambda x: x.get("final_score", x["bi_score"]), reverse=True)
            _log.info("Reranked matches: %s", [{ "id": str(i["job"].id), "score": i.get("final_score", i["bi_score"]) } for i in reranked])
            top_matches = [
                {"matched_job_id": item["job"].id, "match_score": item.get("final_score", item["bi_score"])}
                for item in reranked
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
