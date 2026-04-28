import redis
import sys

try:
    r = redis.from_url("redis://localhost:6379/0")
    r.ping()
    print("Redis is alive")
except Exception as e:
    print(f"Redis is dead: {e}")
    sys.exit(1)
