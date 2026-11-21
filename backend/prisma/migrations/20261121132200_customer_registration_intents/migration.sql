BEGIN;

CREATE TYPE public."CustomerRegistrationIntentStatus" AS ENUM (
  'PENDING',
  'ACTIVE',
  'CONSUMED'
);

CREATE TABLE public."CustomerRegistrationIntent" (
  "id" UUID NOT NULL,
  "supabaseUserId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" public."CustomerRegistrationIntentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "CustomerRegistrationIntent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerRegistrationIntent_state_check" CHECK (
    (
      "status" = 'PENDING'
      AND "activatedAt" IS NULL
      AND "expiresAt" IS NULL
      AND "consumedAt" IS NULL
    )
    OR (
      "status" = 'ACTIVE'
      AND "activatedAt" IS NOT NULL
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" > "activatedAt"
      AND "consumedAt" IS NULL
    )
    OR (
      "status" = 'CONSUMED'
      AND "activatedAt" IS NOT NULL
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" > "activatedAt"
      AND "consumedAt" IS NOT NULL
      AND "consumedAt" <= "expiresAt"
    )
  )
);

CREATE UNIQUE INDEX "CustomerRegistrationIntent_supabaseUserId_key"
  ON public."CustomerRegistrationIntent"("supabaseUserId");
CREATE UNIQUE INDEX "CustomerRegistrationIntent_email_key"
  ON public."CustomerRegistrationIntent"("email");
CREATE INDEX "CustomerRegistrationIntent_email_status_createdAt_idx"
  ON public."CustomerRegistrationIntent"("email", "status", "createdAt");
CREATE INDEX "CustomerRegistrationIntent_status_expiresAt_idx"
  ON public."CustomerRegistrationIntent"("status", "expiresAt");

ALTER TABLE public."CustomerRegistrationIntent" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."CustomerRegistrationIntent"
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TYPE public."CustomerRegistrationIntentStatus"
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT ON TABLE public."CustomerRegistrationIntent"
  TO farochet_runtime;
GRANT UPDATE ("status", "activatedAt", "expiresAt", "consumedAt")
  ON TABLE public."CustomerRegistrationIntent"
  TO farochet_runtime;
GRANT USAGE ON TYPE public."CustomerRegistrationIntentStatus"
  TO farochet_runtime;

CREATE POLICY runtime_customer_registration_intent_select
  ON public."CustomerRegistrationIntent"
  FOR SELECT
  TO farochet_runtime
  USING (true);

CREATE POLICY runtime_customer_registration_intent_insert
  ON public."CustomerRegistrationIntent"
  FOR INSERT
  TO farochet_runtime
  WITH CHECK (
    "status" = 'PENDING'
    AND "activatedAt" IS NULL
    AND "expiresAt" IS NULL
    AND "consumedAt" IS NULL
  );

CREATE POLICY runtime_customer_registration_intent_update
  ON public."CustomerRegistrationIntent"
  FOR UPDATE
  TO farochet_runtime
  USING (true)
  WITH CHECK (true);

COMMIT;
