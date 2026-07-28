from fastapi import FastAPI
from httpx import AsyncClient

from mediai.shared.domain.exceptions import ConflictError


async def test_application_error_uses_problem_details(app: FastAPI, client: AsyncClient) -> None:
    @app.get("/test-conflict", include_in_schema=False)
    async def conflict_route() -> None:
        raise ConflictError("The resource version is stale.")

    response = await client.get("/test-conflict")
    assert response.status_code == 409
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "CONFLICT"
    assert response.json()["request_id"] == response.headers["X-Request-ID"]
