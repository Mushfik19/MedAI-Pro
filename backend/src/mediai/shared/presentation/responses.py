"""Response-envelope construction helpers."""

from datetime import UTC, datetime

from mediai.shared.presentation.schemas import ApiResponse, ResponseMeta


def envelope[DataT](data: DataT, request_id: str) -> ApiResponse[DataT]:
    return ApiResponse(
        data=data,
        meta=ResponseMeta(request_id=request_id, timestamp=datetime.now(UTC)),
    )
