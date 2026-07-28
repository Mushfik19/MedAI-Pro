# 4. ER Diagram

The diagram focuses on domain relationships. Operational columns and some join-table attributes are documented in the database design.

```mermaid
erDiagram
    USERS ||--|| USER_PROFILES : has
    USERS ||--|| USER_SETTINGS : configures
    USERS ||--o{ REFRESH_SESSIONS : owns
    USERS ||--o{ USER_CONSENTS : grants
    LEGAL_DOCUMENTS ||--o{ USER_CONSENTS : versions

    USERS ||--o{ PREDICTIONS : submits
    MODEL_VERSIONS ||--o{ PREDICTIONS : serves
    PREDICTIONS ||--o{ PREDICTION_SYMPTOMS : contains
    SYMPTOMS ||--o{ PREDICTION_SYMPTOMS : selected_as
    PREDICTIONS ||--|{ PREDICTION_RESULTS : ranks
    DISEASES ||--o{ PREDICTION_RESULTS : predicted_as
    PREDICTIONS ||--o| PREDICTION_EXPLANATIONS : explains
    PREDICTIONS ||--o{ PREDICTION_REVIEWS : reviewed_in
    USERS ||--o{ PREDICTION_REVIEWS : performs
    PREDICTIONS ||--o{ CLINICAL_NOTES : documents
    USERS ||--o{ CLINICAL_NOTES : authors
    CLINICAL_NOTES ||--o{ CLINICAL_NOTES : revises
    PREDICTIONS ||--o{ REPORTS : exports
    USERS ||--o{ REPORTS : requests

    USERS ||--o{ DOCTOR_PATIENT_GRANTS : patient
    USERS ||--o{ DOCTOR_PATIENT_GRANTS : doctor

    DISEASES ||--o{ DISEASE_SYMPTOMS : maps
    SYMPTOMS ||--o{ DISEASE_SYMPTOMS : maps
    DISEASES ||--o{ DISEASE_LAB_TESTS : recommends
    LAB_TESTS ||--o{ DISEASE_LAB_TESTS : recommended_for
    DISEASES ||--o{ DISEASE_SPECIALTIES : refers_to
    SPECIALTIES ||--o{ DISEASE_SPECIALTIES : handles

    USERS ||--o{ CHAT_CONVERSATIONS : owns
    PREDICTIONS ||--o{ CHAT_CONVERSATIONS : grounds
    CHAT_CONVERSATIONS ||--|{ CHAT_MESSAGES : contains
    USERS ||--o{ NOTIFICATIONS : receives

    USERS ||--o{ DATASETS : uploads
    DATASETS ||--o{ TRAINING_JOBS : trains
    USERS ||--o{ TRAINING_JOBS : starts
    TRAINING_JOBS ||--o| MODEL_VERSIONS : produces
    MODEL_VERSIONS ||--|{ MODEL_EVALUATIONS : evaluated_by
    MODEL_VERSIONS ||--o{ MODEL_EVENTS : transitions
    USERS ||--o{ MODEL_EVENTS : authorizes

    USERS ||--o{ AUDIT_LOGS : acts

    USERS {
        uuid id PK
        citext email UK
        enum role
        enum status
        timestamptz created_at
    }
    PREDICTIONS {
        uuid id PK
        uuid patient_id FK
        uuid model_version_id FK
        jsonb input_snapshot
        boolean is_emergency
        numeric confidence_score
        timestamptz created_at
    }
    PREDICTION_RESULTS {
        uuid id PK
        uuid prediction_id FK
        uuid disease_id FK
        smallint rank
        numeric probability
        jsonb tests_snapshot
        jsonb specialist_snapshot
    }
    MODEL_VERSIONS {
        uuid id PK
        uuid training_job_id FK
        varchar semantic_version UK
        enum status
        varchar artifact_checksum
        jsonb metrics
    }
    DOCTOR_PATIENT_GRANTS {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        enum status
        timestamptz expires_at
    }
    CLINICAL_NOTES {
        uuid id PK
        uuid prediction_id FK
        uuid doctor_id FK
        uuid parent_note_id FK
        integer revision_number
        timestamptz signed_at
    }
    DATASETS {
        uuid id PK
        varchar version
        enum status
        varchar checksum_sha256
        jsonb validation_report
    }
    TRAINING_JOBS {
        uuid id PK
        uuid dataset_id FK
        enum status
        varchar code_version
        integer random_seed
    }
```

## Relationship notes

- `USERS` plays different roles; database constraints plus application authorization validate patient/doctor/admin role compatibility.
- Prediction result snapshots deliberately coexist with foreign keys. Foreign keys enable analytics; snapshots guarantee historical rendering if catalog text changes.
- A training job produces at most one promoted model bundle. Failed experiments remain training records without a model version.
- Doctor access is explicit through grants. A role alone is insufficient to read patient data.
