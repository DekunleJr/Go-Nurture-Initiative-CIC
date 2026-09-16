from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _client_ip(request: Request) -> str:
    """Rate-limit key: the real client IP. Behind Render's and Vercel's
    reverse proxies request.client.host is the proxy's internal address, so
    every user would share one rate-limit bucket. Prefer the first hop of
    X-Forwarded-For (set by the proxy to the original browser IP), falling
    back to the remote address for direct (e.g. local) connections."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_client_ip)