"""Loguru configuration with standard-library logging interception."""

import logging
import sys
from types import FrameType

from loguru import logger

from mediai.core.config import Settings


class InterceptHandler(logging.Handler):
    """Forward standard-library records to Loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        level: str | int
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame: FrameType | None = logging.currentframe()
        depth = 2
        while frame is not None and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def configure_logging(settings: Settings) -> None:
    """Configure deterministic console logging for the current environment."""

    logger.remove()
    logger.add(
        sys.stdout,
        level=settings.log_level,
        serialize=settings.log_json,
        backtrace=settings.debug,
        diagnose=False,
        enqueue=True,
    )
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(name).handlers = [InterceptHandler()]
        logging.getLogger(name).propagate = False
