"""Stable API envelopes, pagination, and Problem Details schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResponseMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_id: str
    timestamp: datetime


class ApiResponse[DataT](BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: DataT
    meta: ResponseMeta


class CursorMeta(ResponseMeta):
    next_cursor: str | None = None
    has_more: bool = False


class ApiCollectionResponse[DataT](BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: list[DataT]
    meta: CursorMeta


class FieldProblem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field: str
    code: str
    message: str


class ProblemDetails(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    title: str
    status: int
    detail: str
    instance: str
    code: str
    request_id: str
    errors: list[FieldProblem] = Field(default_factory=list)
