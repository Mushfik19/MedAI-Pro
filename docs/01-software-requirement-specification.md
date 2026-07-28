# Software Requirements Specification (SRS)

## MediAI Pro — Intelligent Disease Prediction & Clinical Decision Support System

| Document property | Value |
|---|---|
| Document ID | MAP-SRS-001 |
| Version | 1.0 |
| Status | Proposed — awaiting stakeholder approval |
| Date | 2026-07-26 |
| Product | MediAI Pro |
| Intended release | Production MVP |
| Classification | Internal product and engineering specification |

### Approval record

| Role | Approver | Decision | Date |
|---|---|---|---|
| Product owner | Pending | Pending | Pending |
| Clinical safety reviewer | Pending | Pending | Pending |
| Engineering lead | Pending | Pending | Pending |
| Security/privacy reviewer | Pending | Pending | Pending |

No implementation phase may begin from this specification until the product owner approves it. Clinical, privacy, security, and production-release approvals remain separate mandatory gates.

## 1. Introduction

### 1.1 Purpose

MediAI Pro is a responsive web platform that helps patients and clinicians assess symptom patterns, review machine-learning differential predictions, understand supporting information, and manage longitudinal prediction records. Administrators manage clinical reference data, users, datasets, model training, and analytics.

The product is a **clinical decision support system (CDSS)**. It must clearly state that results are informational, may be wrong, and do not replace a licensed clinician. It must never autonomously diagnose, prescribe, or advise delaying emergency care.

This SRS defines the product behavior, user roles, functional and non-functional requirements, user stories, use cases, business rules, constraints, acceptance criteria, and future scope. It is the baseline against which architecture, implementation, testing, security review, and release readiness will be evaluated.

### 1.2 Product objectives

- Provide a fast, understandable, and safety-conscious symptom assessment.
- Produce a reproducible top-five differential prediction using a versioned ML model.
- Help users understand results without presenting them as confirmed diagnoses.
- Give authorized clinicians a structured review and documentation workflow.
- Give administrators a governed, auditable ML and clinical-catalog lifecycle.
- Protect health-related data through least privilege, consent, traceability, and secure defaults.
- Demonstrate production-grade full-stack and ML engineering suitable for a professional portfolio.

### 1.3 Scope

### In scope

- Public marketing and product information
- Secure patient, doctor, and administrator authentication
- Symptom-based top-five disease prediction
- Probability, calibrated confidence, severity, explanation, recommended tests, specialist category, and emergency warning
- Prediction history, dashboards, reports, and charts
- Grounded AI chat about a user's prediction and general health education
- Doctor review, clinical notes, and PDF report export
- Administration of users, symptoms, diseases, mappings, datasets, and ML model lifecycle
- Audit logs, consent capture, privacy controls, monitoring, and deployment configuration

### Out of scope for the initial release

- Autonomous diagnosis or treatment
- Medication prescribing or drug dosage generation
- EHR/HL7/FHIR integration
- Medical imaging interpretation
- Telemedicine/video consultation
- Insurance billing
- Continuous vital-sign monitoring
- Pediatric use without a separately validated pediatric model and consent flow

### 1.4 Definitions and abbreviations

| Term | Definition |
|---|---|
| CDSS | Clinical Decision Support System |
| Differential prediction | A ranked set of possible diseases produced from supplied features; not a diagnosis |
| ML | Machine learning |
| LLM | Large language model used only for explanation and educational chat |
| Red flag | A symptom or feature combination requiring urgent escalation guidance |
| OOD | Out of distribution; an input insufficiently represented by the validated model population |
| PHI | Protected health information, where applicable under governing law |
| RBAC | Role-based access control |
| MFA | Multi-factor authentication |
| Model bundle | Immutable preprocessing, classifier, calibration, schema, label mapping, and metadata artifact |
| Active model | The single approved model version currently serving predictions |
| Access grant | Time-bound patient authorization allowing a doctor to view defined patient records |
| Prediction snapshot | Immutable copy of input, result, mappings, and versions at inference time |

### 1.5 Stakeholders

- Product owner: prioritizes scope and accepts product behavior.
- Patients/end users: submit assessments and manage their records.
- Doctors/clinical reviewers: review authorized patient records and document clinical interpretation.
- Clinical safety reviewer: approves health terminology, red-flag rules, recommendations, and limitations.
- Administrators: operate catalogs, users, datasets, models, and analytics.
- Engineering and ML teams: implement and maintain the platform and model lifecycle.
- Security/privacy reviewer: approves data handling, access, retention, vendors, and operational controls.
- Operations team: owns deployment, monitoring, backup, incident response, and recovery.

### 1.6 Assumptions and dependencies

- A legally usable, de-identified, clinically appropriate labeled dataset will be selected before model development.
- Supported diseases, symptom vocabulary, age range, population, geography, and language will be explicitly approved before release.
- Clinical reviewers will approve emergency rules, disease severity, lab-test mappings, specialist mappings, safety copy, and model limitations.
- Vercel, Railway, Supabase PostgreSQL, object storage, transactional email, monitoring, and an LLM vendor will be available under suitable security and data-processing terms.
- Users will have a modern web browser, JavaScript enabled, and internet connectivity.
- The initial release will support English unless product approval expands localization scope.
- The platform will not ingest real patient data until legal, security, privacy, clinical, and operational readiness gates pass.

## 2. User roles and authorization

| Role | Primary goals | Authorized access | Explicit restrictions |
|---|---|---|
| Visitor | Understand the platform and safety limitations; create an account | Public landing, safety, privacy, terms, registration, login, and recovery pages | No patient, doctor, admin, prediction, or chat data |
| Patient | Run assessments, understand results, manage history, chat, and control doctor access | Own profile, settings, consents, sessions, predictions, reports, conversations, notifications, and access grants | Cannot access another user, confirm diagnoses, edit model/catalog data, or write clinical notes |
| Doctor | Review consented patient records, record disposition, add signed notes, and export reports | Own account plus records covered by an active access grant | Role alone grants no patient access; cannot modify ML results, patient identity, signed notes, model state, or admin data |
| Administrator | Operate accounts, clinical catalogs, datasets, models, audit logs, and aggregate analytics | Administrative resources allowed by permission and step-up authentication | No implicit authority to view all patient clinical detail, alter signed doctor notes, or bypass model promotion gates |
| System worker | Execute trusted asynchronous jobs | Narrow service identity for explanation, report, notification, dataset-validation, and training tasks | No interactive login; no access beyond the job's service permissions |

Authorization is enforced in the API and never relies on hidden frontend controls. A doctor must have an active patient access grant or explicit assignment. All sensitive reads and writes create audit events.

### 2.1 Permission principles

- Deny access by default.
- Verify authentication, role, resource ownership, grant scope, grant status, and grant expiry on every protected operation.
- Use separate permissions for user administration, catalog administration, model operations, audit viewing, and sensitive exports.
- Require recent step-up authentication for role changes, MFA removal, model activation/rollback, sensitive data export, and other high-risk actions.
- Return a non-disclosing not-found response where revealing record existence would expose patient information.
- Never permit an administrator to remove or demote the final active administrator.
- Use independent service credentials for web API, worker, migration, and read-only analytics responsibilities.

## 3. User stories

### 3.1 Visitor stories

- US-VIS-01: As a visitor, I want to understand what MediAI Pro does so that I can decide whether it is appropriate for me.
- US-VIS-02: As a visitor, I want prominent limitations and emergency guidance so that I do not mistake the platform for emergency or diagnostic care.
- US-VIS-03: As a visitor, I want accessible registration and sign-in flows so that I can use the service on my preferred device and assistive technology.
- US-VIS-04: As a visitor, I want to review privacy and consent terms before registering so that I can make an informed choice.

### 3.2 Patient stories

- US-PAT-01: As a patient, I want to register, verify my email, and securely sign in so that only I can access my account.
- US-PAT-02: As a patient, I want to search and select symptoms with intensity and duration so that my assessment accurately reflects my situation.
- US-PAT-03: As a patient, I want to review and correct inputs before submission so that accidental selections do not affect my result.
- US-PAT-04: As a patient, I want up to five ranked disease candidates with probabilities so that I can understand the model's differential output.
- US-PAT-05: As a patient, I want severity, confidence, supporting evidence, recommended tests, and specialist guidance explained plainly so that I can discuss the result with a clinician.
- US-PAT-06: As a patient with red-flag symptoms, I want immediate, prominent emergency guidance so that routine content does not delay urgent care.
- US-PAT-07: As a patient, I want the prediction to remain available when AI explanation fails so that a third-party LLM outage does not block the core service.
- US-PAT-08: As a patient, I want to view, filter, archive, and export my prediction history so that I can manage longitudinal records.
- US-PAT-09: As a patient, I want weekly and monthly summaries so that I can observe usage patterns without confusing them with confirmed diagnoses.
- US-PAT-10: As a patient, I want to ask grounded educational questions about a prediction so that I can understand terminology and prepare for a clinical consultation.
- US-PAT-11: As a patient, I want to grant and revoke time-bound doctor access so that I control who reviews my information.
- US-PAT-12: As a patient, I want to manage profile, preferences, consent, sessions, data export, and deletion requests so that I retain privacy control.
- US-PAT-13: As a patient, I want charts and severity indicators to be accessible without relying on color so that disability does not prevent understanding.

### 3.3 Doctor stories

- US-DOC-01: As a doctor, I want a prioritized list of consented patients and red-flag predictions so that I can review urgent cases efficiently.
- US-DOC-02: As a doctor, I want to see the exact historical prediction input, model version, and result so that my review is auditable.
- US-DOC-03: As a doctor, I want to record a review disposition so that the patient and audit history show that the result received clinical attention.
- US-DOC-04: As a doctor, I want to create and sign a clinical note so that my interpretation becomes part of the authorized record.
- US-DOC-05: As a doctor, I want to append a correction rather than overwrite a signed note so that clinical history remains trustworthy.
- US-DOC-06: As a doctor, I want to export an accessible PDF report so that I can use the information in an approved offline workflow.
- US-DOC-07: As a doctor, I want access scope and expiry displayed clearly so that I do not unintentionally view information outside patient consent.

### 3.4 Administrator stories

- US-ADM-01: As an administrator, I want to search and manage account status and roles so that platform access remains controlled.
- US-ADM-02: As an administrator, I want to version symptoms, diseases, severity, tests, specialists, mappings, and emergency rules so that clinical content changes are traceable.
- US-ADM-03: As an administrator, I want uploaded datasets quarantined and validated so that malformed or unapproved data cannot reach training.
- US-ADM-04: As an administrator, I want to launch and monitor a reproducible training job so that model experiments have recorded data, code, parameters, and seeds.
- US-ADM-05: As an administrator, I want to compare candidate performance, calibration, subgroup results, and latency so that promotion is evidence based.
- US-ADM-06: As an administrator, I want model approval and activation to be separate audited actions so that a trained model cannot silently become live.
- US-ADM-07: As an administrator, I want to roll back to a previously approved model so that unsafe or degraded behavior can be contained quickly.
- US-ADM-08: As an administrator, I want privacy-aware analytics and audit search so that I can operate the platform without unnecessary clinical-data exposure.

### 3.5 Operations and safety stories

- US-OPS-01: As an operator, I want health, readiness, logs, metrics, and traces so that failures are detected and diagnosed.
- US-OPS-02: As an operator, I want verified backups and tested recovery procedures so that data can be restored after an incident.
- US-SAF-01: As a clinical safety reviewer, I want deterministic red-flag rules to operate independently of ML and LLM services so that emergency guidance remains available.
- US-SAF-02: As a clinical safety reviewer, I want historical outputs tied to model, rule, prompt, and catalog versions so that an incident can be reconstructed.
- US-SEC-01: As a security reviewer, I want sensitive reads, exports, account actions, and model changes audited so that inappropriate activity is detectable.

## 4. Use cases

### UC-01 Register and verify a patient account

- Primary actor: Visitor
- Preconditions: The visitor is not authenticated and accepts the current required legal documents.
- Trigger: The visitor submits the registration form.
- Main flow:
  1. The system validates email, password policy, display name, timezone, rate limits, and consent versions.
  2. The system creates a pending patient account and records immutable consent decisions.
  3. The system sends a single-use, time-limited verification message.
  4. The visitor submits the verification token.
  5. The system activates the account and invalidates the token.
  6. The system records security and consent audit events.
- Alternative flows:
  - Existing email: return a non-disclosing response and offer account recovery.
  - Expired/used token: reject it and permit a rate-limited replacement.
  - Email provider failure: keep the account pending and permit retry.
- Postconditions: An active verified patient exists, or no active account is created.

### UC-02 Authenticate and maintain a secure session

- Primary actor: Patient, Doctor, or Administrator
- Preconditions: The account is active and email verified.
- Trigger: The user submits credentials.
- Main flow:
  1. The system validates rate limits and credentials without exposing which field failed.
  2. If the role/policy requires MFA, the system issues a short-lived challenge.
  3. The user completes MFA.
  4. The system creates a refresh-session family and issues a short-lived access token.
  5. The system records the login and updates last-login metadata.
- Alternative flows:
  - Invalid credentials or MFA: deny access and increment throttling controls.
  - Suspended/deactivated account: deny access and revoke existing sessions.
  - Refresh-token replay: revoke the entire token family and create a security event.
- Postconditions: A secure session exists, or access remains denied.

### UC-03 Create a disease prediction

- Primary actor: Patient
- Supporting actors: ML inference service, emergency-rule engine, background explanation worker
- Preconditions: The patient is authenticated, verified, active, has accepted current informed-use terms, and an approved active model is ready.
- Trigger: The patient submits a reviewed assessment.
- Main flow:
  1. The system validates symptom identifiers, intensity, duration, context, informed-use acknowledgement, model feature schema, and idempotency key.
  2. The emergency engine evaluates pre-inference red-flag rules.
  3. The system transforms the assessment using the active model bundle.
  4. The model calculates calibrated class probabilities.
  5. The system ranks and selects up to five unique diseases.
  6. The system calculates the approved confidence score/band and evaluates OOD conditions.
  7. The system enriches candidates with versioned severity, test, specialist, and evidence metadata.
  8. The emergency engine evaluates post-inference rules.
  9. The system atomically persists immutable input/result/version snapshots and an audit record.
  10. The system returns the prediction, giving emergency guidance visual priority when applicable.
  11. The system queues an optional grounded explanation.
- Alternative flows:
  - Duplicate idempotency key with identical input: return the original result.
  - Duplicate key with different input: return a conflict.
  - Emergency rule match: return immediate emergency guidance even if ML later fails.
  - Active model unavailable or schema incompatible: return a safe unavailable error; never fabricate results.
  - LLM failure: retain the completed prediction and mark explanation unavailable.
- Postconditions: One reproducible prediction exists, or no partial/false prediction is committed.

### UC-04 Review prediction history and export a report

- Primary actor: Patient
- Preconditions: The patient owns at least one prediction.
- Trigger: The patient opens history or requests an export.
- Main flow:
  1. The system returns only the patient's predictions using authorized pagination and filters.
  2. The patient selects a record and sees its immutable snapshot and safety disclosures.
  3. The patient requests a PDF.
  4. A background job renders a versioned accessible report and stores it privately.
  5. The patient receives an in-app notification and a short-lived authorized download.
- Alternative flows:
  - No history: display an informative empty state.
  - Report job failure: display retry guidance without altering the prediction.
  - Expired download: authorize the owner and issue a new short-lived URL.
- Postconditions: The original record is unchanged; any export is checksummed and audited.

### UC-05 Use grounded AI chat

- Primary actor: Patient or authorized Doctor
- Preconditions: The actor is authenticated; prediction-scoped chat requires access to that prediction.
- Trigger: The actor sends an educational question.
- Main flow:
  1. The system validates length, quota, moderation, and authorization.
  2. The system retrieves only approved knowledge and permitted prediction context.
  3. The system redacts unnecessary identifiers before calling the LLM.
  4. The system streams a response constrained by the medical safety policy.
  5. The system validates output, stores provenance/safety metadata, and completes the message.
- Alternative flows:
  - Emergency/crisis language: interrupt routine presentation and show emergency action guidance.
  - Request for diagnosis, prescribing, or dosage: refuse and redirect to appropriate professional care.
  - Vendor timeout or invalid output: end safely, allow retry, and do not invent an answer.
- Postconditions: A grounded educational exchange is recorded, or a safe error/refusal is recorded.

### UC-06 Grant or revoke doctor access

- Primary actor: Patient
- Supporting actor: Doctor
- Preconditions: Both accounts are active and the target user has a verified doctor role.
- Trigger: The patient creates or revokes an access grant.
- Main flow:
  1. The patient selects the doctor, scope, and expiry.
  2. The system validates scope, identity, duplicates, and maximum duration.
  3. The system creates a pending or active grant and notifies the doctor.
  4. The doctor accepts where acceptance is required.
  5. The system authorizes only resources within the active grant.
  6. The patient may revoke future access at any time.
- Alternative flows:
  - Expired, revoked, rejected, or invalid grant: deny all new reads.
  - Doctor attempts out-of-scope access: deny without confirming resource existence and audit the attempt.
- Postconditions: Doctor access exactly matches active patient authorization; historical audit and signed records remain.

### UC-07 Doctor reviews a prediction and signs a note

- Primary actor: Doctor
- Preconditions: The doctor is authenticated with required MFA and has an active grant covering the patient and prediction.
- Trigger: The doctor opens a prediction from the review queue.
- Main flow:
  1. The system revalidates the grant and records sensitive access.
  2. The doctor reviews the input, result, evidence, mappings, versions, and disclaimer.
  3. The doctor records a review disposition.
  4. The doctor writes a note and explicitly confirms signing.
  5. The system stores an immutable signed note and records an audit event.
  6. The system notifies the patient according to preferences and policy.
- Alternative flows:
  - Grant expires during the session: deny the write and require renewed authorization.
  - Correction needed after signing: create a linked revision; preserve the signed original.
- Postconditions: The prediction remains immutable; review and note history is append-only.

### UC-08 Admin manages clinical catalog content

- Primary actor: Administrator
- Supporting actor: Clinical safety reviewer
- Preconditions: The administrator has catalog permission and current step-up authentication where required.
- Trigger: The administrator creates or revises clinical content.
- Main flow:
  1. The administrator submits validated catalog content and source reference.
  2. The system checks uniqueness, references, version, and mapping integrity.
  3. Required clinical review is recorded.
  4. The system activates a new version without rewriting historical prediction snapshots.
  5. The system records before/after summaries in the audit log.
- Alternative flows:
  - Optimistic version conflict: reject and require review of the newer state.
  - Referenced record in use: retire/version it rather than physically deleting it.
- Postconditions: A traceable catalog version exists; history remains reproducible.

### UC-09 Upload and validate a dataset

- Primary actor: Administrator
- Preconditions: The administrator has dataset permission and an approved dataset source.
- Trigger: The administrator uploads a dataset and metadata.
- Main flow:
  1. The system enforces file size/type policy and stores the file in quarantine.
  2. The system calculates and records a checksum.
  3. A worker scans and validates provenance metadata, schema, values, labels, leakage indicators, missingness, duplicates, balance, and subgroup coverage.
  4. The system stores a validation report and marks the dataset valid or invalid.
  5. The system notifies the administrator and audits the outcome.
- Alternative flows:
  - Malware, invalid type, missing provenance, schema failure, or policy violation: keep quarantined/reject and prevent training.
  - Duplicate checksum: link to or report the existing immutable dataset version.
- Postconditions: Only a validated immutable dataset version is eligible for training.

### UC-10 Train, approve, activate, and roll back a model

- Primary actor: Administrator
- Supporting actors: ML worker, independent reviewer
- Preconditions: A valid dataset exists; the actor has appropriate permissions.
- Trigger: The administrator starts a training job.
- Main flow:
  1. The system records dataset checksum, code version, algorithm, parameters, and random seed.
  2. The worker preprocesses, trains, calibrates, and evaluates candidate models.
  3. The system records aggregate, top-k, per-class, subgroup, calibration, latency, and OOD metrics.
  4. A candidate passing all predefined gates is stored with a verified immutable artifact.
  5. An authorized reviewer explicitly approves or rejects the candidate with a reason.
  6. A step-up-authenticated administrator atomically activates an approved candidate.
  7. API instances verify and warm the bundle before serving it.
  8. If a production issue occurs, an approved previous model is atomically reactivated.
- Alternative flows:
  - Validation/training/evaluation failure: mark failed and retain safe diagnostic metadata.
  - Gate failure: prevent approval/activation.
  - Artifact checksum/schema/load failure: reject serving and retain the last verified active model.
  - Cancellation: stop at a safe checkpoint and mark cancelled.
- Postconditions: At most one model is active; all transitions and reasons are auditable.

### UC-11 Manage account privacy

- Primary actor: Patient, Doctor, or Administrator acting on own account
- Preconditions: The actor is authenticated and completes step-up authentication for sensitive actions.
- Trigger: The actor requests data export or account deletion.
- Main flow:
  1. The system validates identity and records the request.
  2. For export, a background job gathers only the actor's authorized portable data.
  3. For deletion, the system revokes sessions and evaluates retention/legal holds.
  4. Eligible data is deleted or anonymized according to policy.
  5. The system records completion without retaining unnecessary sensitive content.
- Alternative flows:
  - Active legal/clinical retention requirement: explain that specific records cannot yet be erased.
  - Export failure: retain request status and permit safe retry.
- Postconditions: Privacy request status and actions are traceable.

### UC-12 Detect and respond to a production safety incident

- Primary actor: Operator/Administrator
- Preconditions: Monitoring and at least one previously approved model are available.
- Trigger: Drift, error, access anomaly, or clinical safety alert crosses a defined threshold.
- Main flow:
  1. The system raises an alert with correlation and model/version metadata.
  2. The operator investigates without exposing unnecessary patient content.
  3. The responsible owner classifies severity and records the incident.
  4. Unsafe functionality is degraded, disabled, or rolled back according to the runbook.
  5. The system verifies recovery and continues enhanced monitoring.
- Alternative flows:
  - No safe model is available: mark prediction unavailable while keeping emergency guidance and static safety resources available.
- Postconditions: Containment and recovery actions are documented and auditable.

## 5. Functional requirements

### FR-01 Landing page

- Present value proposition, product workflow, safety statement, feature overview, FAQ, and calls to action.
- Provide accessible navigation, responsive layouts, reduced-motion support, dark mode, and SEO metadata.
- Avoid claims of guaranteed accuracy or clinical certification unless verified and approved.

### FR-02 Authentication and sessions

- Register a patient with verified email, password-policy validation, required consent acceptance, and rate limiting.
- Log in all roles with generic invalid-credential errors.
- Rotate refresh tokens after use and revoke the token family on replay detection.
- Support logout-current-session, logout-all-sessions, forgot-password, reset-password, verify-email, and optional TOTP MFA for doctor/admin roles.
- Lock or throttle repeated failed attempts without exposing whether an email exists.

### FR-03 Profile, privacy, and settings

- Manage name, date of birth, sex-at-birth field used only when clinically required, contact details, locale, timezone, theme, and notification preferences.
- Keep account identity separate from optional clinical profile data.
- Display active sessions and allow revocation.
- Capture versioned legal consent and allow data export/deletion requests.
- Reject impossible dates and enforce server-side field constraints.

### FR-04 Disease prediction

- Load the active symptom catalog grouped by clinical category.
- Accept symptom IDs plus duration, intensity, age band, sex-at-birth when model-required, and optional context fields defined by the active feature schema.
- Require informed-use acknowledgement before submission.
- Validate feature compatibility against the active model version.
- Return between one and five ranked candidates, limited by the active model's eligible labels, with calibrated probability, confidence band, disease severity, supporting/missing discriminative symptoms, recommended lab tests, specialist category, red-flag status, model version, and prediction timestamp.
- Execute a deterministic emergency rule engine before and after model inference. Emergency rules take precedence over normal presentation.
- Generate an LLM explanation only from the structured prediction payload and approved knowledge entries. If the LLM fails, return the ML result with explanation status `UNAVAILABLE`; prediction success must not depend on the LLM.
- Persist the input snapshot, result snapshot, model version, rule version, explanation provenance, latency, and actor.
- Prevent duplicate creation through an idempotency key.

### FR-05 Prediction history and reports

- List, filter, sort, and paginate the current user's predictions.
- Show a prediction detail view with immutable input/result snapshots.
- Allow soft archival by the patient without deleting audit evidence.
- Generate weekly and monthly summaries with disease-frequency trends and clear caveats that repeated predictions are not confirmed diagnoses.
- Export an accessible PDF report containing patient-approved information, model/version metadata, clinician notes, safety disclaimer, and generation timestamp.

### FR-06 Dashboard

- Show total predictions, recent activity, average confidence, red-flag count, time trends, and disease frequency.
- Use server-aggregated data for consistent metrics and performance.
- Provide explicit empty, loading, partial-error, and permission-denied states.

### FR-07 AI chat

- Start conversations scoped to general education or a selected prediction.
- Stream assistant responses.
- Ground responses in approved disease knowledge and the selected prediction; retain citations/provenance in stored message metadata.
- Refuse diagnosis, medication dosage, and unsupported medical claims.
- Detect crisis/emergency language and display the emergency action UI.
- Redact avoidable sensitive fields before sending context to the LLM vendor.
- Enforce usage quotas, timeouts, moderation, and conversation deletion.

### FR-08 Doctor dashboard

- List patients with active access grants, recent predictions, and red-flag status.
- View longitudinal prediction reports and relevant patient-shared context.
- Add signed, append-only clinical notes; corrections create a new note version instead of overwriting history.
- Mark predictions reviewed and record review disposition.
- Export prediction reports to PDF.
- Never expose patients without a valid grant.

### FR-09 Admin dashboard

- Search, filter, suspend, reactivate, and role-manage users with safeguards against removing the last active admin.
- Create and version disease, symptom, lab test, specialist, mapping, and emergency-rule records.
- Upload datasets to private storage, compute checksum, validate schema/content, and quarantine failures.
- Start retraining jobs, monitor logs/metrics, compare candidate models, approve/reject promotion, activate one model version atomically, and roll back to a prior version.
- View privacy-aware aggregate analytics and audit trails.
- Require step-up authentication for role changes and model promotion.

### FR-10 Notifications

- Create in-app notifications for report completion, access grants, model job completion, account security events, and doctor review.
- Email only transactional events opted into or required for security.
- Do not include sensitive clinical detail in email subject lines.

### FR-11 Doctor access grants

- Allow a patient to create a doctor invitation with explicit resource scope and expiry.
- Verify that the invited account is an active doctor without disclosing private account details unnecessarily.
- Allow the doctor to accept or reject a pending invitation.
- Allow the patient to revoke active access with immediate effect on future reads and writes.
- Display grant status, scope, start, expiry, and revocation to both parties.
- Revalidate the grant on every patient-resource operation and audit allowed and denied sensitive access.

### FR-12 Dataset and ML model lifecycle

- Store every dataset version privately with provenance metadata, content checksum, schema version, uploader, and immutable validation report.
- Prevent invalid, quarantined, unapproved, or archived datasets from starting training.
- Run training asynchronously with explicit code version, parameters, algorithm, random seed, progress, safe logs, and cancellation state.
- Store evaluation, calibration, class, subgroup, latency, OOD, and artifact-integrity results for each candidate.
- Require explicit review and approval before activation.
- Activate an approved model atomically, verify it before serving, retain one active version, and preserve rollback targets.
- Record training, evaluation, approval, rejection, activation, rollback, load failure, and retirement as audit/model events.

### FR-13 Audit and operational controls

- Assign or propagate a correlation ID for every request and background job.
- Record authentication, authorization, sensitive read, export, consent, account, catalog, access-grant, dataset, and model events.
- Prevent normal application roles from modifying or deleting audit records.
- Provide liveness and readiness checks that reveal no secret or patient information.
- Expose structured operational metrics for request rate, errors, latency, dependency health, job status, inference, OOD, and artifact loading.
- Support scheduled retention, expired-token/session cleanup, outbox retry, and failed-job handling.
- Preserve usable emergency and safety information during nonessential dependency outages.

### FR-14 Data export and account deletion

- Allow an authenticated user with recent step-up verification to request a portable export of their authorized data.
- Generate exports asynchronously, store them privately, notify the requester, and require a short-lived authorized download.
- Allow an authenticated user to request account deletion and immediately revoke sessions when the workflow is confirmed.
- Apply approved retention, legal-hold, deletion, and anonymization policies to each data class.
- Expose request status and completion/failure information without leaking protected internal details.

## 6. Business rules

- BR-01: Only one model version may be `ACTIVE` per prediction task.
- BR-02: A model cannot become active without a successful evaluation, approved feature schema, model artifact checksum, reviewer, and audit event.
- BR-03: Probabilities displayed to users come only from the ML inference result after calibration.
- BR-04: Severity is curated disease metadata plus emergency-rule output; it is not invented by the LLM.
- BR-05: Recommended tests and specialists come from versioned clinical mappings; the LLM may explain but not create them.
- BR-06: Red-flag rules always override routine recommendations and are logged by rule version.
- BR-07: Historical prediction snapshots are immutable even if the disease catalog or model changes.
- BR-08: Administrators cannot silently edit signed doctor notes.
- BR-09: Soft-deleted users cannot authenticate; retention/anonymization jobs follow the configured policy.
- BR-10: Analytics distinguish predictions from clinician-confirmed diagnoses.
- BR-11: A user's role never overrides ownership, patient consent, grant scope, or grant expiry.
- BR-12: Doctor access is denied immediately after grant expiry or revocation; prior signed notes and audit evidence remain intact.
- BR-13: Required legal and informed-use consent must reference an active immutable document version.
- BR-14: Withdrawal of optional consent affects future processing and does not falsify lawfully retained historical records.
- BR-15: The platform must not accept unsupported model inputs or silently coerce unknown symptoms into known features.
- BR-16: The platform must identify low-confidence or OOD assessments and must not present them with high-certainty language.
- BR-17: Training is permitted only from immutable datasets with valid provenance, checksum, schema, content, and governance status.
- BR-18: Dataset validation, successful training, evaluation, approval, and activation are distinct lifecycle states.
- BR-19: The individual approval policy for a production model must prevent an unreviewed training result from becoming active.
- BR-20: Model rollback may target only a previously approved, checksum-verified, schema-compatible model.
- BR-21: An LLM may paraphrase only approved structured facts and must not generate probabilities, severity, tests, specialists, emergency decisions, diagnoses, or prescriptions.
- BR-22: A failed LLM request must not fail, alter, or delete a valid ML prediction.
- BR-23: Emergency guidance must remain available when ML inference, the LLM, reporting, chat, or notification services are unavailable.
- BR-24: Prediction probabilities across the full model label set must satisfy the model's probability contract; displayed top-five values need not sum to one and must not be normalized solely for display.
- BR-25: No physical deletion may break the reproducibility of an existing prediction, report, signed note, consent record, model event, or audit record.
- BR-26: A patient archive action hides a prediction from the default view but does not alter or erase the medical-safety audit trail.
- BR-27: Email and push notification content must not disclose sensitive clinical details on a lock screen or subject line.
- BR-28: Report downloads and dataset/model artifacts must use private storage and time-limited authorized access.
- BR-29: Clinical catalogs and emergency rules require source references and an identified reviewer before production activation.
- BR-30: The system must not claim regulatory approval, diagnostic certainty, HIPAA/GDPR compliance, or clinical validation unless the applicable evidence and organizational approvals exist.

## 7. Non-functional requirements

### Security and privacy

- OWASP ASVS-aligned controls, strict CORS allowlist, security headers, CSRF protection for cookie-authenticated refresh/logout actions, parameterized ORM queries, input size limits, and dependency scanning.
- Passwords hashed with Argon2id; secrets stored only in platform environment/secret management.
- TLS in transit and provider-managed encryption at rest.
- Least-privilege database roles and private storage buckets.
- Field-level log redaction; no access tokens, passwords, raw chat prompts, or unnecessary health data in logs.
- Audit authentication, authorization, patient-record access, catalog changes, exports, and model lifecycle actions.
- The architecture supports HIPAA/GDPR-oriented controls, but the product must not claim compliance without organizational, legal, vendor, and operational validation.

### Reliability and performance

- API availability target: 99.9% monthly after production stabilization, excluding planned maintenance.
- p95 read latency under 400 ms and p95 normal write latency under 800 ms, excluding ML/LLM/background work.
- p95 ML inference under 1.5 s on the production instance; prediction response under 3 s when explanation is asynchronous.
- LLM and object-storage calls use bounded timeouts, retry only safe failures with jitter, and circuit breakers.
- Database migrations are forward-tested and include a rollback/roll-forward plan.
- Automated backups and restore drills; target RPO 24 hours and RTO 4 hours for the initial release.

### Accessibility and UX

- WCAG 2.2 AA target: keyboard operation, semantic landmarks, labels, focus visibility, contrast, screen-reader announcements, and non-color-only severity cues.
- Responsive at 320 px and above, with desktop, tablet, and mobile navigation patterns.
- Framer Motion respects `prefers-reduced-motion`.
- Glassmorphism is decorative only; text surfaces preserve contrast and legibility.
- Emergency content is immediate, unambiguous, and never hidden behind animation.

### Maintainability and observability

- Strict TypeScript and fully typed Python; no untyped public function boundaries.
- Feature-based frontend modules and domain-based backend modules.
- Structured JSON logs with request/correlation IDs, metrics, traces, and health endpoints.
- Unit, integration, contract, end-to-end, accessibility, migration, and ML validation tests in CI.
- API versioning under `/api/v1`; generated OpenAPI is the contract source.

### Scalability and capacity

- The initial deployment must support at least 10,000 registered users, 500 concurrent authenticated sessions, and 100,000 retained predictions without architectural redesign.
- Stateless API instances must support horizontal scaling; session continuity must not depend on process memory.
- History and audit collections must use bounded pagination and indexed filters.
- Long-running explanation, report, dataset, notification, and training workloads must execute outside the request process.
- Application instances must use bounded database connection pools compatible with Supabase connection limits.
- Storage and retention monitoring must alert before database or object-storage capacity reaches a critical threshold.

### Data integrity and consistency

- Prediction creation must atomically persist the prediction, ranked results, versions, and outbox event or persist none of them.
- Role changes, model activation, access revocation, and signed-note creation must use transactions and concurrency controls.
- Immutable artifacts and exports must use cryptographic checksums.
- Timestamps must be stored in UTC and rendered in the user's configured IANA timezone.
- Monetary floating-point behavior is not applicable; model probabilities must use documented numeric precision and tolerances.
- Database constraints must enforce uniqueness, valid ranges, foreign-key integrity, and the single-active-model rule.

### Clinical safety and ML quality

- Model evaluation must report macro F1, balanced accuracy, top-1/top-3/top-5 accuracy, log loss, calibration, per-class metrics, subgroup metrics, and latency.
- A candidate must pass pre-approved minimum gates before it is eligible for approval.
- The production result must display the model version, timestamp, limitations, and non-diagnostic disclaimer.
- Emergency rules must have deterministic tests, versioning, source references, reviewer identity, and effective dates.
- Model inputs outside the validated population or feature distribution must produce a visible warning or safe unavailability according to the approved OOD policy.
- Production drift or safety alerts must never automatically promote a retrained model.
- The system must preserve the last verified approved model for rollback.

### Compatibility and portability

- The web application must support the latest two stable major versions of Chrome, Edge, Firefox, and Safari at release time.
- Responsive behavior must support viewport widths from 320 px through large desktop displays.
- The frontend must deploy independently to Vercel and communicate only through documented HTTPS APIs.
- The backend API and worker must run as container-compatible processes on Railway.
- PostgreSQL-specific features may be used where they materially improve integrity, but domain behavior must remain isolated from provider-specific management APIs.
- Environment-specific configuration must be supplied through validated environment variables; source code must not contain environment secrets.

### Usability and localization

- A first-time patient must be able to complete the supported prediction flow without training or clinical vocabulary.
- Medical terms must include plain-language descriptions where approved.
- Destructive or high-risk actions must state their impact and require intentional confirmation.
- Errors must explain recovery steps without exposing sensitive or internal system details.
- User-facing dates, numbers, units, and timezone displays must be locale aware.
- The initial interface language is English; text must be externalized so later localization does not require component rewrites.

### Testability and quality assurance

- Every requirement with user-visible or safety behavior must be traceable to one or more automated or documented acceptance tests.
- Security-critical branches must include negative authorization, replay, expiry, revocation, and rate-limit tests.
- ML inference must include golden-vector tests proving reproducibility for a fixed bundle and input.
- Database migrations must be tested from an empty database and from the current production-like schema.
- Release candidates must pass unit, integration, API contract, end-to-end, accessibility, security, load, backup/restore, and rollback checks proportional to risk.
- Test environments must use synthetic or explicitly approved de-identified data.

## 8. System constraints

### 8.1 Mandated technology constraints

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion, React Router, TanStack Query, Axios, React Hook Form, Zod, and Recharts.
- Backend: FastAPI, Python, Pydantic, SQLAlchemy, Alembic, JWT authentication, and PostgreSQL.
- ML: scikit-learn, XGBoost, Pandas, NumPy, and Joblib for trusted internally produced artifacts.
- AI: an LLM API may be used only for grounded explanations and educational chat. Disease prediction must be performed by the ML model.
- Deployment: frontend on Vercel, API and worker on Railway, and PostgreSQL on Supabase.

### 8.2 Architectural constraints

- The initial backend will be a cleanly partitioned modular monolith, not a distributed microservice system.
- Frontend code will use a feature-based structure; backend code will separate domain, application, infrastructure, and API responsibilities.
- Domain rules must not depend directly on React, FastAPI, SQLAlchemy, Joblib, or vendor SDKs.
- External providers must be accessed through interfaces/adapters so vendors can be replaced without rewriting domain rules.
- API persistence models must not be returned directly to clients; explicit versioned request/response contracts are required.
- The generated OpenAPI contract is the source for frontend API types.
- Background jobs must not execute inside a web request after the response lifecycle.
- Database schema evolution must occur only through reviewed Alembic migrations.

### 8.3 Security and privacy constraints

- The system must not store plaintext passwords, raw refresh tokens, MFA recovery codes, API keys, or provider secrets.
- Production traffic must use HTTPS/TLS.
- Refresh tokens must use secure HttpOnly cookies with rotation and replay detection; access tokens must remain short lived.
- CORS must use an explicit environment-specific allowlist; wildcard production origins are prohibited.
- Private clinical data, reports, datasets, and model artifacts must not be placed in publicly readable buckets.
- Logs and analytics must exclude unnecessary health data and credentials.
- Real patient use is constrained by applicable legal, privacy, security, clinical, contractual, and organizational approvals.

### 8.4 Clinical and regulatory constraints

- MediAI Pro must be presented as decision support and education, not a substitute for a clinician or emergency service.
- The application must not prescribe medication, recommend dosage, confirm a diagnosis, or tell a user to delay urgent care.
- Supported population and disease scope are limited to the validated dataset and approved model card.
- Emergency language and regional contact guidance must be approved for each launch geography.
- Regulatory classification may differ by jurisdiction; production launch is constrained by formal legal/regulatory assessment.
- Compliance readiness features do not by themselves establish HIPAA, GDPR, medical-device, or other certification.

### 8.5 Data and model constraints

- Model quality is bounded by dataset representativeness, label quality, prevalence, missingness, and clinical validity.
- The system cannot infer features a user did not provide and must distinguish unknown from absent.
- A model bundle may be loaded only from trusted internal storage after checksum and compatibility validation.
- Joblib deserialization of user-uploaded content is prohibited.
- Historical predictions must continue to resolve even after catalogs, rules, or active models change.
- Training and promotion require enough compute and memory for the selected dataset within Railway worker limits; larger workloads require an approved infrastructure revision.

### 8.6 Operational constraints

- Vercel, Railway, Supabase, email, storage, monitoring, and LLM outages are external dependencies and require graceful degradation.
- Railway web instances may restart; all durable state must live in PostgreSQL or private object storage.
- LLM quotas and latency must not become dependencies of core prediction completion.
- Database migrations, model changes, and emergency-rule changes require controlled deployment and rollback procedures.
- Production credentials and environments must be separated from development and test.

## 9. Future scope

Future capabilities are not committed MVP requirements. Each requires separate discovery, risk analysis, architecture update, and approval.

### 9.1 Clinical integrations

- Standards-based EHR integration using FHIR/SMART on FHIR.
- Import of clinician-confirmed outcomes for governed model-performance monitoring.
- Electronic referrals and appointment scheduling.
- Laboratory-system integration for patient-authorized result import.
- Medication interaction information from licensed clinical databases, without autonomous prescribing.

### 9.2 Expanded clinical capabilities

- Separately validated pediatric, geriatric, maternal-health, and region-specific models.
- Specialty-specific models for dermatology, respiratory, cardiology, and other approved domains.
- Medical image analysis as a separate regulated workflow with dedicated models and review.
- Wearable/vital-sign ingestion with device-quality validation.
- Clinician-authored care plans and structured follow-up tracking.

### 9.3 User experience

- Multilingual interface and clinically reviewed localized health content.
- Progressive Web App and native mobile applications.
- Voice input and text-to-speech accessibility.
- Caregiver/dependent accounts with consent and guardianship controls.
- Secure telemedicine integration.

### 9.4 AI and ML

- Retrieval-augmented generation over a governed medical knowledge base with source-level citations.
- Federated or privacy-preserving learning where governance and infrastructure permit.
- Human-feedback workflows for explanation quality without using unverified feedback as diagnostic truth.
- Champion/challenger shadow evaluation, subject to explicit promotion controls.
- Advanced drift investigation and model-performance dashboards based on verified outcomes.

### 9.5 Enterprise and operations

- Organization/tenant support with isolated policies and data boundaries.
- SSO through OIDC/SAML and automated enterprise provisioning.
- Regional data residency and multi-region disaster recovery.
- Fine-grained attribute-based access control.
- SIEM integration, external audit export, and enterprise compliance evidence automation.

### 9.6 Explicit future-scope safeguards

- No future AI feature may replace the deterministic prediction source without a revised SRS and clinical/regulatory review.
- No new population or disease category may be enabled solely by changing UI labels; separate dataset/model validation is required.
- No external integration may receive patient data without consent, minimum-necessary filtering, vendor assessment, and auditable authorization.

## 10. Acceptance criteria and traceability

### 10.1 Product acceptance criteria

- AC-01: A patient can register, accept the active consent documents, verify email, authenticate, refresh a session, revoke a session, and reset a forgotten password.
- AC-02: Reusing a rotated refresh token revokes its session family and creates an auditable security event.
- AC-03: A valid assessment returns up to five unique ranked candidates with calibrated probability, confidence, severity, evidence, recommended tests, specialist, emergency state, model version, and timestamp.
- AC-04: Repeating a create request with the same idempotency key and identical payload cannot create a duplicate prediction.
- AC-05: A red-flag input produces approved emergency guidance even if ML inference, the LLM, reporting, chat, or notifications fail.
- AC-06: An unavailable model produces a safe unavailable result and never a fabricated disease candidate.
- AC-07: LLM failure never changes probability, confidence, severity, evidence, tests, specialist, emergency output, or persistence of a valid ML prediction.
- AC-08: A patient can reopen a historical prediction and see the same input, ranked output, clinical mappings, and model/rule versions after catalog or active-model changes.
- AC-09: A doctor without an active in-scope access grant cannot learn whether a specified patient prediction exists; the denied attempt is audited.
- AC-10: Grant revocation prevents new doctor reads immediately while preserving signed notes and audit records.
- AC-11: A signed doctor note cannot be updated or deleted; a correction creates a traceable child revision.
- AC-12: A PDF report is stored privately, requires current authorization, uses a time-limited download, includes required disclaimers/version metadata, and is audited.
- AC-13: Chat refuses diagnosis/prescribing/dosage requests, surfaces emergency language, and never returns unvalidated LLM output as approved clinical fact.
- AC-14: An invalid or ungoverned dataset cannot start a training job.
- AC-15: A candidate failing any mandatory evaluation, calibration, subgroup, safety, artifact, or schema gate cannot be approved or activated.
- AC-16: Model activation is atomic, leaves exactly one active model, records reviewer/actor/reason/version, and supports verified rollback.
- AC-17: Suspending an account prevents authentication and protected API access and revokes active sessions.
- AC-18: All sensitive patient reads, exports, account changes, clinical-catalog changes, and model lifecycle changes create correlation-ID audit events without logging secrets.
- AC-19: Core visitor, patient, doctor, and admin journeys operate at 320 px and larger, by keyboard, with screen-reader labels, visible focus, sufficient contrast, reduced motion, and non-color-only meaning.
- AC-20: Production-like load testing satisfies agreed latency, availability, concurrency, and capacity targets.
- AC-21: Backup restore and model rollback drills successfully recover a production-like environment within the stated objectives.
- AC-22: Privacy export returns only the requester's authorized data; deletion processing follows retention requirements and produces a traceable status.
- AC-23: All public API operations have versioned schemas, authorization rules, documented errors, and passing contract tests.
- AC-24: Real patient data and public clinical claims remain disabled until clinical, legal, security, privacy, and operational release approvals are recorded.

### 10.2 Requirements traceability matrix

| Requirement area | Primary stories | Primary use cases | Verification |
|---|---|---|---|
| FR-01 Landing page | US-VIS-01–04 | UC-01 | UI, accessibility, content, responsive, and SEO review |
| FR-02 Authentication | US-PAT-01, US-SEC-01 | UC-01, UC-02 | Unit, API integration, security, rate-limit, and E2E tests |
| FR-03 Profile/privacy/settings | US-PAT-12 | UC-11 | Authorization, validation, privacy-workflow, and E2E tests |
| FR-04 Disease prediction | US-PAT-02–07, US-SAF-01–02 | UC-03 | Domain, rule, ML golden-vector, contract, failure, and E2E tests |
| FR-05 History/reports | US-PAT-08–09, US-DOC-06 | UC-04 | Ownership, snapshot, background-job, storage, PDF, and E2E tests |
| FR-06 Dashboard | US-PAT-09 | UC-04 | Aggregate-query, chart-accessibility, empty/error, and performance tests |
| FR-07 AI chat | US-PAT-10, US-SAF-01 | UC-05 | Grounding, moderation, refusal, emergency, streaming, quota, and outage tests |
| FR-08 Doctor dashboard | US-DOC-01–07 | UC-06, UC-07 | Grant-scope, expiry, note immutability, audit, PDF, and E2E tests |
| FR-09 Admin dashboard | US-ADM-01–08 | UC-08–10, UC-12 | RBAC, concurrency, validation, lifecycle, rollback, audit, and E2E tests |
| FR-10 Notifications | US-PAT-11, US-ADM-04 | UC-04, UC-06, UC-09, UC-10 | Delivery, retry, privacy-content, preference, and failure tests |
| FR-11 Doctor access grants | US-PAT-11, US-DOC-07 | UC-06, UC-07 | Ownership, invitation, expiry, revocation, scope, denial, and audit tests |
| FR-12 Dataset/model lifecycle | US-ADM-03–07, US-SAF-02 | UC-09, UC-10, UC-12 | Governance, worker state, metric gate, artifact, promotion, and rollback tests |
| FR-13 Audit/operations | US-OPS-01–02, US-SEC-01 | UC-02, UC-07–12 | Log-redaction, immutability, health, telemetry, job, retention, and outage tests |
| FR-14 Export/deletion | US-PAT-12, US-SEC-01 | UC-11 | Step-up, authorization, storage, retention, anonymization, and audit tests |
| NFR security/privacy | US-SEC-01 | UC-01, UC-02, UC-06, UC-11 | ASVS-oriented review, SAST, dependency, secret, penetration, and audit tests |
| NFR performance/reliability | US-OPS-01–02 | UC-03, UC-12 | Load, resilience, failover, backup/restore, and SLO monitoring |
| NFR accessibility/usability | US-PAT-13 | All interactive cases | Automated and manual WCAG 2.2 AA review |
| NFR clinical/ML safety | US-SAF-01–02, US-ADM-05–07 | UC-03, UC-09, UC-10, UC-12 | Dataset, evaluation, calibration, subgroup, OOD, drift, and rollback tests |

## 11. Requirements governance and approval gate

### 11.1 Requirement priorities

- Must: security, consent, prediction, emergency behavior, history reproducibility, doctor authorization, audit, governed model lifecycle, accessibility, and safe failure behavior.
- Should: patient summaries, full AI chat experience, richer analytics, notification preferences, and convenience exports.
- Could: nonessential animation variants and secondary dashboard personalization.
- Will not in MVP: every item listed as out of scope or future scope.

Safety, privacy, authentication, authorization, audit, data integrity, and model-governance requirements cannot be deprioritized to meet a schedule.

### 11.2 Change control

- Every approved change must identify affected requirement IDs, use cases, data contracts, safety risks, tests, migration impact, and documentation.
- Changes to supported population, disease labels, model features, emergency rules, LLM authority, retention, or patient-doctor access require renewed clinical/security/privacy review as applicable.
- Scope additions are not accepted through implementation alone; this SRS or a linked change record must be updated first.
- Deprecated requirements remain traceable to the release in which they applied.

### 11.3 Open decisions required before implementation or release

The following must be resolved during the applicable roadmap gate:

- Approved initial dataset, provenance, license, schema, and quality assessment
- Supported diseases, age range, population, geography, and language
- Quantitative model promotion and subgroup fairness thresholds
- Exact confidence and OOD policy
- Clinical sources and reviewers for severity, tests, specialists, and emergency rules
- LLM provider, model, retention policy, regional processing, and data-processing agreement
- Transactional email, private object storage, monitoring, and background-job mechanism
- Applicable privacy, retention, deletion, regulatory, and breach-notification obligations
- Regional emergency message and contact presentation
- Production SLOs and capacity targets if they differ from this baseline

### 11.4 Approval condition

Approval of this document confirms the functional scope and authorizes the next planning phase only. It does not certify clinical validity, regulatory status, legal compliance, model safety, production security, or readiness for real patient data.

## 12. Design rationale

A modular monolith minimizes infrastructure and transactional complexity for a portfolio-quality first production release while retaining clear domain boundaries. Clean Architecture keeps clinical and business rules independent of frameworks and vendors; SOLID interfaces make persistence, inference, LLM, storage, email, and job providers replaceable and independently testable.

Separating deterministic ML and emergency rules from generative explanations protects reproducibility and clinical review. Immutable snapshots preserve history, explicit grants prevent role-based overreach, append-only notes preserve professional accountability, and gated model activation prevents experimentation from becoming production behavior without evidence and approval.
