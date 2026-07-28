"""Composition root for API version 1 routes."""

from fastapi import APIRouter

from mediai.features.auth.router import router as auth_router
from mediai.features.clinical.router import router as clinical_router
from mediai.features.health.router import router as health_router
from mediai.features.portal.router import router as portal_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(clinical_router)
api_v1_router.include_router(health_router)
api_v1_router.include_router(portal_router)
