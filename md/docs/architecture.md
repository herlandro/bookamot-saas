# Architecture Overview

Purpose
- Provide a concise, project-agnostic overview that orients any newcomer quickly and links to the canonical docs. Keep this file to 1–2 pages. Do not duplicate detailed content; link to the sources below.

How to use this template
- Replace placeholders like [NOME_DO_PROJETO] and add your specific project details. Keep sections short and assertive.

1) Project Summary
- Product: [NOME_DO_PROJETO] — one-sentence business goal and core user value.
- Scope: primary capabilities, target users, and boundaries (what this system does and does not do).
- Drivers: top design drivers (e.g., time-to-market, cost, compliance, performance).

2) System Overview
- Architecture: Next.js + Supabase serverless stack for rapid development and scalability.
- Tech Stack: see docs/tech-stack.md for authoritative technology choices and rationale.
- Trust boundaries and data sensitivity: PII protection, auth tokens, secrets management.
- External integrations: AI services, payment providers, analytics (detailed in tech-stack.md).

3) Core Components
- Web App (Next.js): UI composition, routing, client-side data fetching, and UX concerns.
- API Layer (Next API routes or direct Supabase client): thin orchestration, input validation, rate limits.
- Database (Supabase Postgres): source of truth, RLS-enforced access.
- Edge Functions (optional): low-latency server logic or secure operations.
- Realtime/Subscriptions (optional): live updates via Supabase Realtime.

4) Application Flows
- Authentication: Sign-in/up with Supabase Auth; session propagation to frontend/server.
- AI interaction (optional): prompt → model call → guardrails → persistence/telemetry.
- Telemetry/analytics (optional): capture events, dashboards, reporting.
- Reference: docs/app-flows/ contains detailed flow diagrams. See docs/app-flows.md for documentation guidelines.

5) Data & Security
- Database schema: see docs/database-schema.md for entities, relationships, and migrations.
- Access model: RLS-first approach with least privilege, input validation, and controlled data fetching.
- Security: RLS enabled by default, secrets in env vars, audit trails, rate limiting on sensitive endpoints.
- Supabase guidelines: docs/supabase-best-practices.md, docs/supabase-auth-guidelines.md, docs/supabase-realtime-usage.md, rules/supabase.md

6) Quality & Performance
- Performance: fast TTFB, strategic caching, N+1 query prevention, real-user metrics monitoring.
- Reliability: graceful degradation, retry mechanisms with backoff for external calls.
- Observability: comprehensive logging/metrics/traces for API/Edge Functions, UI error reporting.
- Cost optimization: serverless/edge preference to reduce idle costs, DB/storage usage monitoring.

7) Key Architectural Decisions
- Next.js + Supabase: Chosen for serverless scalability and rapid development integration.
- RLS-first security model: Granular access control at the database level.
- Caching strategy: ISR for static content, in-memory cache for dynamic data.
- Rate limiting: Upstash implementation for sensitive API endpoints.

8) Documentation References
- Tech stack: docs/tech-stack.md
- Application flows: docs/app-flows/ (Mermaid diagrams), docs/app-flows.md (guidelines)
- Database schema: docs/database-schema.md
- API documentation: docs/apis.md
- Design guidelines: docs/design-guidelines.md
- Testing workflow: docs/ttd-flow.md
- Configuration: docs/variables-configuration.md