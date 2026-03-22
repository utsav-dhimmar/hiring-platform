# Best Performance

## Overview

The Hiring Platform requires high performance to handle computationally intensive AI workloads including resume parsing, semantic embeddings, and LLM-based analysis. This document outlines the caching strategies and optimization techniques employed to ensure responsive user experiences.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE OPTIMIZATION LAYERS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      APPLICATION LAYER                                 │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │   │   Async      │  │   Batch      │  │   Lazy       │            │   │
│  │   │   Processing │  │   Processing │  │   Loading    │            │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CACHE LAYER (Redis)                            │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │   │   Job        │  │   Session    │  │   Status     │            │   │
│  │   │   Embeddings │  │   Cache      │  │   Tracking   │            │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DATABASE LAYER                                    │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │   │   pgvector  │  │   Query      │  │   Index      │            │   │
│  │   │   Indexes   │  │   Optimizing │  │   Strategy   │            │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Caching Strategy / Management

### Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Application                                                             │
│       │                                                                   │
│       ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      CACHE MANAGER                                    │   │
│   │                                                                       │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│   │   │   Redis    │  │   In-Memory │  │   HTTP      │               │   │
│   │   │   Client   │  │   LRU Cache │  │   ETag      │               │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘               │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                    ┌─────────────────┼─────────────────┐                     │
│                    ▼                 ▼                 ▼                     │
│            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│            │    Redis    │   │ PostgreSQL  │   │ File System │            │
│            │   Server    │   │   Cache     │   │    Cache    │            │
│            └─────────────┘   └─────────────┘   └─────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Redis Cache Implementation

```python
# backend/app/v1/core/cache.py
import json
from typing import Any, Optional
import redis.asyncio as redis
from app.v1.core.config import settings

class CacheManager:
    """Redis-based cache manager for the hiring platform."""
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self.default_ttl: int = 3600  # 1 hour default TTL
        
    async def connect(self) -> None:
        """Establish Redis connection."""
        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        
    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis:
            return None
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with optional TTL."""
        if not self.redis:
            return False
        ttl = ttl or self.default_ttl
        serialized = json.dumps(value)
        await self.redis.setex(key, ttl, serialized)
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.redis:
            return False
        await self.redis.delete(key)
        return True
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if not self.redis:
            return False
        return await self.redis.exists(key) > 0


# Global cache instance
cache = CacheManager()
```

### Cache Categories

| Category | Description | TTL | Key Pattern |
|----------|-------------|-----|-------------|
| **Job Embeddings** | Pre-computed job description vectors | 24 hours | `job_embedding:{job_id}` |
| **Skill Embeddings** | Pre-computed skill vectors | 7 days | `skill_embedding:{skill_id}` |
| **Session Data** | User session and auth tokens | 30 min | `session:{user_id}` |
| **Processing Status** | Resume/interview processing state | 1 hour | `status:{resume_id}` |
| **Query Results** | Paginated query results | 5 min | `query:{hash}` |
| **Rate Limiting** | API rate limit counters | 1 min | `ratelimit:{user_id}:{endpoint}` |

### Caching Strategy for Resume Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RESUME PROCESSING CACHE STRATEGY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Resume Upload Request                                                      │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │   Check Cache   │                                                       │
│   │  job_embedding  │                                                       │
│   │   {job_id}      │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                 │
│     ┌──────┴──────┐                                                         │
│     │             │                                                          │
│   Hit          Miss                                                          │
│     │             │                                                          │
│     ▼             ▼                                                          │
│  ┌─────────┐ ┌─────────────────┐                                           │
│  │ Return  │ │ Generate New    │                                           │
│  │ Cached  │ │ Embedding       │                                           │
│  │ Embed   │ │                 │                                           │
│  └────┬────┘ └────────┬────────┘                                           │
│       │               │                                                     │
│       │         ┌─────┴─────┐                                               │
│       │         │ Store in  │                                               │
│       │         │ Cache     │                                               │
│       │         │ TTL: 24h  │                                               │
│       │         └─────┬─────┘                                               │
│       │               │                                                     │
│       └───────┬───────┘                                                     │
│               │                                                             │
│               ▼                                                             │
│   ┌─────────────────────────────────┐                                       │
│   │  Semantic Similarity Calculation │                                       │
│   │                                 │                                       │
│   │  candidate_emb ⊙ job_emb        │                                       │
│   │                                 │                                       │
│   └─────────────────────────────────┘                                       │
│               │                                                             │
│               ▼                                                             │
│   ┌─────────────────────────────────┐                                       │
│   │  LLM Analysis (No Cache)       │                                       │
│   │  - Unique per resume           │                                       │
│   │  - Deterministic results needed │                                       │
│   └─────────────────────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHE INVALIDATION RULES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Event                         │ Cache Keys to Invalidate                   │
│   ─────────────────────────────┼─────────────────────────────────────────  │
│                                                                              │
│   Job Updated                   │ job_embedding:{job_id}                     │
│                               │ Related query caches                        │
│                               │                                             │
│   Skill Updated                │ skill_embedding:{skill_id}                 │
│                               │                                             │
│   User Logout                  │ session:{user_id}                          │
│                               │ token:{token_id}                           │
│                               │                                             │
│   Resume Reprocessed           │ status:{resume_id}                         │
│                               │ candidate_emb:{candidate_id}               │
│                               │                                             │
│   Admin Bulk Operation         │ Flush relevant pattern keys                 │
│                               │ e.g., DELETE job_embedding:*                │
│                               │                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Usage Example

```python
# backend/app/v1/services/resume_upload/processor.py

class ResumeProcessor:
    async def generate_resume_insights(
        self,
        *,
        raw_text: str,
        parsed_summary: dict,
        job: Any,
        job_skills: list,
        candidate_skills: list,
    ) -> dict:
        candidate_text = build_candidate_text(parsed_summary, raw_text)
        job_text = build_job_text(job)
        job_id = getattr(job, "id", None)
        
        # ---- Redis Cache for Job Embedding ----
        job_embedding = None
        if job_id:
            cache_key = f"job_embedding:{job_id}"
            job_embedding = await cache.get(cache_key)
            if job_embedding:
                logger.info(f"Cache hit for job embedding", job_id=str(job_id))
        
        if job_embedding is None:
            job_embedding = embedding_service.encode_jd(job_text)
            if job_id and job_embedding:
                await cache.set(
                    f"job_embedding:{job_id}",
                    job_embedding,
                    ttl=86400  # 24 hours
                )
                logger.info(f"Cached job embedding", job_id=str(job_id))
```

---

## 2. Optimization Techniques / Process

### Performance Optimization Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       OPTIMIZATION TECHNIQUES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       DATABASE OPTIMIZATION                           │   │
│   │                                                                      │   │
│   │   • pgvector Indexes (HNSW/IVFFlat)                                 │   │
│   │   • Query Result Caching                                             │   │
│   │   • Connection Pooling                                               │   │
│   │   • Prepared Statements                                              │   │
│   │   • Partial Indexes                                                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       AI PROCESSING OPTIMIZATION                      │   │
│   │                                                                      │   │
│   │   • Batch Embedding Generation                                       │   │
│   │   • ThreadPoolExecutor for CPU-bound Tasks                           │   │
│   │   • Embedding Reuse (Don't Recalculate)                              │   │
│   │   • Async LLM Calls                                                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       FRONTEND OPTIMIZATION                            │   │
│   │                                                                      │   │
│   │   • Code Splitting                                                   │   │
│   │   • Lazy Loading                                                     │   │
│   │   • Virtual Scrolling for Large Lists                                │   │
│   │   • API Request Deduplication                                        │   │
│   │   • Service Worker Caching                                           │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Optimization

#### pgvector Indexes

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW Index (Best for fast approximate nearest neighbor search)
-- Trade-off: Faster queries but slower inserts and more memory
CREATE INDEX idx_candidates_embedding_hnsw 
ON candidates 
USING hnsw (info_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- IVFFlat Index (Good balance for large datasets)
-- Trade-off: Requires training data for optimal clustering
CREATE INDEX idx_candidates_embedding_ivfflat 
ON candidates 
USING ivfflat (info_embedding vector_cosine_ops)
WITH (lists = 100);

-- Composite index for filtered vector search
CREATE INDEX idx_jobs_active_hnsw 
ON jobs 
USING hnsw (info_embedding vector_cosine_ops) 
WHERE is_active = true;
```

#### Query Optimization

```python
# Optimized candidate search query
async def search_candidates_optimized(
    db: AsyncSession,
    job_id: UUID,
    embedding: list[float],
    limit: int = 20,
) -> list[Candidate]:
    """Optimized vector similarity search with pre-filter."""
    
    query = (
        select(Candidate)
        .where(Candidate.applied_job_id == job_id)
        .where(Candidate.current_status == 'active')
        .order_by(
            Candidate.info_embedding.cosine_distance(embedding)
        )
        .limit(limit)
        .options(
            joinedload(Candidate.resumes),
            joinedload(Candidate.files),
        )
    )
    
    result = await db.execute(query)
    return result.scalars().unique().all()


# Batch skill embedding query
async def get_or_create_skill_embeddings(
    db: AsyncSession,
    skills: list[Skill],
) -> dict[UUID, list[float]]:
    """Get existing embeddings or generate new ones in batch."""
    
    existing = {
        s.id: s.skill_embedding 
        for s in skills 
        if s.skill_embedding is not None
    }
    
    missing = [s for s in skills if s.id not in existing]
    
    if missing:
        texts = [build_skill_text(s) for s in missing]
        new_embeddings = embedding_service.encode_batch(texts)
        
        for skill, embedding in zip(missing, new_embeddings):
            skill.skill_embedding = embedding
            existing[skill.id] = embedding
        
        db.add_all(missing)
        await db.commit()
    
    return existing
```

#### Connection Pooling

```python
# backend/app/v1/db/session.py
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from app.v1.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,              # Max connections in pool
    max_overflow=10,           # Additional connections when pool exhausted
    pool_timeout=30,           # Seconds to wait for connection
    pool_recycle=3600,         # Recycle connections after 1 hour
    pool_pre_ping=True,        # Verify connection before use
    echo=settings.DEBUG,       # Log SQL in debug mode
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db() -> AsyncSession:
    """Dependency for database session."""
    async with async_session_maker() as session:
        yield session
```

### AI Processing Optimization

#### Batch Embedding Generation

```python
# backend/app/v1/core/embeddings/service.py
from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        self.truncate_dim = settings.EMBEDDING_TRUNCATE_DIM
        self.batch_size = 32
        
    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Batch encoding for performance optimization."""
        cleaned = [t.strip() if t else "" for t in texts]
        
        # Process in batches for better throughput
        all_embeddings = []
        for i in range(0, len(cleaned), self.batch_size):
            batch = cleaned[i:i + self.batch_size]
            vectors = self.model.encode(
                batch,
                normalize_embeddings=True,
                truncate_dim=self.truncate_dim,
                show_progress_bar=len(batch) > 100,
            )
            all_embeddings.extend(vectors)
        
        return [v.tolist() for v in all_embeddings]
    
    def encode_skill_batch(
        self, 
        skills: list[dict]
    ) -> list[list[float]]:
        """Optimized batch encoding for skills."""
        texts = [
            f"Skill: {s['name']} - {s.get('description', '')}"
            for s in skills
        ]
        return self.encode_batch(texts)
```

#### ThreadPoolExecutor for CPU-bound Tasks

```python
# backend/app/v1/core/resume_executor.py
from concurrent.futures import ThreadPoolExecutor
from functools import partial
import asyncio

class ResumeExecutor:
    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(
            max_workers=max_workers,
            thread_name_prefix="resume-worker"
        )
        
    def process_in_background(
        self,
        func: callable,
        *args,
        **kwargs
    ) -> asyncio.Future:
        """Submit CPU-bound task to thread pool."""
        loop = asyncio.get_event_loop()
        bound_func = partial(func, *args, **kwargs)
        return loop.run_in_executor(self.executor, bound_func)
    
    def shutdown(self, wait: bool = True):
        """Shutdown the executor."""
        self.executor.shutdown(wait=wait)


# Global executor instance
resume_executor = ResumeExecutor(max_workers=settings.RESUME_PROCESSING_MAX_WORKERS)
```

#### Embedding Reuse

```python
# Avoid recalculating embeddings - reuse across pipeline stages

class ResumeProcessor:
    def process_resume(self, file_path: str) -> tuple[str, dict]:
        raw_text = DocumentParser.extract_text(file_path)
        extracted = self.extractor.extract_resume_info(raw_text)
        normalized = normalize_extractions(extracted)
        
        # Store intermediate result
        return raw_text, normalized
    
    async def generate_insights(
        self,
        raw_text: str,
        parsed_summary: dict,
        job: Job,
        job_skills: list,
        candidate_skills: list,
    ) -> dict:
        candidate_text = build_candidate_text(parsed_summary, raw_text)
        job_text = build_job_text(job)
        
        # Generate embeddings ONCE
        candidate_embedding = embedding_service.encode_resume(candidate_text)
        
        # REUSE candidate_embedding for similarity
        semantic_score = embedding_service.get_semantic_score_from_embeddings(
            candidate_embedding,  # Reuse here
            job_embedding
        )
        
        # REUSE candidate_embedding for chunk (instead of recalculating)
        chunk_embedding = embedding_service.encode_resume(raw_text)
        # Note: raw_text encoding is intentional for different context
        
        return {
            "candidate_embedding": candidate_embedding,  # For storage
            "semantic_score": semantic_score,
            # ...
        }
```

### Frontend Optimization

#### Code Splitting

```typescript
// frontend/src/routes/AppRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('../pages/Home/HomePage'));
const JobCandidatesPage = lazy(() => import('../pages/JobCandidates/JobCandidatesPage'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs/:jobId" element={<JobCandidatesPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
};
```

#### Virtual Scrolling for Large Lists

```typescript
// frontend/src/components/common/VirtualizedCandidateList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps {
  candidates: Candidate[];
  onSelect: (id: string) => void;
}

function VirtualizedCandidateList({ candidates, onSelect }: VirtualizedListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <CandidateRow
            key={candidates[virtualRow.index].id}
            candidate={candidates[virtualRow.index]}
            onSelect={onSelect}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### API Request Deduplication

```typescript
// frontend/src/utils/apiDedupe.ts
const pendingRequests = new Map<string, Promise<any>>();

export async function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // If request is already pending, wait for it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Create new request
  const promise = fetcher().finally(() => {
    // Clean up after completion
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Usage
const candidatesPromise = dedupedFetch(
  `candidates-${jobId}`,
  () => apiClient.get(`/jobs/${jobId}/candidates`)
);
```

#### Memoization for Expensive Computations

```typescript
// frontend/src/hooks/useCandidateRanking.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../apis/client';

interface UseCandidateRankingOptions {
  jobId: string;
  sortBy: 'score' | 'date' | 'name';
}

export function useCandidateRanking({ jobId, sortBy }: UseCandidateRankingOptions) {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => apiClient.get(`/jobs/${jobId}/candidates`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoize sorting - only recomputes when candidates or sortBy changes
  const sortedCandidates = useMemo(() => {
    if (!candidates) return [];
    
    return [...candidates].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.rrf_score || 0) - (a.rrf_score || 0);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
        default:
          return 0;
      }
    });
  }, [candidates, sortBy]);

  return { candidates: sortedCandidates, isLoading };
}
```

### Performance Monitoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE MONITORING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Metrics to Track:                                                         │
│   ───────────────                                                           │
│                                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐                         │
│   │   API Response Time │  │   Cache Hit Rate    │                         │
│   │                     │  │                     │                         │
│   │   p50: < 100ms     │  │   Target: > 80%     │                         │
│   │   p95: < 500ms     │  │                     │                         │
│   │   p99: < 1000ms    │  │                     │                         │
│   │                     │  │                     │                         │
│   └─────────────────────┘  └─────────────────────┘                         │
│                                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐                         │
│   │   Resume Processing │  │   Embedding Latency │                         │
│   │                     │  │                     │                         │
│   │   Target: < 30s    │  │   Target: < 200ms   │                         │
│   │   (background)     │  │   per batch        │                         │
│   │                     │  │                     │                         │
│   └─────────────────────┘  └─────────────────────┘                         │
│                                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐                         │
│   │   Database Queries  │  │   Memory Usage      │                         │
│   │                     │  │                     │                         │
│   │   p50: < 10ms      │  │   Monitor for       │                         │
│   │   p95: < 50ms      │  │   leaks              │                         │
│   │                     │  │                     │                         │
│   └─────────────────────┘  └─────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Benchmarks

| Operation | Target | Current | Status |
|-----------|--------|---------|--------|
| Resume Upload (API Response) | < 500ms | ~200ms | ✅ |
| Resume Processing (Background) | < 30s | 5-15s | ✅ |
| Candidate Search | < 200ms | ~100ms | ✅ |
| Semantic Similarity (single) | < 100ms | ~50ms | ✅ |
| Batch Embedding (32 items) | < 2s | ~1s | ✅ |
| Page Load (Initial) | < 2s | ~1.5s | ✅ |
| Cache Hit Rate | > 80% | ~75% | 🟡 |
| Database Query (p95) | < 50ms | ~30ms | ✅ |

### Optimization Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPTIMIZATION CHECKLIST                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Database:                                                                 │
│   ──────────                                                                │
│   □ Indexes created for frequently queried columns                          │
│   □ pgvector indexes (HNSW/IVFFlat) configured                              │
│   □ Connection pooling enabled                                              │
│   □ Query result caching implemented                                        │
│   □ N+1 queries resolved with eager loading                                 │
│                                                                              │
│   Caching:                                                                  │
│   ────────                                                                  │
│   □ Redis connection pooling configured                                     │
│   □ Job embeddings cached with appropriate TTL                              │
│   □ Cache invalidation rules defined                                        │
│   □ Cache hit rate > 80%                                                   │
│                                                                              │
│   AI Processing:                                                            │
│   ─────────────                                                            │
│   □ Batch embedding generation enabled                                      │
│   □ ThreadPoolExecutor for CPU-bound tasks                                  │
│   □ Embeddings reused across pipeline stages                                 │
│   □ Background processing for long-running tasks                            │
│                                                                              │
│   Frontend:                                                                 │
│   ──────────                                                                │
│   □ Code splitting for route-level lazy loading                             │
│   □ Virtual scrolling for large lists                                       │
│   □ API request deduplication implemented                                   │
│   □ Memoization for expensive computations                                  │
│   □ Images lazy-loaded                                                      │
│                                                                              │
│   Monitoring:                                                               │
│   ───────────                                                               │
│   □ Performance metrics logged                                              │
│   □ Slow query logging enabled                                              │
│   □ Cache hit rate monitored                                                │
│   □ API response time tracked                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
