## Best Performance

### Caching Strategy / Management

To ensure fast response times and reduce the load on the database and AI processing components, the platform utilizes **Redis** for efficient caching:
* **Job Embeddings:** Frequently accessed job requirement vectors (JD embeddings) are cached so they don’t need to be repeatedly fetched and re-vectorized from PostgreSQL during candidate matching.
* **Similarity Results:** Pre-calculated similarity scores between candidates and jobs are temporarily cached, allowing instant retrieval for dashboard visualization without re-triggering the Reciprocal Rank Fusion (RRF) scoring engine.
* **Session & State Caching:** Redis is utilized to maintain user sessions and rapidly track the status of long-running async background tasks.

### Optimization Techniques / Process

The system employs several infrastructural optimizations to handle computationally heavy AI workloads without degrading user experience:

* **Batch Embedding Generation:** Instead of vectorizing sentences one by one, text chunks extracted from resumes are processed in batches by the Sentence Transformers, maximizing GPU/CPU throughput.
* **Asynchronous Transcription:** Audio and video processing for interview stages (Stage 1 to 3) is strictly handled asynchronously. HR requests the transcription and can continue using the platform while the backend processes the media in the background.
* **Lazy Loading:** On the frontend, candidate results and massive data tables are lazy-loaded and paginated to decrease initial payload sizes.
* **Vector Indexing (`pgvector`):** The PostgreSQL database utilizes specialized `pgvector` indexes (such as HNSW or IVFFlat) to perform blazing-fast semantic similarity searches across candidate models.
