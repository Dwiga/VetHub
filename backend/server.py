"""
Thin reverse proxy that forwards every /api/* request hitting port 8001 to
the TanStack Start dev server running on port 3000. This is required because
Emergent's ingress routes /api/* to the backend supervisor service (port 8001),
while the actual API handlers live in the TanStack Start app on port 3000.

In production this responsibility would be handled by a real reverse proxy
(nginx/Caddy). This module exists purely to satisfy the pod's pinned
supervisor topology while we collapse the codebase into a single TanStack
Start app.
"""

from __future__ import annotations

import os
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse

UPSTREAM = os.environ.get("FRONTEND_INTERNAL_URL", "http://127.0.0.1:3000")
TIMEOUT = httpx.Timeout(60.0, connect=5.0)

app = FastAPI(title="vetcare-api-proxy")
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False)


@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


def _filter_headers(items: list[tuple[bytes, bytes]]) -> list[tuple[str, str]]:
    return [
        (k.decode("latin-1"), v.decode("latin-1"))
        for (k, v) in items
        if k.decode("latin-1").lower() not in HOP_BY_HOP
    ]


@app.get("/")
async def root() -> JSONResponse:
    return JSONResponse(
        {
            "service": "vetcare-api-proxy",
            "upstream": UPSTREAM,
            "note": "All /api/* traffic is proxied to the TanStack Start app.",
        }
    )


@app.get("/healthz")
async def healthz() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request) -> Response:
    assert _client is not None, "httpx client not initialised"

    target_url = f"{UPSTREAM}/api/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    fwd_headers = _filter_headers(list(request.headers.raw))
    # Preserve original client info for the upstream.
    client_host = request.client.host if request.client else ""
    if client_host:
        existing_xff = request.headers.get("x-forwarded-for")
        fwd_headers.append(
            ("x-forwarded-for", f"{existing_xff}, {client_host}" if existing_xff else client_host)
        )

    body = await request.body()

    try:
        upstream = await _client.request(
            method=request.method,
            url=target_url,
            headers=fwd_headers,
            content=body if body else None,
        )
    except httpx.ConnectError:
        return JSONResponse(
            {"error": "upstream unavailable", "upstream": UPSTREAM},
            status_code=502,
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            {"error": "upstream request failed", "detail": str(exc)},
            status_code=502,
        )

    resp_headers = [
        (k, v) for (k, v) in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    ]

    async def _iter() -> AsyncIterator[bytes]:
        # We already buffered the upstream response above; re-emit in chunks.
        chunk_size = 65536
        data = upstream.content
        for i in range(0, len(data), chunk_size):
            yield data[i : i + chunk_size]

    return StreamingResponse(
        _iter(),
        status_code=upstream.status_code,
        headers=dict(resp_headers),
        media_type=upstream.headers.get("content-type"),
    )
