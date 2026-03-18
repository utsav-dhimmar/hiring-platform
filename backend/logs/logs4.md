# Outcomes From `logs4.txt`

## Summary

This run is slightly faster overall than `logs3.md`, but the performance profile changed a lot.

- Total processing time: `163,548.89 ms` (`2m 43.5s`)
- `logs3.md` run total: `192,635.98 ms` (`3m 12.6s`)
- Faster than `logs3.md` by about `29,087.09 ms` (`29.1s`)

The main change is that embedding work became almost negligible, while resume extraction became expensive again because the first extraction attempt failed and had to be retried.

## Main Findings

### 1. Overall runtime improved again

- `total`: `163,548.89 ms`
- previous `logs3.md` total: `192,635.98 ms`

Even with a bad extraction pass, this run still finished faster than `logs3.md` because the embedding stages collapsed from tens of seconds each to well under `100 ms`.

### 2. Upload and setup stages are still fast

- `load_resume_for_background`: `184.34 ms`
- `mark_processing`: `17.82 ms`
- `load_job`: `8.65 ms`

These remain minor costs and are still not the bottleneck.

### 3. PDF parsing is still negligible

- `document_text_extraction`: `111.04 ms`

This is slower than `logs3.md` (`37.23 ms`), but still trivial relative to the total runtime.

### 4. Resume extraction regressed sharply

- `llm_resume_extraction`: `141,538.84 ms` (`2m 21.5s`)
- previous `logs3.md`: `32,602.32 ms` (`32.6s`)

This is worse than `logs3.md` by about `108,936.52 ms` (`1m 48.9s`).

The log shows a clear reason:

- first extraction attempt failed with `Content must contain an 'extractions' key.`
- extraction then retried and completed successfully

So unlike `logs3.md`, extraction was not stable in this run.

### 5. Embeddings improved dramatically

Current run:

- `job_embedding`: `74.01 ms`
- `candidate_embedding`: `69.47 ms`
- `chunk_embedding`: `66.47 ms`
- `candidate_skill_embeddings`: `316.51 ms`

Previous `logs3.md`:

- `job_embedding`: `53,553.16 ms`
- `candidate_embedding`: `54,379.83 ms`
- `chunk_embedding`: `36,302.11 ms`
- `candidate_skill_embeddings`: `6,003.61 ms`

This is the biggest improvement in `logs4.txt`. The embedding pipeline dropped from the dominant cost in `logs3.md` to effectively insignificant runtime in this run.

### 6. Analysis is now the second-largest visible cost

- `llm_resume_analysis`: `20,949.52 ms` (`20.9s`)
- previous `logs3.md`: `9,421.96 ms` (`9.4s`)

This regressed by about `11,527.56 ms`, but it is still much smaller than extraction.

### 7. Combined analysis-and-embedding time improved massively

- `analysis_and_embeddings`: `21,162.15 ms`
- previous `logs3.md`: `153,659.23 ms`

That is an improvement of about `132,497.08 ms` (`2m 12.5s`).

This explains why total runtime still improved despite the extraction retry.

### 8. Database persistence remains negligible

- `persist_candidate_profile`: `8.31 ms`
- `create_resume_chunk`: `0.15 ms`
- `sync_candidate_skills`: `108.64 ms`
- `persist_candidate_skill_embeddings`: `65.73 ms`
- `commit_completed_resume`: `5.95 ms`

DB work is still insignificant.

## Stage Breakdown

| Stage | Duration |
|---|---:|
| `document_text_extraction` | `111.04 ms` |
| `llm_resume_extraction` | `141,538.84 ms` |
| `extract_and_normalize` | `141,652.17 ms` |
| `job_embedding` | `74.01 ms` |
| `candidate_embedding` | `69.47 ms` |
| `chunk_embedding` | `66.47 ms` |
| `llm_resume_analysis` | `20,949.52 ms` |
| `analysis_and_embeddings` | `21,162.15 ms` |
| `candidate_skill_embeddings` | `316.51 ms` |
| `total` | `163,548.89 ms` |

## What Improved Compared With `logs3.md`

- total runtime improved from `3m 12.6s` to `2m 43.5s`
- `analysis_and_embeddings` dropped from `153.7s` to `21.2s`
- `job_embedding`, `candidate_embedding`, and `chunk_embedding` dropped from tens of seconds to about `70 ms` each
- `candidate_skill_embeddings` dropped from `6.0s` to `0.3s`
- persistence and sync stages stayed negligible

## What Regressed Compared With `logs3.md`

- `llm_resume_extraction` regressed from `32.6s` to `141.5s`
- extraction stability regressed because the first pass failed with a malformed result
- `llm_resume_analysis` increased from `9.4s` to `20.9s`
- `document_text_extraction` increased slightly, though it remains unimportant

## Remaining Bottleneck

The bottleneck has shifted again.

In `logs3.md`:

1. embeddings were the main cost
2. extraction was much improved

In `logs4.txt`:

1. extraction is once again the dominant cost
2. analysis is secondary
3. embeddings are no longer a meaningful runtime issue in this run

## Additional Observations

- `job_skill_embeddings` is still `0` with `total_skills=24`
- the extraction output includes many `Not mentioned` entries, which may indicate prompt/output quality issues even when the retry succeeds
- the malformed first response suggests the extraction path is still unreliable

## Final Conclusion

`logs4.txt` is faster overall than `logs3.md`, but not because extraction improved. It is faster because embedding generation became extremely fast.

Current conclusion:

1. The embedding bottleneck visible in `logs3.md` is largely gone in this run.
2. The extraction pipeline is still unstable and is now the main performance risk again.
3. Resume analysis also became slower, but it is still far below extraction cost.
4. The next priority should shift back to extraction reliability and retry avoidance.

## Recommended Next Actions

- investigate why extraction first returned content without the required `extractions` key
- add stricter validation and retry metrics around the extraction response format
- compare model/config/runtime changes between `logs3.txt` and `logs4.txt` to explain the embedding speed jump
- verify whether the new embedding speed is consistent across repeated runs or just a warm-cache effect
- investigate why `job_skill_embeddings` still generates `0` while `total_skills=24`
