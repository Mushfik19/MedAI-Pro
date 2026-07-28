"""Application-wide protocol and infrastructure constants."""

REQUEST_ID_HEADER = "X-Request-ID"
PROCESS_TIME_HEADER = "X-Process-Time-Ms"
RATE_LIMIT_LIMIT_HEADER = "X-RateLimit-Limit"
RATE_LIMIT_REMAINING_HEADER = "X-RateLimit-Remaining"
RATE_LIMIT_RESET_HEADER = "X-RateLimit-Reset"
PROBLEM_DETAILS_MEDIA_TYPE = "application/problem+json"
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
