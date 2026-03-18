# Outcomes From `logs5.txt`

## Summary

This run is significantly faster than `logs4.md`, representing a return to peak efficiency after a regression in the previous run.

- **Total Processing Time**: `46,275.04 ms` (~46.3s)
- **`logs4.md` Run Total**: `163,548.89 ms` (~2m 43.5s)
- **Improvement**: `117,273.85 ms` (**71.7% faster** than `logs4.md`)

The primary driver for this speedup is the stabilization of the resume extraction stage, which avoided the expensive retries seen in the last run.

## Main Findings

### 1. Massive Overall Runtime Improvement
Runtime dropped from nearly 3 minutes to under 50 seconds. This is consistently one of the fastest recorded runs.

### 2. Resume Extraction Stabilized
- **`llm_resume_extraction`**: `37,166.46 ms` (~37.2s)
- **Previous `logs4.md`**: `141,538.84 ms` (~2m 21.5s)
Unlike `logs4.md`, the extraction completed on the first attempt without any formatting errors. This remains the dominant (and only) cost over 10 seconds.

### 3. Analysis Efficiency Gained
- **`llm_resume_analysis`**: `8,157.97 ms` (~8.2s)
- **Previous `logs4.md`**: `20,949.52 ms` (~20.9s)
Analysis became over 60% faster, contributing significantly to the overall gain.

### 4. Embedding Pipeline Consistency
- **`job_embedding`**: `78.27 ms`
- **`candidate_embedding`**: `63.47 ms`
- **`chunk_embedding`**: `63.06 ms`
- **`candidate_skill_embeddings`**: `296.93 ms`
The dramatic speedup in embeddings first seen in `logs4.md` has been maintained. These stages are now effectively negligible.

### 5. Combined Pipeline Cost
- **`analysis_and_embeddings`**: `8,365.64 ms`
- **Previous `logs4.md`**: `21,162.15 ms`
This combined stage is now well under 10 seconds.

## Stage Breakdown

| Stage | Duration |
| :--- | ---: |
| `document_text_extraction` | `102.52 ms` |
| `llm_resume_extraction` | `37,166.46 ms` |
| `extract_and_normalize` | `37,270.04 ms` |
| `llm_resume_analysis` | `8,157.97 ms` |
| `analysis_and_embeddings` | `8,365.64 ms` |
| `candidate_skill_embeddings` | `296.93 ms` |
| **Total** | **`46,275.04 ms`** |

## Conclusion

The bottleneck in `logs4.md` was an unstable extraction format causing retries. With that stabilized in `logs5.txt`, the system is performing at its current theoretical limit with the current LLM latency.

### Remaining Issues
- **`job_skill_embeddings`** remains at `0.05 ms` despite 34 total skills, suggesting this stage is being bypassed or is failing silently.
- **LLM Extraction Latency** (37s) is now the only meaningful performance risk. Future optimizations should focus on this block.
