# ADR-004: Centralized Access Control and Authorization Boundary

**Status:** Accepted

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

**Rationale:**
* **Security and Authentication (NFR-01):** This directly addresses the ASR requiring the system to check who is trying to access data and whether they are allowed ([ASRs identification.docx](../References/ASRs%20identification.docx); [PRD NFR-01](../PRD.md#nfr-01-basic-access-control)). Role-based authorization is centralized at the Controller boundary. Customer-specific record ownership is enforced by the relevant Business Logic components using the authenticated user ID passed by Middleware. The Repository persists and retrieves account and role data but is not an authorization boundary.

**Trade-offs / Consequences:**
* **Pros:** Centralizes authentication and role-based authorization while keeping customer-specific ownership checks close to the relevant business operations. User account and role persistence remains within the Repository boundary.
* **Cons:** Middleware must pass the authenticated user ID through the relevant Business Logic interfaces, and those operations must consistently enforce customer-specific ownership rules.