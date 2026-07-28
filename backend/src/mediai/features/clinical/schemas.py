"""Clinical request and response contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from mediai.core.enums import DiseaseSeverity, LLMProvider, NotificationChannel, NotificationStatus, ReportFormat


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ClinicalPredictionRequest(StrictSchema):
    age: float = Field(ge=0, le=120)
    fever_celsius: float = Field(ge=34.0, le=45.0)
    cough_severity: float = Field(ge=0, le=3)
    sore_throat: float = Field(ge=0, le=3)
    shortness_of_breath: float = Field(ge=0, le=3)
    chest_pain: float = Field(ge=0, le=3)
    headache: float = Field(ge=0, le=3)
    fatigue: float = Field(ge=0, le=3)
    nausea: float = Field(ge=0, le=3)
    vomiting: float = Field(ge=0, le=3)
    diarrhea: float = Field(ge=0, le=3)
    abdominal_pain: float = Field(ge=0, le=3)
    rash: float = Field(ge=0, le=3)
    urinary_burning: float = Field(ge=0, le=3)
    joint_pain: float = Field(ge=0, le=3)
    loss_of_taste_smell: float = Field(ge=0, le=3)
    oxygen_saturation: float = Field(ge=50, le=100)
    systolic_bp: float = Field(ge=50, le=240)
    diastolic_bp: float = Field(ge=30, le=160)
    heart_rate: float = Field(ge=30, le=220)
    respiratory_rate: float = Field(ge=8, le=60)
    glucose_mg_dl: float = Field(ge=30, le=800)
    wbc_count: float = Field(ge=0.1, le=100.0)
    platelets_count: float = Field(ge=1, le=1_000)
    travel_exposure: float = Field(ge=0, le=1)
    contact_exposure: float = Field(ge=0, le=1)
    chronic_conditions_count: float = Field(ge=0, le=10)
    symptom_duration_days: float = Field(ge=0, le=120)
    weight_loss: float = Field(ge=0, le=1)
    neck_stiffness: float = Field(ge=0, le=1)
    photophobia: float = Field(ge=0, le=1)


class TopDiseaseItem(StrictSchema):
    code: str
    name: str
    probability: float
    severity: DiseaseSeverity
    specialty: str


class PredictionExplanationItem(StrictSchema):
    feature: str
    impact: float
    rationale: str
    confidence_context: float


class PredictionResponse(StrictSchema):
    primary_disease_code: str
    primary_disease_name: str
    top_diseases: list[TopDiseaseItem]
    probability: float
    confidence: float
    severity: DiseaseSeverity
    explanation: list[PredictionExplanationItem]
    disease_explanation: str
    medical_summary: str
    chat_response: str
    lab_recommendations: list[str]
    specialist_recommendations: list[str]
    lifestyle_advice: list[str]
    model_version: str
    llm_provider: LLMProvider


class PredictionHistoryItem(StrictSchema):
    id: UUID
    request_id: str
    predicted_disease_code: str
    predicted_disease_name: str
    disease_severity: DiseaseSeverity
    probability: float
    confidence: float
    created_at: datetime


class PredictionHistoryResponse(StrictSchema):
    items: list[PredictionHistoryItem]
    total: int
    limit: int
    offset: int


class ReportResponse(StrictSchema):
    report_id: UUID
    file_name: str
    mime_type: str
    format: ReportFormat
    download_url: str


class AnalyticsMetric(StrictSchema):
    label: str
    value: float


class AnalyticsResponse(StrictSchema):
    metrics: list[AnalyticsMetric]
    chart_payload: dict[str, object]


class NotificationItem(StrictSchema):
    id: UUID
    channel: NotificationChannel
    status: NotificationStatus
    title: str
    body: str
    created_at: datetime


class NotificationListResponse(StrictSchema):
    items: list[NotificationItem]
    total: int


class AuditLogItem(StrictSchema):
    id: UUID
    action: str
    resource_type: str
    resource_id: UUID | None
    outcome: str
    request_id: str
    created_at: datetime


class AuditLogListResponse(StrictSchema):
    items: list[AuditLogItem]
    total: int


class SearchRequest(StrictSchema):
    query: str = Field(min_length=1, max_length=200)


class FilterRequest(StrictSchema):
    disease_code: str | None = None
    severity: DiseaseSeverity | None = None
    limit: int = Field(default=25, ge=1, le=100)
    offset: int = Field(default=0, ge=0, le=10_000)


class DashboardResponse(StrictSchema):
    total_predictions: int
    top_diseases: list[AnalyticsMetric]
    severity_breakdown: list[AnalyticsMetric]
    recent_predictions: list[PredictionHistoryItem]
    unread_notifications: int


class DoctorItem(StrictSchema):
    id: UUID
    full_name: str
    specialty: str
    hospital_name: str
    bio: str
    languages: list[str]
    is_active: bool


class DoctorListResponse(StrictSchema):
    items: list[DoctorItem]
    total: int


class SettingItem(StrictSchema):
    key: str
    value: object


class SettingListResponse(StrictSchema):
    items: list[SettingItem]


class LLMChatRequest(StrictSchema):
    message: str = Field(min_length=1, max_length=4_000)


class LLMChatResponse(StrictSchema):
    answer: str