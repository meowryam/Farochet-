# Technology Stack References

**Prepared:** 18 November 2026  
**Purpose:** Official documentation supporting ADR-006.  
**Use:** These references describe technology capabilities and setup. They do not override the Raazia PRD, architecture, or accepted ADRs.

## Official documentation

| Technology / topic | Official source | Why it is referenced |
|---|---|---|
| Node.js release schedule | https://github.com/nodejs/Release | Confirms Node.js 26 is in Active LTS as of 18 November 2026; Node 27 is Alpha and is not the project baseline. |
| Node.js v26.13.0 LTS | https://nodejs.org/en/blog/release/v26.13.0 | Official release announcement for the current Node 26 LTS line. |
| Vite getting started | https://vite.dev/guide/ | Official React/Vite scaffolding workflow and Node compatibility guidance. |
| React documentation | https://react.dev/learn | React component and application fundamentals. |
| Express 5 documentation | https://expressjs.com/en/5x/api.html | Backend routing, request handling, and middleware reference. |
| Supabase PostgreSQL + Prisma | https://supabase.com/docs/guides/database/prisma | Current Supabase setup for Prisma, including Session Pooler connection guidance and Prisma configuration. |
| Prisma ORM release status | https://www.prisma.io/docs/orm/release-status | As of 18 November 2026, Prisma ORM 8 is a release candidate; Prisma 7 remains the supported stable line. |
| Prisma ORM 7 setup | https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/introduction | Prisma 7 requires a PostgreSQL driver adapter and ESM configuration. |
| Prisma ORM 7 database connections | https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections | Connection pooling and separate runtime/migration connections where required. |
| Supabase Auth with JavaScript | https://supabase.com/docs/reference/javascript/auth-getuser | Verify the authenticated user on the server rather than trusting decoded client-provided identity data. |
| Supabase Storage | https://supabase.com/docs/guides/storage | Object storage for custom-order reference images; configure a private bucket and authorization. |
| Vitest getting started | https://vitest.dev/guide/ | Test runner setup and Node compatibility. |
| Supertest | https://github.com/ladjs/supertest | HTTP assertions for Express API integration tests. |

## Selection notes

- **Node 26 LTS:** Selected over an Alpha/current development line to reduce runtime instability during the short D4 period.
- **Prisma 7:** Selected over Prisma 8 release candidates because the project values a stable, documented setup. Prisma 7's `@prisma/adapter-pg` adapter and `prisma.config.ts` requirements must be followed.
- **Supabase Session Pooler:** The local Express server is a long-running Node process. Use the Supabase Session Pooler connection (port 5432) for the initial local setup. Revisit only if the runtime/deployment model changes.
- **Supabase Auth:** Identity verification and application role authorization are separate concerns. Supabase Auth verifies identity; Express Middleware looks up the project's `User` role through the Repository.
- **Supabase Storage:** Use a private bucket for reference images. Access is mediated by backend authorization; do not expose service-role credentials in the browser.
- **React + Vite:** The supplied Farochet UI Kit already contains React JSX components and CSS. The kit is a design/component starting point, not a completed frontend or backend.

## Project-source references

The following sources establish project constraints and architecture:

- `PRD.md` — Version 1.4, updated 18 November 2026.
- `architecture.md` — Multi-Tier Layered Architecture, MVC confined to Presentation, nine Business Logic components, centralized Repository and relational persistence.
- `ADR/` — accepted ADR-001 through ADR-006.
- `Guardrails.md` and `AGENTS.md` — implementation boundaries and agent workflow.
- `docs/ui/Farochet_UI_Kit_v1.1/` — supplied UI starter, UI guidelines, screen specifications, component catalogue, and visual references.
- `References/D4_Assignment_Brief.docx`, `References/D4_Essential_Instructions.docx`, and `References/D4_Testing_Instructions_and_Quality_Gates.docx` — D4 workflow and assessment guidance.
