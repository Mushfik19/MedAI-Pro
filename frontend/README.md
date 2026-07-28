# MediAI Pro Frontend

Production frontend foundation for MediAI Pro, built with React 19, strict TypeScript, Vite, Tailwind CSS 4, Shadcn-compatible Radix primitives, React Router, TanStack Query, Axios, React Hook Form, and Zod.

Feature pages are intentionally not part of this phase. The current router provides real system-level terminal states and accepts feature route objects through `createAppRouter`.

## Requirements

- Node.js compatible with Vite 8
- npm with workspace support

Run commands from the repository root:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run check
```

## Architecture

- `src/app`: composition root, providers, typed configuration, router
- `src/components/ui`: Shadcn-compatible primitives
- `src/components/layout`: public, auth, and protected application shells
- `src/components/forms`: typed React Hook Form controls
- `src/components/feedback`: reusable loading, empty, and error states
- `src/lib/api`: Axios factory, Problem Details, token coordination, contracts
- `src/state`: authentication, theme/motion, and TanStack Query setup
- `src/routes`: protected-route policy and system routes
- `tests`: foundation unit and component tests

## Environment

Copy the names from `.env.example` into the appropriate local or platform environment. Do not commit real secrets. Every `VITE_` value is public to the browser and must never contain database, JWT-signing, LLM, email, or storage credentials.

Vite development uses `http://localhost:8000/api/v1`, so browser requests go directly to the
local FastAPI service. The Vite proxy still supports `/api/v1` as a same-origin fallback.
Production must provide the approved Railway API origin or an edge proxy path.

## Quality commands

```powershell
npm.cmd run lint --workspace @mediai-pro/frontend
npm.cmd run typecheck --workspace @mediai-pro/frontend
npm.cmd run test --workspace @mediai-pro/frontend
npm.cmd run build --workspace @mediai-pro/frontend
```
