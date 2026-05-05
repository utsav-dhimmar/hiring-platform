"""
System management service.

Handles system-wide administrative tasks like cache management.
"""

import logging
from app.v1.core.cache import cache

_log = logging.getLogger(__name__)

class SystemService:
    """Service for system-wide administrative operations."""

    async def clear_cache(self) -> bool:
        """
        Clear application-specific cache keys (selective delete).
        This avoids deleting internal Celery/Broker keys.
        """
        _log.info("Selective cache clear started for 'job*' and 'analytics*'")
        
        # We use 'job*' to catch 'job_embedding', 'job_stats', etc.
        res1 = await cache.clear(pattern="job*")
        res2 = await cache.clear(pattern="analytics*")
        
        _log.info("Selective cache clear completed. Results: job=%s, analytics=%s", res1, res2)
        return res1 and res2

# Global instance
system_service = SystemService()
