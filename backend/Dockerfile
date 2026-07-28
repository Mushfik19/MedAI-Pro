FROM python:3.13.14-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --upgrade pip setuptools wheel && pip install .

FROM python:3.13.14-slim AS runtime

ENV PATH="/opt/venv/bin:${PATH}" \
    MEDIAI_RUNTIME_ROOT=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN groupadd --system --gid 10001 mediai \
    && useradd --system --uid 10001 --gid mediai --create-home mediai

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY alembic.ini ./
COPY alembic ./alembic
COPY src ./src
COPY --chown=mediai:mediai data ./data

RUN mkdir -p /app/artifacts/ml /app/artifacts/reports /app/data/ml \
    && chown -R mediai:mediai /app/artifacts /app/data

USER mediai
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/live', timeout=3)"

CMD ["uvicorn", "mediai.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
