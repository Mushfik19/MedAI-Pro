# MediAI Pro — Architecture Pack

Status: **Proposed — awaiting approval**  
Version: 1.0  
Date: 2026-07-26

This directory is the pre-implementation design baseline for **MediAI Pro — Intelligent Disease Prediction & Clinical Decision Support System**. No application implementation should begin until this pack is approved.

## Deliverables

1. [Software Requirement Specification](./01-software-requirement-specification.md)
2. [Folder Structure](./02-folder-structure.md)
3. [Database Design](./03-database-design.md)
4. [ER Diagram](./04-er-diagram.md)
5. [API Documentation](./05-api-documentation.md)
6. [Component Tree](./06-component-tree.md)
7. [ML Pipeline](./07-ml-pipeline.md)
8. [Development Roadmap](./08-development-roadmap.md)

## Architecture decisions requiring approval

- The product is clinical decision support, not an autonomous diagnostic or prescribing system.
- A modular monolith is used initially: React SPA, FastAPI API, PostgreSQL, and a separate worker process from the same backend codebase. This keeps operations simple while preserving clean module boundaries.
- Prediction is deterministic and versioned through a scikit-learn/XGBoost model. The LLM is restricted to grounded explanations and chat; it never calculates disease probabilities.
- Long-running dataset validation, training, report generation, and exports execute as background jobs.
- Role-based access control uses `PATIENT`, `DOCTOR`, and `ADMIN`; sensitive access is audit logged.
- Production tokens use short-lived access JWTs and rotating refresh tokens stored in Secure, HttpOnly cookies. Refresh-token hashes, not raw tokens, are persisted.
- Dataset uploads and generated reports use private object storage; PostgreSQL stores metadata and object keys.
- Disease and symptom knowledge is versioned so historical predictions remain reproducible.

## Approval gate

Approval authorizes Phase 0/1 implementation in the roadmap. It does not authorize production deployment, model promotion, or use with real patient data; those remain separate release gates.
