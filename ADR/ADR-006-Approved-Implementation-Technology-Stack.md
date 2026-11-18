# ADR-006: Approved Implementation Technology Stack

**Status:** Accepted as the D4 implementation baseline by the project coordinator on 18 November 2026  
**Decision scope:** Application language, frontend and backend frameworks, database platform, data-access technology, authentication/file-storage services, testing tools, package manager, and initial execution model.  
**Authority note:** This records the implementation baseline selected for the project. It does not claim TA/faculty approval or a separate recorded vote by every group member. Members should raise a concrete blocker before changing this baseline.

## Context

The approved architecture requires one centralized application using a Multi-Tier Layered Architecture: Presentation, Business Logic, and Data Access. MVC is limited to the Presentation Layer. The implementation must preserve exactly nine Business Logic components, one centralized Repository, and one centralized relational database. Centralized Middleware must authenticate requests and enforce the Customer/Raazia role boundary; the relevant Business Logic component remains responsible for customer-specific record ownership.

The D4 brief permits any technology and accepts local execution. It awards no additional marks for choosing a more sophisticated platform and warns that promised functionality that does not work may affect marks. The team has limited prior experience with the proposed technologies and has a short implementation window ending 27 November 2026. The implementation stack must therefore be familiar, cohesive, easy to run from a clone, and compatible with the existing Farochet React UI starter.

The product also needs persistent relational records, account authentication, and submitted custom-order reference images. The existing PRD excludes online payment processing and courier integrations; this decision does not add either integration.

## Alternatives considered

1. **Supabase-only frontend/data access:** React could query Supabase tables directly and rely on generated APIs/RLS. This reduces backend code, but it would bypass or weaken the approved Express-style Controller/Middleware, Business Logic, and centralized Repository boundaries. Rejected as the main application architecture.
2. **Firebase/Firestore or MongoDB:** These provide managed data services but are document-oriented and do not align as directly with the approved normalized relational data model, foreign-key relationships, and lifecycle separation. Rejected.
3. **Custom authentication and password storage:** Implementing password hashing, sessions, reset flows, and token handling inside the application creates avoidable security and maintenance work for an inexperienced team. Rejected in favour of a managed identity provider with application authorization still enforced by the approved middleware.
4. **Microservices:** Separate services for products, inquiries, orders, and users would add deployment, networking, and data-consistency overhead and contradict the selected monolithic layered architecture. Rejected.
5. **React + Vite, Express, Supabase PostgreSQL, and Prisma:** This keeps one JavaScript language across frontend and backend, uses the supplied React UI starter, provides a managed PostgreSQL database and identity/storage services, and preserves the three-layer application architecture. Selected.

## Decision

The project will use the following implementation stack:

| Concern | Approved choice | Use in this project |
|---|---|---|
| Runtime | **Node.js 26 LTS** | One JavaScript runtime for development and the backend. Use the Node 26 LTS line, not the Node 27 Alpha line. |
| Package manager | **npm** | Install dependencies and commit each application's `package-lock.json`. |
| Frontend | **React + Vite + JavaScript/JSX** | Customer storefront and Raazia Admin UI. Use the supplied Farochet UI Kit and its CSS; avoid adding another UI framework unless separately approved. |
| Frontend routing | **React Router** | Client-side navigation and route-level presentation guards. These guards are usability features, not authorization controls. |
| Backend | **Node.js + Express 5** | One backend application exposing REST endpoints. Controllers and Middleware live in the Presentation Layer; nine business modules remain in the Business Logic Layer. |
| Validation | **Zod** | Validate request payload shape at the request boundary. Business-rule validation remains in the owning Business Logic component. |
| Database | **Supabase-hosted PostgreSQL** | One centralized relational database for application business records. PostgreSQL is the database engine; Supabase is the managed platform. |
| ORM / migrations | **Prisma ORM 7 stable + `@prisma/adapter-pg` + `pg`** | The centralized Repository uses Prisma for relational persistence and versioned migrations. Use Prisma 7, not the Prisma 8 release-candidate line. |
| Authentication | **Supabase Auth** | Handles customer sign-up/sign-in and identity tokens. Express Middleware validates the bearer token and retrieves the application's persisted role through the Repository. |
| File storage | **Supabase Storage** | One private bucket for custom-order reference images. Store object paths/metadata in PostgreSQL, not image binaries. Access and upload are mediated by the backend. |
| Backend testing | **Vitest + Supertest** | Business Logic unit tests and REST API integration tests. Add UI test packages only when a slice demonstrates a concrete need. |
| Styling | **Farochet UI Kit CSS** | Reuse the supplied tokens, components, layouts, and screen guidance. Do not introduce Tailwind, shadcn/ui, Bootstrap, or another component framework by default. |
| Initial execution/deployment | **Local frontend and backend; Supabase-hosted data/auth/storage** | Run the web client and Express server locally. Do not promise a separate production hosting deployment for D4. |

## Architecture mapping

The stack implements the already-approved architecture; it does not replace it.

```text
React Views (Vite)
      |
      v
Express Routes / Controllers / Central Middleware
      |
      v
Nine Business Logic Components
      |
      v
One Centralized Repository (Prisma 7)
      |
      v
One Supabase PostgreSQL Database
```

Supabase Auth is the identity provider. The frontend may call Supabase Auth for sign-up/sign-in and session handling only. For business data, the frontend calls the Express REST API. Every protected API request passes through Express Middleware, which validates the Supabase access token, retrieves the application's User record and role through the Repository, and enforces the Raazia/Customer role boundary. Business Logic enforces record ownership using the authenticated user ID. Do not access application business tables directly from React or from Supabase's generated Data API.

Supabase Storage is used only for the PRD-required custom-order reference images. The bucket must be private. The backend verifies the authenticated user and relevant ownership/role before upload or retrieval. Do not place service-role/secret keys in browser code. Database connection strings and service credentials remain server-side.

## Binding implementation rules

1. **One application, not microservices.** Use one Vite frontend and one Express backend. The nine Business Logic components are modules inside that backend; they are not separately deployed services.
2. **Preserve the layers.** Views call Controllers; Controllers delegate to Business Logic; Business Logic uses the centralized Repository; the Repository uses Prisma/PostgreSQL. No direct database calls from Views, ordinary Controllers, or Business Logic.
3. **Narrow Middleware exception.** Central Middleware may use the Repository only for the persisted User account/role lookup required by ADR-004. The token itself is verified through Supabase Auth.
4. **Role values.** Persist only the two approved application roles: `RAAZIA` and `CUSTOMER`. Display labels may be “Raazia” and “Customer”. Customer registration MUST assign `CUSTOMER` server-side; a client cannot submit or elevate itself to `RAAZIA`. Provision the Raazia account through a controlled setup procedure.
5. **Authentication versus authorization.** Supabase Auth proves identity. Express Middleware enforces role authorization. Business Logic enforces customer-specific record ownership. React route guards are not security boundaries.
6. **Prisma is centralized.** Instantiate one Prisma Client for the long-running backend and expose database operations through the centralized Repository. Do not import Prisma Client into individual Business Logic modules or Controllers.
7. **Prisma version and adapter.** Use the stable Prisma 7 package family (`prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`, and `pg`). Prisma 7 requires a PostgreSQL driver adapter and ESM configuration. Configure the Prisma CLI connection in `prisma.config.ts`; do not copy Prisma 6 setup snippets blindly. Do not use Prisma 8 release candidates for this deadline-driven project.
8. **Supabase PostgreSQL connection.** For the locally running, long-lived Express server, use the Supabase Session Pooler connection (port 5432) in server-side `DATABASE_URL`, following the current Supabase Prisma guide. Keep credentials in `backend/.env`. If connection mode changes later, update the configuration and ADR before migrating.
9. **Supabase Data API.** The application uses Prisma as its only business-table access path. Do not call `supabase.from(...)` from the frontend. The team may disable the Supabase Data API in project settings if it is not needed by any approved use case; do not disable Auth or Storage APIs.
10. **Storage.** Use a private Supabase Storage bucket for reference images. Keep object paths and applicable metadata in relational records. Backend routes must authorize each upload/read operation. Do not add Cloudinary, Firebase Storage, or another provider.
11. **No extra frontend framework.** Use the existing Farochet UI Kit and CSS. Use React Router and browser `fetch` unless an approved requirement justifies another client library. Do not add Redux or a second design system by default.
12. **No unapproved integrations.** No online payment gateway, courier API, external calendar, AI design generation, or automatic feasibility/acceptance service.
13. **Dependency discipline.** Do not install an additional framework, provider SDK, ORM, or major dependency without documenting why it is needed and obtaining project-lead approval. Keep lockfiles committed and use `npm ci` for clean installs.
14. **No production deployment commitment.** The D4 acceptance baseline is a local React/Vite client and local Express server connected to the selected Supabase project. A separate public website/API deployment is optional and must not delay core functionality.

## Consequences

**Benefits:** One language across the application reduces context switching for the team; React fits the existing UI Kit; Express makes the approved middleware/controller boundary explicit; PostgreSQL fits relational records; Prisma centralizes database access and migrations; Supabase reduces operational setup for PostgreSQL, identity, and image storage; local execution keeps deployment effort bounded.

**Costs and risks:** The team must learn the React/Express boundary, Prisma 7's adapter/config setup, and Supabase token/role integration. Supabase requires an internet connection during development and introduces a managed-platform dependency. JavaScript provides less static type checking than TypeScript. Prisma-generated data models must not become a substitute for the approved logical architecture. The private Storage bucket and server credentials require careful setup.

## Validation before implementation is considered ready

- A clean clone can install frontend/backend dependencies using `npm ci`.
- Frontend starts locally and can call the local Express health endpoint.
- Express starts locally and connects to the Supabase PostgreSQL project through the configured Session Pooler.
- A Prisma migration can be applied in the development database and the generated client can be used by the Repository.
- A Customer can sign up/sign in through Supabase Auth; an authenticated API request is verified by Middleware and is assigned the `CUSTOMER` application role.
- The Raazia account is provisioned with the `RAAZIA` application role through a controlled, non-public path.
- A Customer cannot invoke Raazia-only endpoints or read another Customer's records.
- A custom-order reference image can be uploaded to and retrieved from the private bucket through authorized backend routes.
- No secret or service-role credential is present in frontend source, committed files, or Git history.

## References

See [`References/Technology_Stack_References.md`](../References/Technology_Stack_References.md) for official documentation consulted for this decision. The architecture and product rules remain governed by the PRD and ADR-001 through ADR-005; this ADR chooses implementation technologies only.
