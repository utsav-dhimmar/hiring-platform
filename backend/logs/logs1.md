• The logs make the bottleneck clear: it is not PDF parsing or DB work. It is almost entirely LLM extraction plus CPU embedding
generation.

Breakdown from your run:

- document_text_extraction: 156 ms
- llm_resume_extraction: 745,660 ms = about 12m 26s
- job_embedding: 149,650 ms = about 2m 30s
- candidate_embedding: 112,690 ms = about 1m 53s
- chunk_embedding: 87,748 ms = about 1m 28s
- llm_resume_analysis: 16,858 ms = about 16.9s
- DB persistence steps: mostly 0-414 ms
- Total: 1,113,892 ms = about 18m 34s

What happened inside extraction:

- First extraction attempt failed with Ollama API error: 500
- Second attempt hit timeout=300
- Third attempt finally succeeded
- Because extraction has retries, one bad run plus one timeout already burned most of the total time

What happened inside embeddings:

- The embedding model was loaded on CPU
- It also hit Hugging Face on first use, so this was a cold start
- Even after loading, each encode took a long time on CPU:
    - JD encode: 2m 30s
    - candidate encode: 1m 53s
    - raw chunk encode: 1m 28s

So the root cause from these logs is:

1. LangExtract + Ollama extraction is unstable and retrying
2. Qwen/Qwen3-Embedding-0.6B is too slow on your current CPU path
3. first-request cold start is making embeddings even worse
4. DB is not the problem

Immediate fixes I recommend next:

- Reduce extractor retry cost:
    - lower LANGEXTRACT_RETRY_ATTEMPTS
    - lower LANGEXTRACT_RETRY_DELAY
    - lower extractor timeout from 300
- Preload the embedding model at app startup so first request does not cold-load it
- Replace the embedding model with a much smaller/faster one, or move embeddings to GPU/remote inference
- Stop generating all 3 embeddings in the critical path if you do not need them immediately
- Add a cache/warmup step on startup for both Ollama and embeddings

If you want, I can implement the next optimization pass now:

- fail-fast extractor settings
- startup warmup for embeddings
- smaller/faster embedding model
- remove one or two unnecessary embeddings from the processing path
