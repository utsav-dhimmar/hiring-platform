# Outcomes From `logs2.txt`

## Summary

This run is much faster than the previous one, but the process is still slow overall.

- Total processing time: `533,733.69 ms` (`8m 53.7s`)
- Previous run total: about `18m 33.9s`
- Improvement: about `9m 40s` faster

The new Ollama model improved resume extraction significantly, but CPU embedding generation is still a major bottleneck.

## Main Findings

### 1. Upload path is fast

- Upload API returned immediately with `202 Accepted`
- Background loading and state update were fast:
  - `load_resume_for_background`: `230.79 ms`
  - `mark_processing`: `17.12 ms`
  - `load_job`: `8.32 ms`

### 2. PDF parsing is not the problem

- `document_text_extraction`: `281.76 ms`

This confirms file reading and PDF text extraction are not causing the delay.

### 3. Resume extraction improved a lot, but still retried once

- `llm_resume_extraction`: `144,228.97 ms` (`2m 24.2s`)
- First extraction attempt failed:
  - `Content must contain an 'extractions' key.`
- Second extraction attempt succeeded

Compared to the previous run, extraction improved from about `12m 26s` to about `2m 24s`.

### 4. Embeddings are still very expensive on CPU

- `job_embedding`: `141,725.39 ms` (`2m 21.7s`)
- `candidate_embedding`: `118,094.16 ms` (`1m 58.1s`)
- `chunk_embedding`: `71,323.47 ms` (`1m 11.3s`)
- `candidate_skill_embeddings`: `40,397.15 ms` (`40.4s`)

The embedding model is still loaded on CPU and still contacts Hugging Face on first use. This remains the biggest sustained cost after extraction improves.

### 5. Resume analysis is relatively small

- `llm_resume_analysis`: `17,021.54 ms` (`17.0s`)

The JD-vs-resume analysis is not the main performance problem.

### 6. Database work is negligible

- `persist_candidate_profile`: `67.90 ms`
- `create_resume_chunk`: `0.42 ms`
- `sync_candidate_skills`: `192.27 ms`
- `persist_candidate_skill_embeddings`: `65.79 ms`
- `commit_completed_resume`: `4.95 ms`

DB operations are not the bottleneck.

## Stage Breakdown

| Stage | Duration |
|---|---:|
| `document_text_extraction` | `281.76 ms` |
| `llm_resume_extraction` | `144,228.97 ms` |
| `extract_and_normalize` | `144,513.50 ms` |
| `job_embedding` | `141,725.39 ms` |
| `candidate_embedding` | `118,094.16 ms` |
| `chunk_embedding` | `71,323.47 ms` |
| `llm_resume_analysis` | `17,021.54 ms` |
| `analysis_and_embeddings` | `348,176.20 ms` |
| `candidate_skill_embeddings` | `40,397.15 ms` |
| `total` | `533,733.69 ms` |

## What Improved

- The new Ollama model reduced extraction time sharply.
- There was no 300-second timeout in this run.
- There was no Ollama `500` error in this run.
- Total time dropped from about `18.5 minutes` to about `8.9 minutes`.

## What Is Still Slow

The remaining delay is mainly caused by:

- one failed extraction attempt before success
- large CPU-based embedding generation
- model cold-start behavior for `Qwen/Qwen3-Embedding-0.6B`
- per-skill candidate embeddings for newly created skills

## Final Conclusion

The model change helped, but it did not solve the full performance problem.

Current root causes in order:

1. Embedding generation on CPU
2. Resume extraction retry/failure behavior
3. Cold-start loading/downloading of the embedding model

## Recommended Next Actions

- preload the embedding model during app startup
- switch to a smaller or faster embedding model
- reduce extraction retries and fail faster on malformed responses
- cache embeddings more aggressively
- avoid generating all embeddings immediately if they are not required for the first result
