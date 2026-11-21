# ADR-004: Centralized Access Control and Authorization Boundary

**Status:** Accepted; amended by unanimous four-member approval to add the narrowly scoped Auth Profile Provisioning boundary and the backend-controlled Customer registration-intent flow.

**Context:** 
Raazia’s system serves two distinct user roles: Raazia (the business administrator) and her Customers. The Architecture Significant Requirements derived from NFR-01 identify the need to check who is accessing records and whether that person is allowed to view or modify them ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD NFR-01](../PRD.md#nfr-01-basic-access-control)). This creates a critical architectural concern regarding security and authentication, as every module must be protected from unauthorized access. The system needs a mechanism to ensure customers can access only their own records and only Raazia can perform administrative actions such as updating a payment status or altering a standard catalogue price.

**Alternatives Considered:**
1. **Decentralized Authorization (Checks inside every Domain Service):** Writing custom `if (user.role == 'Raazia')` logic inside every single function in the Business Logic layer. 
   * *Trade-offs:* Highly error-prone and violates the DRY (Don't Repeat Yourself) principle. If a developer forgets to add the check to a new module, a severe security vulnerability is introduced.
2. **Centralized Controller Middleware (Gatekeeper Pattern):** Implementing an authentication and authorization middleware layer at the very edge of the Presentation/Controller tier that intercepts all incoming requests before they ever reach the Business Logic layer.

**Decision:**
We will implement a **Centralized Controller Middleware** for all authentication and access control. 
* All inbound requests will pass through a central security interceptor.
* The Repository will persist and retrieve account and role information represented by the shared `User` entity; no separate User Management Business Logic component is introduced.
* The middleware will authenticate the request, use the stored account and role information to identify the user and role (Customer vs. Raazia), and centrally enforce role-based authorization.
* If a customer attempts to access an operation reserved for Raazia (e.g., updating a standard catalogue price), the middleware will reject the request.
* The middleware will pass the authenticated user's ID to the relevant Business Logic operations. Those components will enforce customer-specific record ownership within their operations; the Repository remains responsible for persistence and is not a separate authorization boundary.

**Approved amendment — Backend-controlled Customer registration and profile provisioning:**
* Authentication identity and application profile/role are separate. Supabase Auth verifies credentials and access tokens; the persisted `User` profile supplies the application role for protected application operations.
* `POST /api/auth/register` is the Customer signup entry point. The backend checks the Supabase Auth signup settings and creates a new identity through the Supabase Auth Admin API. The service-role credential remains backend-only and is used only for Auth Admin operations. Supabase's provider response supplies the new identity ID and canonical email; a duplicate identity produces the same generic response as a successful request and creates no registration intent.
* After a genuinely new identity is created, the Controller records a `CustomerRegistrationIntent` through the centralized Repository. The intent binds the provider-returned user ID and email to the validated display name. No application `User` profile is created at signup. Email confirmation follows the project's Supabase Auth setting.
* `POST /api/auth/registration/activate` and `POST /api/auth/profile` pass through identity-verification Middleware. Middleware verifies the bearer token with Supabase Auth and attaches the verified user ID, email, and email-confirmation timestamp. It does not use the Repository on these identity-verification steps.
* Activation requires Supabase-confirmed email and changes a matching `PENDING` intent to `ACTIVE` once. The 30-minute completion window starts at the backend's first verified request for the email-confirmed identity; a retry does not extend the expiry.
* `POST /api/auth/profile` accepts no identity, email, role, or display name from the client. The Controller calls one atomic Repository operation that conditionally consumes the matching, unexpired intent and creates the `User` profile in the same database transaction. The Repository assigns `CUSTOMER`. Existing profiles and roles are returned unchanged; email mismatches, missing intents, expired intents, and replays are rejected.
* `GET /api/auth/me`, normal sign-in, and session restoration remain read-only with respect to profile provisioning. Protected application routes still require the persisted profile and role. Middleware's Repository exception remains limited to account/role lookup.
* The unanimous amendment authorizes only the described registration Controller operations and the corresponding Repository persistence operations. It does not permit general Controller-to-Repository access and does not add, merge, or rename any of the nine Business Logic components.

**Rationale:**
* **Security and Authentication (NFR-01):** This directly addresses the ASR requiring the system to check who is trying to access data and whether they are allowed ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD NFR-01](../PRD.md#nfr-01-basic-access-control)). Role-based authorization is centralized at the Controller boundary. Customer-specific record ownership is enforced by the relevant Business Logic components using the authenticated user ID passed by Middleware. The Repository persists and retrieves account and role data but is not an authorization boundary.
* **Registration-intent boundary:** Only an identity created by the backend-controlled Supabase Auth Admin signup flow receives a pending intent. Later profile completion requires a verified, email-confirmed identity matching that intent. Atomic one-time consumption, fixed `CUSTOMER` assignment, and no-overwrite behavior prevent an existing identity—including a RAAZIA identity—from being converted through registration continuation.

**Trade-offs / Consequences:**
* **Pros:** Centralizes authentication and role-based authorization while keeping customer-specific ownership checks close to the relevant business operations. User account, role, and one-time registration-intent persistence remains behind the centralized Repository. No service-role credential is exposed to the browser or used for application-table access.
* **Cons:** The backend must use its server-only Supabase Auth Admin credential for new-user creation and maintain the short-lived intent state. Migration grants/RLS and the Controller/Repository exception must remain limited to these approved operations; no general Presentation-to-Repository access is introduced.