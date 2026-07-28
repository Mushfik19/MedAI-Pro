from httpx import AsyncClient


async def test_deployed_frontend_preflight_is_accepted(client: AsyncClient) -> None:
    origin = "https://med-ai-pro-frontend.vercel.app"

    response = await client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-custom-header",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "x-custom-header" in response.headers["access-control-allow-headers"].lower()


async def test_localhost_preflight_remains_accepted(client: AsyncClient) -> None:
    origin = "http://localhost:5173"

    response = await client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
