# 3. Database Design

## 3.1 Standards

- PostgreSQL on Supabase with UUID primary keys generated server-side.
- All timestamps are timezone-aware UTC (`timestamptz`); the UI formats the user's timezone.
- Table names are plural `snake_case`; foreign keys use `<entity>_id`.
- SQLAlchemy 2.x models and Alembic own schema migrations. Production schema changes never use `create_all`.
- Transactional tables include `created_at`; mutable records include `updated_at` and optimistic `version`.
- Clinical and ML history is append-only or versioned. JSONB is used for immutable snapshots and variable model metrics, not for core relational entities.
- Email uses case-insensitive uniqueness through a normalized value or `citext`.
- Sensitive audit payloads store identifiers and change summaries, not secrets or unrestricted PHI.

## 3.2 Identity and access

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `email` | citext | unique, not null |
| `password_hash` | varchar(255) | not null |
| `role` | enum | `PATIENT`, `DOCTOR`, `ADMIN` |
| `status` | enum | `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED` |
| `email_verified_at` | timestamptz | nullable |
| `mfa_enabled` | boolean | default false |
| `last_login_at` | timestamptz | nullable |
| `created_at`, `updated_at` | timestamptz | not null |
| `version` | integer | optimistic lock |

Indexes: unique email, `(role, status)`, `created_at`.

### `user_profiles`

| Column | Type | Constraints |
|---|---|---|
| `user_id` | uuid | PK, FK users |
| `display_name` | varchar(120) | not null |
| `date_of_birth` | date | nullable |
| `sex_at_birth` | enum | nullable; model input only when required |
| `phone` | varchar(32) | nullable |
| `locale` | varchar(16) | default `en` |
| `timezone` | varchar(64) | not null |
| `avatar_object_key` | varchar(512) | nullable |
| `created_at`, `updated_at` | timestamptz | not null |

### `user_settings`

`user_id` PK/FK, `theme`, `reduced_motion`, `email_notifications`, `in_app_notifications`, `clinical_reminders`, timestamps.

### `refresh_sessions`

`id`, `user_id`, `token_family_id`, `token_hash`, `expires_at`, `last_used_at`, `revoked_at`, `replaced_by_id`, `ip_hash`, `user_agent`, timestamps. Unique token hash; indexes on user and family. Raw refresh tokens are never stored.

### `verification_tokens`

`id`, `user_id`, `purpose`, `token_hash`, `expires_at`, `consumed_at`, `created_at`. Purposes include email verification and password reset. Expired rows are purged by a scheduled job.

### `mfa_credentials`

`id`, `user_id`, encrypted TOTP secret, recovery-code hashes, `verified_at`, `disabled_at`, timestamps. Encryption key is managed outside the database.

### `legal_documents` and `user_consents`

`legal_documents`: `id`, `document_type`, `version`, `content_hash`, `published_at`, `retired_at`.  
`user_consents`: `id`, `user_id`, `legal_document_id`, `decision`, `ip_hash`, `created_at`, `withdrawn_at`.

The immutable document version proves exactly what was accepted.

## 3.3 Clinical catalog

### `symptoms`

`id`, unique `code`, `name`, `description`, `category`, `is_red_flag`, `status`, timestamps.

### `diseases`

`id`, unique `code`, `name`, `summary`, `severity` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), `status`, timestamps.

### `disease_symptoms`

`disease_id`, `symptom_id`, `weight`, `is_common`, `source_reference`, `valid_from`, `valid_to`. Composite PK includes validity start so historical mappings can be resolved.

### `lab_tests`

`id`, unique `code`, `name`, `description`, `preparation_guidance`, `status`, timestamps.

### `disease_lab_tests`

`disease_id`, `lab_test_id`, `priority`, `rationale`, `valid_from`, `valid_to`.

### `specialties`

`id`, unique `code`, `name`, `description`, `status`, timestamps.

### `disease_specialties`

`disease_id`, `specialty_id`, `priority`, `valid_from`, `valid_to`.

### `emergency_rules`

`id`, unique `code`, `version`, `name`, `condition_json`, `message`, `action_level`, `is_active`, `approved_by`, `approved_at`, timestamps.

`condition_json` uses a validated internal rule schema (symptom sets, demographics, duration, and intensity); it is not arbitrary executable code.

## 3.4 Prediction and review

### `predictions`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `patient_id` | uuid | FK users, not null |
| `model_version_id` | uuid | FK model_versions, not null |
| `rule_set_version` | varchar(64) | not null |
| `status` | enum | `PROCESSING`, `COMPLETED`, `EXPLANATION_PENDING`, `FAILED` |
| `input_snapshot` | jsonb | validated immutable assessment |
| `is_emergency` | boolean | not null |
| `confidence_score` | numeric(6,5) | 0..1 |
| `confidence_band` | enum | `LOW`, `MEDIUM`, `HIGH` |
| `inference_ms` | integer | nonnegative |
| `explanation_status` | enum | `PENDING`, `COMPLETED`, `UNAVAILABLE`, `NOT_REQUESTED` |
| `archived_at` | timestamptz | nullable |
| `created_at`, `completed_at` | timestamptz | |

Indexes: `(patient_id, created_at desc)`, `(is_emergency, created_at desc)`, model version. A partial index excludes archived records for default patient history.

### `prediction_symptoms`

`prediction_id`, `symptom_id`, `intensity`, `duration_days`, `is_present`, `created_at`. Composite PK `(prediction_id, symptom_id)`. This supports analytics without parsing snapshots; snapshots remain the reproducibility source.

### `prediction_results`

`id`, `prediction_id`, `disease_id`, `rank` (1..5), `probability` (0..1), `severity_snapshot`, `supporting_evidence` JSONB, `missing_evidence` JSONB, `tests_snapshot` JSONB, `specialist_snapshot` JSONB, `created_at`.

Constraints: unique `(prediction_id, rank)` and `(prediction_id, disease_id)`.

### `prediction_explanations`

`id`, `prediction_id`, `provider`, `provider_model`, `prompt_template_version`, `grounding_hash`, `content`, `safety_flags` JSONB, `token_usage` JSONB, `created_at`. No chain-of-thought is requested or stored.

### `doctor_patient_grants`

`id`, `patient_id`, `doctor_id`, `status`, `scope`, `granted_by`, `starts_at`, `expires_at`, `revoked_at`, timestamps. An exclusion/validation rule prevents overlapping duplicate active grants for the same scope.

### `prediction_reviews`

`id`, `prediction_id`, `doctor_id`, `disposition`, `reviewed_at`, `created_at`. Unique active review per doctor/prediction.

### `clinical_notes`

`id`, `prediction_id`, `doctor_id`, `parent_note_id`, `revision_number`, `content`, `signed_at`, `voided_at`, `void_reason`, `created_at`. Signed content is immutable; corrections create a child revision.

### `reports`

`id`, `prediction_id`, `requested_by`, `status`, `format`, `object_key`, `checksum`, `expires_at`, `failure_code`, timestamps. Object keys point to private storage with short-lived signed download URLs.

## 3.5 Chat and notifications

### `chat_conversations`

`id`, `user_id`, optional `prediction_id`, `title`, `status`, `created_at`, `updated_at`, `deleted_at`.

### `chat_messages`

`id`, `conversation_id`, `role`, `content`, `sequence_number`, `provider`, `provider_model`, `grounding_metadata` JSONB, `safety_flags` JSONB, `created_at`. Unique `(conversation_id, sequence_number)`.

### `notifications`

`id`, `user_id`, `type`, `title`, `body`, `action_path`, `read_at`, `created_at`. Sensitive data is excluded from notification text.

## 3.6 ML lifecycle

### `datasets`

`id`, `name`, `version`, `status`, `object_key`, `checksum_sha256`, `schema_version`, `row_count`, `feature_count`, `validation_report` JSONB, `uploaded_by`, `validated_at`, timestamps.

Statuses: `UPLOADED`, `VALIDATING`, `VALID`, `INVALID`, `ARCHIVED`.

### `training_jobs`

`id`, `dataset_id`, `status`, `algorithm`, `parameters` JSONB, `random_seed`, `code_version`, `started_by`, `started_at`, `completed_at`, `logs_object_key`, `failure_code`, timestamps.

### `model_versions`

`id`, `training_job_id`, unique `semantic_version`, `status`, `algorithm`, `artifact_object_key`, `artifact_checksum`, `feature_schema` JSONB, `label_schema` JSONB, `metrics` JSONB, `calibration_metrics` JSONB, `thresholds` JSONB, `approved_by`, `approved_at`, `activated_at`, `retired_at`, timestamps.

Statuses: `CANDIDATE`, `APPROVED`, `ACTIVE`, `RETIRED`, `REJECTED`. A partial unique index permits only one `ACTIVE` prediction model.

### `model_evaluations`

`id`, `model_version_id`, `dataset_split`, `metrics` JSONB, `confusion_matrix` JSONB, `subgroup_metrics` JSONB, `drift_baseline` JSONB, `passed_gates`, `evaluated_at`.

### `model_events`

`id`, `model_version_id`, `event_type`, `actor_id`, `reason`, `metadata` JSONB, `created_at`. Captures approval, activation, rollback, and retirement.

## 3.7 Operations

### `audit_logs`

`id` (bigint), optional `actor_id`, `action`, `resource_type`, optional `resource_id`, `outcome`, `request_id`, `ip_hash`, `user_agent`, `changes` JSONB, `created_at`. Append-only; monthly partitioning is introduced when volume warrants it.

### `idempotency_keys`

`id`, `user_id`, `scope`, `key_hash`, `request_hash`, `response_status`, `response_body` JSONB, `expires_at`, `created_at`. Unique `(user_id, scope, key_hash)`.

### `outbox_events`

`id`, `event_type`, `aggregate_type`, `aggregate_id`, `payload` JSONB, `occurred_at`, `processed_at`, `attempts`, `last_error`. Written in the same transaction as domain changes so notifications and background tasks are not lost.

## 3.8 Retention and deletion

- Prediction and clinical-record retention is configurable by legal jurisdiction and validated before production.
- Account deletion creates a tracked request, immediately revokes sessions, then anonymizes or deletes eligible data after the retention review.
- Audit logs retain pseudonymous identifiers where legally required and do not retain raw message or note bodies.
- Chat can be deleted independently unless a legal retention requirement applies.
- Dataset and model artifacts are retained while referenced by historical predictions.

## 3.9 Design rationale

Relational tables enforce core identities, permissions, catalogs, and lifecycle state. Immutable JSONB snapshots preserve the exact inference context without making the mutable catalog a historical dependency. Versioned artifacts, checksum verification, access grants, and append-only review records make predictions reproducible and clinically auditable.
