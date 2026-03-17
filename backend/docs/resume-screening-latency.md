# Why Resume Screening Is Slow Right Now

The current resume upload API is slow because it does all heavy processing before sending the HTTP response back to the client. A small PDF can still take many minutes if the LLM calls are slow or retried.

## Why It Is Slow

The current endpoint waits for the full pipeline to finish:

1. Validate the job and uploaded file.
2. Read the file content.
3. Create or fetch the candidate.
4. Save the file on disk.
5. Extract raw text from the PDF or DOCX.
6. Send the resume text to an Ollama LLM for structured extraction.
7. Normalize the extracted fields.
8. Fetch job skills.
9. Generate multiple embeddings.
10. Send another Ollama LLM request for resume-vs-JD analysis.
11. Write all records to the database.
12. Return the final response.

The main reasons this becomes slow are:

- The API is synchronous from the client point of view. It does not return early.
- PDF parsing happens inline in the request path.
- Structured extraction uses an Ollama LLM call.
- Resume analysis uses a second Ollama LLM call.
- The extractor is configured with `LANGEXTRACT_RETRY_ATTEMPTS=3` and `LANGEXTRACT_RETRY_DELAY=60`.
- Both the extractor and analyzer use `timeout=300`, which means one slow call can block for up to 5 minutes.
- Embeddings are generated several times in one request.
- Some embeddings are duplicated. The resume and JD are encoded once, then encoded again inside semantic scoring.
- Job-skill and candidate-skill embeddings add more work if many skills do not already have cached vectors.
- There is no stage-level timing log, so it is hard to tell which exact step consumed the time.

## Why 13 Minutes Can Happen

A 13-minute response is possible with the current settings.

Example:

- The extraction LLM call becomes slow and hits a 300-second timeout.
- The retry policy waits another 60 seconds.
- The next extraction attempt runs again.
- After extraction finishes, the analysis LLM call still has to run.
- Embedding generation still has to run.
- Database writes still happen at the end.

Because of that, one delayed extraction step can already consume several minutes before the rest of the pipeline completes.

## How To Make It Faster

The best fix is to stop doing the full analysis during the upload request.

### Recommended approach

- Save the file first.
- Create the basic candidate/file/resume record first.
- Return an immediate response with a processing status such as `queued` or `processing`.
- Run parsing, extraction, embeddings, and JD analysis in the background.
- Provide a status endpoint so the frontend can poll until processing is complete.

### Additional optimizations

- Reuse already computed resume and JD embeddings instead of recomputing them inside semantic scoring.
- Compute job embeddings only once and reuse them.
- Compute skill embeddings only for skills that do not already have stored vectors.
- Add timing logs around each major step:
  - file save
  - document text extraction
  - LLM extraction
  - normalization
  - embedding generation
  - LLM analysis
  - database persistence
  - total processing time
- Reduce retry and timeout cost where safe.
- If needed, use a hybrid design:
  - upload returns quickly
  - deep analysis finishes asynchronously

## Current Resume Upload To Response Flow

This is the current process in simple terms:

1. Client uploads the resume file to `POST /jobs/{job_id}/resume`.
2. Backend checks whether the job exists and is active.
3. Backend validates file name, extension, and size.
4. Backend reads the uploaded file content into memory.
5. Backend fetches or creates the candidate for that job.
6. Backend stores the file on disk under the resume upload directory.
7. Backend extracts raw text from the document.
8. Backend sends the raw text to the extraction LLM.
9. Backend normalizes extracted values like name, skills, education, and experience.
10. Backend loads job skills from the database.
11. Backend builds candidate text and job text.
12. Backend generates job, candidate, chunk, and skill embeddings.
13. Backend calculates semantic score.
14. Backend sends the final resume-vs-JD prompt to the analysis LLM.
15. Backend updates job, skill, candidate, file, resume, and chunk records.
16. Backend generates candidate skill embeddings if needed.
17. Backend commits the transaction.
18. Backend sends the final success response with analysis.

## Summary

The main issue is not the PDF size. The main issue is that the upload request waits for two LLM-driven stages, repeated embeddings, and all persistence work before responding. The fastest reliable improvement is to make upload fast and move heavy screening work to background processing.
