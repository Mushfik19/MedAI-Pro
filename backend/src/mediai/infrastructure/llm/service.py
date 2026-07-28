"""Provider-backed and offline-safe medical language generation."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx

from mediai.core.config import Settings
from mediai.core.enums import LLMProvider
from mediai.shared.domain.exceptions import LLMServiceError


@dataclass(frozen=True, slots=True)
class LLMEnrichment:
    disease_explanation: str
    medical_summary: str
    chat_response: str
    lab_recommendations: list[str]
    specialist_recommendations: list[str]
    lifestyle_advice: list[str]


class MedicalLLMService:
    """Generate medically constrained natural-language assistance around a fixed ML result."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.provider = LLMProvider.OPENAI_COMPATIBLE if settings.llm_enabled else LLMProvider.OFFLINE
        self.base_url = settings.llm_base_url.rstrip("/")
        self.api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else ""
        self.model = settings.llm_model
        self.timeout = settings.llm_timeout_seconds
        self.max_tokens = settings.llm_max_tokens

    async def enrich_prediction(
        self,
        *,
        disease_name: str,
        disease_severity: str,
        probability: float,
        confidence: float,
        explanation: str,
        labs: list[str],
        specialists: list[str],
        lifestyle: list[str],
        context: dict[str, Any],
    ) -> LLMEnrichment:
        if self.provider is LLMProvider.OFFLINE:
            return LLMEnrichment(
                disease_explanation=self._offline_disease_explanation(disease_name, probability, confidence),
                medical_summary=self._offline_summary(disease_name, disease_severity, probability, explanation),
                chat_response=self._offline_chat_response(disease_name, context),
                lab_recommendations=labs,
                specialist_recommendations=specialists,
                lifestyle_advice=lifestyle,
            )

        payload = self._build_prompt_payload(
            disease_name=disease_name,
            disease_severity=disease_severity,
            probability=probability,
            confidence=confidence,
            explanation=explanation,
            labs=labs,
            specialists=specialists,
            lifestyle=lifestyle,
            context=context,
        )
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "temperature": 0.2,
                        "max_tokens": self.max_tokens,
                        "messages": payload,
                    },
                )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return LLMEnrichment(
                disease_explanation=str(parsed["disease_explanation"]),
                medical_summary=str(parsed["medical_summary"]),
                chat_response=str(parsed["chat_response"]),
                lab_recommendations=[str(item) for item in parsed["lab_recommendations"]],
                specialist_recommendations=[str(item) for item in parsed["specialist_recommendations"]],
                lifestyle_advice=[str(item) for item in parsed["lifestyle_advice"]],
            )
        except (httpx.HTTPError, KeyError, ValueError, json.JSONDecodeError) as error:
            raise LLMServiceError("The configured LLM provider returned an invalid response.") from error

    async def answer_chat(self, *, user_message: str, context: dict[str, Any]) -> str:
        if self.provider is LLMProvider.OFFLINE:
            return self._offline_chat_response(context.get("disease_name", "the predicted condition"), context)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "temperature": 0.2,
                        "max_tokens": self.max_tokens,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are a clinical explanation assistant. Never replace the model's disease prediction. "
                                    "Only explain, summarize, and suggest safe follow-up actions."
                                ),
                            },
                            {"role": "user", "content": user_message},
                        ],
                    },
                )
            response.raise_for_status()
            return str(response.json()["choices"][0]["message"]["content"])
        except (httpx.HTTPError, KeyError, ValueError) as error:
            raise LLMServiceError("The configured LLM provider could not answer the chat request.") from error

    def _build_prompt_payload(
        self,
        *,
        disease_name: str,
        disease_severity: str,
        probability: float,
        confidence: float,
        explanation: str,
        labs: list[str],
        specialists: list[str],
        lifestyle: list[str],
        context: dict[str, Any],
    ) -> list[dict[str, str]]:
        system_prompt = (
            "You are a conservative medical language assistant. The machine-learning prediction is authoritative. "
            "Do not change, soften, or replace the predicted disease. Return strict JSON with keys: "
            "disease_explanation, medical_summary, chat_response, lab_recommendations, specialist_recommendations, lifestyle_advice."
        )
        user_prompt = json.dumps(
            {
                "prediction": {
                    "disease_name": disease_name,
                    "severity": disease_severity,
                    "probability": probability,
                    "confidence": confidence,
                    "explanation": explanation,
                    "lab_recommendations": labs,
                    "specialist_recommendations": specialists,
                    "lifestyle_advice": lifestyle,
                },
                "case_context": context,
            },
            ensure_ascii=True,
        )
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    @staticmethod
    def _offline_disease_explanation(disease_name: str, probability: float, confidence: float) -> str:
        return (
            f"The model most strongly supports {disease_name} with probability {probability:.1%} "
            f"and confidence {confidence:.1%}. This explanation is constrained to the model output and does not override it."
        )

    @staticmethod
    def _offline_summary(disease_name: str, severity: str, probability: float, explanation: str) -> str:
        return (
            f"Predicted condition: {disease_name}. Severity: {severity}. Probability: {probability:.1%}. "
            f"Key factors: {explanation}."
        )

    @staticmethod
    def _offline_chat_response(disease_name: str, context: dict[str, Any]) -> str:
        return (
            f"I can explain the predicted condition {disease_name} and suggest safe follow-up questions, "
            f"but the model output remains authoritative. Context received: {sorted(context)}."
        )