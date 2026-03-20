"""
Redis cache module.

This module provides a robust, reusable async Redis cache client for
application-wide caching with proper serialization and connection management.
"""

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.v1.core.config import settings

_log = logging.getLogger(__name__)


class RedisCache:
    """Async Redis cache with JSON serialization."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._client: aioredis.Redis | None = None

    def _get_client(self) -> aioredis.Redis | None:
        """Lazily initialize the Redis client; returns None if Redis is unavailable."""
        if self._client is not None:
            return self._client
        try:
            self._client = aioredis.from_url(
                self._url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=1,
            )
        except Exception as exc:  # noqa: BLE001
            _log.warning("Redis unavailable, caching disabled: %s", exc)
        return self._client

    async def get(self, key: str) -> Any | None:
        """Retrieve and deserialize a value from the cache."""
        client = self._get_client()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            return json.loads(raw) if raw else None
        except Exception as exc:  # noqa: BLE001
            _log.debug("Redis GET failed key=%s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Serialize and store a value in the cache with an optional TTL."""
        client = self._get_client()
        if client is None:
            return
        try:
            raw = json.dumps(value, default=str)
            await client.set(key, raw, ex=ttl or settings.CACHE_TTL_SECONDS)
        except Exception as exc:  # noqa: BLE001
            _log.debug("Redis SET failed key=%s: %s", key, exc)

    async def delete(self, key: str) -> None:
        """Remove a value from the cache."""
        client = self._get_client()
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:  # noqa: BLE001
            _log.debug("Redis DELETE failed key=%s: %s", key, exc)

    async def close(self) -> None:
        """Gracefully close the Redis connection."""
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception:  # noqa: BLE001
                pass
            self._client = None


# Global cache instance
cache = RedisCache(settings.REDIS_URL)
