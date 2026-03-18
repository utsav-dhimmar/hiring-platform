# Outcomes From `logs6txt`

## Summary

This run (`logs6txt`) is slower than the previous run summarized in `logs5.md`, primarily due to increased latency in LLM-based stages. There were no formatting errors or retries, but the processing time has increased significantly.

- **Total Processing Time**: `54,371.02 ms` (~54.4s)
- **`logs5.md` Run Total**: `46,275.04 ms` (~46.3s)
- **Difference**: `+8,095.98 ms` (**17.5% slower** than `logs5.md`)

## Comparison Breakdown

| Stage | `logs5.md` Duration | `logs6txt` Duration | Difference |
| :--- | :--- | :--- | :--- |
| `document_text_extraction` | `102.52 ms` | `110.36 ms` | `+7.84 ms` |
| `llm_resume_extraction` | `37,166.46 ms` | `39,425.27 ms` | `+2,258.81 ms` |
| `extract_and_normalize` | `37,270.04 ms` | `39,536.97 ms` | `+2,266.93 ms` |
| `llm_resume_analysis` | `8,157.97 ms` | `13,605.49 ms` | `+5,447.52 ms` |
| `analysis_and_embeddings` | `8,365.64 ms` | `13,976.53 ms` | `+5,610.89 ms` |
| `candidate_skill_embeddings`| `296.93 ms` | `441.07 ms` | `+144.14 ms` |
| `job_skill_embeddings` | `0.05 ms` | `0.05 ms` | `0.00 ms` |
| **Total Processing** | **`46,275.04 ms`** | **`54,371.02 ms`** | **`+8,095.98 ms`** |

## Main Findings

### 1. Significant Latency Increase in Analysis
The `llm_resume_analysis` stage saw the largest jump, increasing by over **5.4 seconds** (~66%). Since there were no retries, this is likely due to either a more complex resume or higher latency from the LLM provider.

### 2. Extraction Latency Creep
`llm_resume_extraction` also slowed down by **2.2 seconds** (+6%). While not as dramatic as the analysis stage, it contributed to the overall slowdown.

### 3. Consistency in Embedding Bypassing
`job_skill_embeddings` remained at `0.05 ms`, confirming that this stage is consistently being skipped, potentially due to caching or a conditional check that is not being met.

### 4. No Retries or Formatting Errors
Despite the slowdown, the run was "clean" from a stability perspective. No retries or formatting fallback logic was triggered.

## Conclusion

The system remains stable but is experiencing a performance regression compared to the "peak efficiency" seen in `logs5.txt`. The bottleneck remains the LLM latency, which now accounts for nearly 53 seconds of the total 54s runtime.
