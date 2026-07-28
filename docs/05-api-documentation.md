# 5. API Documentation

## 5.1 Contract conventions

- Base URL: `/api/v1`
- Media type: `application/json`; dataset uploads use `multipart/form-data`; chat uses Server-Sent Events.
- OpenAPI: `/docs`, `/redoc`, and `/openapi.json` outside hardened production, or protected in production.
- Authentication: short-lived bearer access JWT. Rotating refresh token is held in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- IDs: UUID strings. Times: ISO 8601 UTC. Dates: ISO `YYYY-MM-DD`.
- Pagination: cursor-based for growing event/history collections; page-based only for bounded admin catalogs.
- Mutating retry-sensitive endpoints accept `Idempotency-Key`.
- Every response includes `X-Request-ID`; rate-limited responses include `Retry-After`.
- API DTOs use explicit Pydantic models with `extra="forbid"`.

## 5.2 Standard envelopes

Single resources return:

```json
{
  "data": {
    "id": "4f45bf66-f6fc-4ad1-aebb-f1eafc93e42a"
  },
  "meta": {
    "request_id": "01J4E9CME5G6D1JYF0D8XASR9T"
  }
}
```

Collections return:

```json
{
  "data": [],
  "meta": {
    "request_id": "01J4E9CME5G6D1JYF0D8XASR9T",
    "next_cursor": null,
    "has_more": false
  }
}
```

Errors use RFC 9457 problem details:

```json
{
  "type": "https://api.mediai.pro/problems/validation-error",
  "title": "Request validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "instance": "/api/v1/predictions",
  "request_id": "01J4E9CME5G6D1JYF0D8XASR9T",
  "errors": [
    {
      "field": "symptoms",
      "code": "too_few_items",
      "message": "Select at least one symptom."
    }
  ]
}
```

Stable error codes include `AUTH_INVALID`, `TOKEN_EXPIRED`, `MFA_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `RATE_LIMITED`, `MODEL_UNAVAILABLE`, `FEATURE_SCHEMA_MISMATCH`, `EXTERNAL_SERVICE_UNAVAILABLE`, and `INTERNAL_ERROR`.

## 5.3 Authentication APIs

| Method | Path | Access | Purpose | Success |
|---|---|---|---|---|
| POST | `/auth/register` | Public | Register patient and send verification | 201 |
| POST | `/auth/verify-email` | Public | Consume email-verification token | 204 |
| POST | `/auth/login` | Public | Authenticate; return access token or MFA challenge | 200 |
| POST | `/auth/mfa/verify` | Challenge | Complete MFA login | 200 |
| POST | `/auth/refresh` | Refresh cookie + CSRF | Rotate session and issue access token | 200 |
| POST | `/auth/logout` | Auth/cookie | Revoke current session | 204 |
| POST | `/auth/logout-all` | Auth | Revoke all user sessions | 204 |
| POST | `/auth/forgot-password` | Public | Send reset email without account disclosure | 202 |
| POST | `/auth/reset-password` | Public | Consume reset token and revoke sessions | 204 |
| GET | `/auth/sessions` | Auth | List active sessions | 200 |
| DELETE | `/auth/sessions/{session_id}` | Auth | Revoke a session | 204 |
| POST | `/auth/mfa/setup` | Auth | Create pending TOTP setup | 201 |
| POST | `/auth/mfa/confirm` | Auth | Confirm TOTP and issue recovery codes | 200 |
| DELETE | `/auth/mfa` | Auth + step-up | Disable MFA | 204 |

Registration accepts `email`, `password`, `display_name`, `timezone`, and exact `consent_document_ids`. Password values never appear in responses or logs.

## 5.4 Current-user APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | Auth | Identity, role, profile, and permissions |
| PATCH | `/users/me/profile` | Auth | Update allowed profile fields |
| GET | `/users/me/settings` | Auth | Load preferences |
| PATCH | `/users/me/settings` | Auth | Update preferences |
| GET | `/users/me/consents` | Auth | List consent history |
| POST | `/users/me/consents` | Auth | Record a versioned consent decision |
| POST | `/users/me/data-export` | Auth + step-up | Start privacy export job |
| POST | `/users/me/deletion-request` | Auth + step-up | Start account-deletion workflow |

PATCH endpoints use field omission for “unchanged” and explicit `null` only where clearing is allowed.

## 5.5 Clinical catalog APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/catalog/symptoms` | Auth | Search/filter active symptoms by category |
| GET | `/catalog/diseases/{disease_id}` | Auth | Approved patient-facing disease information |
| GET | `/catalog/specialties` | Auth | Active specialist categories |
| GET | `/catalog/lab-tests` | Doctor/Admin | Approved lab-test catalog |
| GET | `/catalog/prediction-schema` | Patient | Active model's required input schema |

Catalog endpoints return `ETag` and support conditional GET. They never expose internal training weights.

## 5.6 Prediction APIs

| Method | Path | Access | Purpose | Success |
|---|---|---|---|---|
| POST | `/predictions` | Patient | Validate assessment and run deterministic inference | 201 |
| GET | `/predictions` | Patient | Own paginated history | 200 |
| GET | `/predictions/{prediction_id}` | Owner/authorized doctor | Full immutable result | 200 |
| POST | `/predictions/{prediction_id}/explanation` | Owner | Retry unavailable explanation | 202 |
| PATCH | `/predictions/{prediction_id}` | Owner | Archive/unarchive only | 200 |
| GET | `/predictions/{prediction_id}/report` | Owner/authorized doctor | Get report job or signed download | 200 |
| POST | `/predictions/{prediction_id}/report` | Owner/authorized doctor | Queue PDF generation | 202 |

### Create prediction request

```json
{
  "symptoms": [
    {
      "symptom_id": "991178b6-91c9-4e35-9bc3-d90fe327faca",
      "intensity": 4,
      "duration_days": 2,
      "is_present": true
    }
  ],
  "age_years": 34,
  "sex_at_birth": "FEMALE",
  "context": {
    "temperature_celsius": 38.2
  },
  "informed_use_accepted": true
}
```

Constraints are supplied by `/catalog/prediction-schema`; the server independently validates them. The idempotency key prevents accidental duplicate records.

### Create prediction response

```json
{
  "data": {
    "id": "7cc36bb4-dc73-4a82-afc0-8a30ce28ad72",
    "status": "EXPLANATION_PENDING",
    "created_at": "2026-07-26T14:12:45Z",
    "model": {
      "version": "1.0.0",
      "trained_at": "2026-07-20T09:00:00Z"
    },
    "confidence": {
      "score": 0.81,
      "band": "HIGH",
      "label": "The model is relatively consistent for this input; this is not diagnostic certainty."
    },
    "emergency": {
      "is_emergency": false,
      "action_level": "ROUTINE",
      "message": null,
      "matched_rule_codes": []
    },
    "results": [
      {
        "rank": 1,
        "disease": {
          "id": "d12a2ef6-5351-4ee6-970c-7bfe41465ad6",
          "code": "INFLUENZA",
          "name": "Influenza"
        },
        "probability": 0.58,
        "severity": "MODERATE",
        "supporting_symptoms": ["Fever"],
        "missing_discriminative_symptoms": ["Dry cough"],
        "recommended_tests": [
          {
            "code": "FLU_NAAT",
            "name": "Influenza molecular assay",
            "priority": "CONDITIONAL",
            "rationale": "A clinician may use this test when confirmation would change management."
          }
        ],
        "specialist": {
          "code": "PRIMARY_CARE",
          "name": "Primary care physician"
        }
      }
    ],
    "explanation": null,
    "disclaimer": "This screening result is not a diagnosis. A qualified clinician must interpret it in context."
  },
  "meta": {
    "request_id": "01J4E9CME5G6D1JYF0D8XASR9T"
  }
}
```

The real response returns up to five populated results. When an emergency rule matches, the response still includes available results but the emergency object is visually and semantically primary.

## 5.7 Dashboard and analytics APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/dashboard/summary?period=30d` | Patient | Own summary cards and recent activity |
| GET | `/dashboard/trends?period=12w&interval=week` | Patient | Time-series prediction counts |
| GET | `/dashboard/disease-frequency?period=90d` | Patient | Ranked predicted-disease frequencies |
| GET | `/dashboard/reports/weekly` | Patient | Current weekly summary |
| GET | `/dashboard/reports/monthly` | Patient | Current monthly summary |

All analytics include `generated_at`, effective time range, and the distinction between predicted candidates and confirmed diagnoses.

## 5.8 Chat APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/chat/conversations` | Patient/Doctor | Start a general or prediction-grounded conversation |
| GET | `/chat/conversations` | Owner | List conversations |
| GET | `/chat/conversations/{id}` | Owner | Conversation with paginated messages |
| POST | `/chat/conversations/{id}/messages` | Owner | Persist user message and stream response |
| DELETE | `/chat/conversations/{id}` | Owner | Soft-delete conversation |

Message submission accepts `content` (1–4,000 characters) and an optional client message UUID. With `Accept: text/event-stream`, events are:

- `message.started`
- `message.delta`
- `message.completed`
- `safety.alert`
- `message.error`

The completion event includes message ID, grounding references, safety flags, and usage—not hidden reasoning.

## 5.9 Doctor APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/doctor/dashboard` | Doctor | Assigned patient and review summary |
| GET | `/doctor/patients` | Doctor | Patients with active grants |
| GET | `/doctor/patients/{patient_id}` | Authorized doctor | Shared profile and prediction timeline |
| GET | `/doctor/patients/{patient_id}/predictions` | Authorized doctor | Paginated prediction history |
| POST | `/doctor/predictions/{id}/reviews` | Authorized doctor | Record review disposition |
| POST | `/doctor/predictions/{id}/notes` | Authorized doctor | Create and sign note |
| POST | `/doctor/notes/{note_id}/revisions` | Note author/admin workflow | Append a correction |
| POST | `/doctor/access-grants/{grant_id}/accept` | Doctor | Accept an invitation |
| POST | `/doctor/reports/{prediction_id}` | Authorized doctor | Queue clinical PDF |

Clinical note creation requires `content`, `disposition`, and explicit `sign=true`. Signed notes cannot be patched or deleted through the API.

## 5.10 Patient access-grant APIs

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/access-grants` | Patient | List doctor access |
| POST | `/access-grants` | Patient | Invite doctor with scope and expiry |
| DELETE | `/access-grants/{id}` | Patient | Revoke future access |

Revocation does not remove audit history or already signed clinical records.

## 5.11 Admin APIs

### Users and audit

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/users` | Filtered paginated user list |
| GET | `/admin/users/{id}` | User operational detail |
| PATCH | `/admin/users/{id}/status` | Suspend/reactivate with reason |
| PATCH | `/admin/users/{id}/role` | Role change with step-up authentication |
| GET | `/admin/audit-logs` | Filtered audit events |
| GET | `/admin/analytics/summary` | Privacy-aware aggregate operations |

### Clinical catalog

| Method | Path | Purpose |
|---|---|---|
| POST/GET | `/admin/symptoms` | Create/list symptoms |
| PATCH | `/admin/symptoms/{id}` | Update or retire symptom |
| POST/GET | `/admin/diseases` | Create/list diseases |
| PATCH | `/admin/diseases/{id}` | Update or retire disease |
| PUT | `/admin/diseases/{id}/symptoms` | Replace versioned symptom mapping |
| PUT | `/admin/diseases/{id}/lab-tests` | Replace versioned test mapping |
| PUT | `/admin/diseases/{id}/specialties` | Replace versioned specialty mapping |
| POST/GET | `/admin/emergency-rules` | Create/list rules |
| POST | `/admin/emergency-rules/{id}/activate` | Approve and activate version |

Catalog writes require optimistic `version` to prevent lost updates.

### Dataset and model lifecycle

| Method | Path | Purpose | Success |
|---|---|---|---|
| POST | `/admin/datasets` | Upload dataset and metadata | 202 |
| GET | `/admin/datasets` | List datasets | 200 |
| GET | `/admin/datasets/{id}` | Validation status/report | 200 |
| POST | `/admin/datasets/{id}/validate` | Re-run validation | 202 |
| POST | `/admin/training-jobs` | Start training from valid dataset | 202 |
| GET | `/admin/training-jobs` | List jobs | 200 |
| GET | `/admin/training-jobs/{id}` | Job progress, safe logs, metrics | 200 |
| POST | `/admin/training-jobs/{id}/cancel` | Request cancellation | 202 |
| GET | `/admin/models` | List model versions | 200 |
| GET | `/admin/models/{id}` | Metrics, schema, evaluations | 200 |
| POST | `/admin/models/{id}/approve` | Record independent approval | 200 |
| POST | `/admin/models/{id}/activate` | Atomic promotion with reason | 200 |
| POST | `/admin/models/{id}/reject` | Reject candidate with reason | 200 |
| POST | `/admin/models/{id}/rollback` | Activate approved prior version | 200 |

Upload limits, allowed content type, checksum, schema version, and antivirus/scanning result are validated before training. Activation requires step-up authentication and an idempotency key.

## 5.12 Notifications and health

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/notifications` | Auth | Paginated notifications |
| PATCH | `/notifications/{id}` | Owner | Mark read/unread |
| POST | `/notifications/read-all` | Owner | Mark all read |
| GET | `/health/live` | Platform | Process liveness |
| GET | `/health/ready` | Platform | DB/model readiness; no secrets |
| GET | `/health/version` | Platform/Admin | Build identifier and API version |

## 5.13 Status-code and security behavior

- `400`: malformed operation; `401`: absent/invalid auth; `403`: authenticated but unauthorized.
- `404` is used where revealing resource existence would leak patient data.
- `409`: state/version/idempotency conflict; `413`: upload too large; `415`: unsupported media type.
- `422`: field validation; `429`: rate limited; `503`: model or required dependency unavailable.
- Login, refresh, prediction, chat, export, upload, and model lifecycle operations have separate per-user/IP rate-limit policies.
- OpenAPI documents request/response types, permissions, errors, idempotency, and rate-limit behavior for every route.

## 5.14 Design rationale

Versioned REST resources fit the system's durable workflows, while SSE handles the one genuinely streaming interaction without adding WebSocket operational complexity. Problem Details gives clients a stable error contract. Separate admin lifecycle actions make privileged transitions explicit, auditable, and difficult to trigger accidentally.
