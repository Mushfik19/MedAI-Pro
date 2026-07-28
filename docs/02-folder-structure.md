# 2. Folder Structure

## 2.1 Proposed repository

```text
mediai-pro/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       ├── security.yml
│       └── deploy.yml
├── docs/
│   ├── README.md
│   ├── 01-software-requirement-specification.md
│   ├── 02-folder-structure.md
│   ├── 03-database-design.md
│   ├── 04-er-diagram.md
│   ├── 05-api-documentation.md
│   ├── 06-component-tree.md
│   ├── 07-ml-pipeline.md
│   └── 08-development-roadmap.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── providers.tsx
│   │   │   ├── router.tsx
│   │   │   └── query-client.ts
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── feedback/
│   │   │   └── charts/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── predictions/
│   │   │   ├── history/
│   │   │   ├── chat/
│   │   │   ├── doctor/
│   │   │   ├── admin/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── errors/
│   │   │   ├── formatters/
│   │   │   └── validation/
│   │   ├── routes/
│   │   ├── styles/
│   │   ├── test/
│   │   ├── types/
│   │   └── vite-env.d.ts
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/
│   │   │   ├── error_handlers.py
│   │   │   ├── middleware.py
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── logging.py
│   │   │   ├── observability.py
│   │   │   └── security.py
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── clinical_catalog/
│   │   │   ├── predictions/
│   │   │   ├── reports/
│   │   │   ├── chat/
│   │   │   ├── doctor/
│   │   │   ├── admin/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   └── ml/
│   │   ├── shared/
│   │   │   ├── domain/
│   │   │   ├── exceptions/
│   │   │   ├── pagination/
│   │   │   ├── storage/
│   │   │   └── types/
│   │   ├── workers/
│   │   └── main.py
│   ├── ml/
│   │   ├── training/
│   │   ├── evaluation/
│   │   ├── inference/
│   │   └── schemas/
│   ├── scripts/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── contract/
│   │   └── fixtures/
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
├── contracts/
│   ├── openapi.json
│   └── generated/
├── infra/
│   ├── railway/
│   ├── vercel/
│   └── supabase/
├── .editorconfig
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

## 2.2 Feature module conventions

Each frontend feature owns its API hooks, components, schemas, pages, and feature-specific types:

```text
features/predictions/
├── api/
│   ├── prediction.keys.ts
│   ├── prediction.queries.ts
│   └── prediction.service.ts
├── components/
├── pages/
├── schemas/
├── types/
└── index.ts
```

Each backend domain module follows dependency inversion:

```text
modules/predictions/
├── api/
│   ├── router.py
│   └── schemas.py
├── application/
│   ├── commands.py
│   ├── queries.py
│   └── services.py
├── domain/
│   ├── entities.py
│   ├── enums.py
│   ├── repositories.py
│   └── rules.py
└── infrastructure/
    ├── models.py
    ├── repository.py
    └── inference_adapter.py
```

The domain layer contains business rules and repository protocols, the application layer orchestrates use cases, infrastructure implements persistence/external services, and API routes translate HTTP to application commands. Domain code does not import FastAPI, SQLAlchemy, or vendor SDKs.

## 2.3 Dependency rules

- Frontend pages compose feature components; shared UI never imports a feature.
- Features communicate through public exports or server state, not deep cross-feature imports.
- Axios is configured once; TanStack Query owns remote server state; local UI state stays local.
- React Hook Form and Zod share validation schemas at feature boundaries.
- Backend API imports application services; application imports domain contracts; infrastructure depends inward on domain interfaces.
- SQLAlchemy models do not leak into API responses; Pydantic DTOs define external contracts.
- ML inference loads an immutable model bundle through an adapter; routes never call Joblib directly.
- Generated OpenAPI TypeScript types prevent frontend/backend drift.

## 2.4 Migration from the current starter

The current root is a React JavaScript starter. After approval:

1. Preserve Git history and documentation.
2. Move the frontend into `frontend/` and convert JSX/configuration to strict TypeScript.
3. Replace the starter screen and assets only when the production shell is ready.
4. Add `backend/`, `contracts/`, and CI independently.
5. Keep each migration step buildable so review remains straightforward.

## 2.5 Design rationale

Feature ownership reduces accidental coupling and lets patient, doctor, admin, and ML workflows evolve independently. The backend layout applies clean architecture without splitting prematurely into networked microservices. A repository-level contract directory makes OpenAPI drift testable in CI.
