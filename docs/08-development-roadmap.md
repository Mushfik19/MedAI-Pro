# 8. Development Roadmap

Development proceeds through explicit quality gates. Estimates are relative engineering stages, not calendar promises; scope, dataset readiness, clinical review, and deployment access determine elapsed time.

## Phase 0 — Approval and risk closure

Deliverables:

- Approve this architecture pack and clinical decision-support scope.
- Select initial dataset and document provenance, license, intended population, label set, and known limitations.
- Define the first supported age range, geography, language, and emergency messaging jurisdiction.
- Choose LLM provider/model and confirm data-processing terms.
- Confirm Vercel, Railway, Supabase, private object storage, email, and monitoring accounts.
- Establish design tokens, product copy, legal documents, and safety disclaimer ownership.

Exit gate:

- No unresolved product decision can materially change schema, prediction inputs, access policy, or deployment architecture.
- Dataset is legally usable and technically suitable for evaluation.

## Phase 1 — Engineering foundation

Deliverables:

- Restructure the starter into the approved monorepo and migrate the frontend to strict TypeScript.
- Configure React 19, Vite, Tailwind CSS, Shadcn UI, React Router, TanStack Query, Axios, React Hook Form, Zod, Framer Motion, and Recharts.
- Bootstrap FastAPI, Pydantic, SQLAlchemy 2.x, Alembic, PostgreSQL settings, structured logging, exception handling, health checks, and OpenAPI.
- Add local environment templates, Docker backend, linting, formatting, type checking, test runners, pre-commit hooks, and CI.
- Establish generated TypeScript types from OpenAPI and contract drift checks.

Exit gate:

- Frontend and backend build, lint, type-check, and test in CI.
- A migration upgrades an empty PostgreSQL database and health/readiness checks pass.
- No secrets are committed.

## Phase 2 — Design system and application shell

Deliverables:

- Medical blue/cyan design tokens, typography, spacing, elevation, semantic severity colors, dark mode, and reduced-motion policy.
- Shadcn-based accessible primitives and reusable layout/feedback/data components.
- Public, auth, patient, doctor, and admin shells with responsive navigation.
- Landing page, product safety page, privacy/terms surfaces, route error handling, and loading/empty states.
- Visual-regression and accessibility baselines.

Exit gate:

- Keyboard-only workflows, focus management, contrast, screen-reader semantics, and 320 px responsive layout pass agreed checks.
- Glass effects never reduce content contrast.

## Phase 3 — Identity, authorization, and privacy

Deliverables:

- User/profile/settings/consent/session migrations and repositories.
- Registration, email verification, login, refresh rotation/replay defense, logout, password reset, MFA for privileged roles, and session management.
- JWT verification, CSRF defense, rate limiting, permission dependencies, audit middleware, and security headers.
- Profile/settings pages and privacy export/deletion request workflows.
- Patient-doctor access grants and authorization tests.

Exit gate:

- Cross-role and cross-patient access tests prove deny-by-default behavior.
- Token replay, password reset, suspension, session revocation, and consent-version cases pass integration tests.

## Phase 4 — Clinical catalog and ML baseline

Deliverables:

- Symptoms, diseases, lab tests, specialties, mappings, and emergency-rule schema/API.
- Admin catalog UI with optimistic version conflicts and audit results.
- Dataset contract, validation pipeline, training worker, baseline logistic model, XGBoost candidate, evaluation/calibration pipeline, registry, and immutable bundle.
- Synthetic/non-sensitive seed catalog for development and deterministic test vectors.
- Admin dataset upload, validation reports, training jobs, model comparison, approval, activation, and rollback.

Exit gate:

- Candidate meets approved macro, top-k, calibration, subgroup, latency, and safety thresholds.
- Artifact checksum, schema mismatch, failed promotion, and rollback tests pass.
- Clinical reviewer approves catalog mappings and emergency rules.

## Phase 5 — Prediction vertical slice

Deliverables:

- Active input-schema endpoint, symptom search, accessible multi-step assessment, review, and informed-use acknowledgement.
- Emergency pre/post checks, inference adapter, calibrated top five, confidence policy, enrichment, persistence, idempotency, and immutable history.
- Prediction result UI with probability, severity, evidence, tests, specialist, model transparency, safety notices, and emergency presentation.
- LLM explanation job with structured grounding, schema validation, safe fallback, quota, and provenance.

Exit gate:

- End-to-end patient flow works on mobile and desktop.
- LLM outage leaves prediction and emergency behavior correct.
- Golden predictions are reproducible after process restart and catalog updates.

## Phase 6 — Patient dashboard, reports, and chat

Deliverables:

- History filters/detail/archive, recent activity, statistic cards, frequency/trend charts, and weekly/monthly server-side summaries.
- Background PDF generation, checksum, private object storage, short-lived download, and report audit.
- Grounded conversation management, SSE streaming, safety/refusal policy, crisis/escalation detection, quotas, and deletion.
- Accessible chart tables and report rendering.

Exit gate:

- Aggregate queries meet latency targets with realistic volumes.
- PDF and chat authorization tests prevent cross-user access.
- Stored chat metadata proves grounding and safety version without retaining hidden reasoning.

## Phase 7 — Doctor experience

Deliverables:

- Doctor dashboard, access-limited patient list, longitudinal prediction timeline, review queue, and red-flag prioritization.
- Signed append-only notes, revision workflow, review disposition, and clinician PDF.
- Access-expiry/revocation behavior and sensitive-read auditing.

Exit gate:

- A doctor sees only actively granted records.
- Signed-note immutability and correction history pass API/database tests.
- Doctor workflows pass clinical usability review.

## Phase 8 — Admin analytics and operational hardening

Deliverables:

- Privacy-aware usage, prediction, dataset, model, and system analytics.
- Audit explorer, security-event summaries, retention jobs, idempotency cleanup, and outbox retry/dead-letter handling.
- Database indexes verified with query plans, rate-limit tuning, caching, pagination, load tests, and failure injection.
- Dependency/container scanning, SAST, secret scanning, backup/restore drill, incident runbooks, and model rollback drill.

Exit gate:

- Performance SLOs are met on production-like infrastructure.
- No open critical/high security finding without documented risk acceptance.
- Recovery and rollback procedures are tested, not merely documented.

## Phase 9 — Deployment and release

Deliverables:

- Vercel frontend with environment-specific API origin, CSP, preview deployments, and SPA rewrite.
- Railway API and worker services with health checks, startup model verification, controlled migrations, and resource limits.
- Supabase PostgreSQL with least-privilege credentials, connection pooling, backups, and network/TLS configuration.
- Private artifact/report storage and signed URL policy.
- Production monitoring, alerting, dashboards, domain/TLS, transactional email, and release checklist.
- Staged deployment: internal → synthetic-data pilot → approved limited release.

Exit gate:

- Smoke, E2E, accessibility, security, migration, inference, and rollback tests pass against production configuration.
- Legal/clinical/security owners approve the release.
- Real patient data is enabled only after the required organizational compliance review.

## Phase 10 — Post-release monitoring

Deliverables:

- Monitor errors, latency, OOD, class distribution, explanation failures, access anomalies, and user feedback.
- Review calibration/performance only with validated outcome data.
- Triage drift and safety events through a documented incident process.
- Prioritize future FHIR integration, multilingual support, additional validated populations, and mobile/PWA capability based on evidence.

Exit gate:

- Recurring operational, clinical-safety, privacy, and model-review cadence is owned and scheduled.

## Testing matrix

| Layer | Required coverage |
|---|---|
| Frontend unit | Formatters, Zod schemas, hooks, permission rendering, clinical UI states |
| Frontend integration | Forms, query errors, streaming, route guards, responsive tables |
| Backend unit | Domain rules, confidence policy, permission rules, state machines |
| Backend integration | PostgreSQL repositories, transactions, migrations, auth rotation, outbox |
| API contract | OpenAPI generation, generated client compatibility, problem details |
| ML | Data validation, leakage checks, metrics, calibration, golden vectors, artifacts |
| End-to-end | Patient, doctor, admin, emergency, LLM failure, model rollback |
| Non-functional | WCAG, load, security, backup restore, observability, failure injection |

Coverage percentages are secondary to risk-based cases. Authentication, authorization, emergency rules, prediction reproducibility, signed notes, and model promotion require branch and failure-path tests.

## Definition of done

A feature is complete only when:

- Typed production implementation and database migration are reviewed.
- Authorization, validation, error, loading, empty, and responsive states are implemented.
- OpenAPI and frontend contract types are current.
- Unit/integration/E2E tests proportional to risk pass.
- Accessibility and observability are included.
- Security/privacy logging is verified.
- User-facing safety copy is reviewed where clinical behavior is involved.
- Documentation and deployment configuration are updated.

## Delivery rationale

The roadmap builds a secure vertical foundation before adding breadth. Identity and catalog/model governance precede prediction; prediction precedes charts and chat; doctor/admin workflows build on audited access. Each phase ends with evidence-based gates, preventing visually complete features from outrunning security or model safety.
