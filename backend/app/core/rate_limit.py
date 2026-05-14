import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


_buckets: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(name: str, limit: int, window_seconds: int):
    def dependency(request: Request):
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        key = f"{name}:{client_ip}"
        now = time.monotonic()
        bucket = _buckets[key]

        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

        bucket.append(now)

    return dependency
