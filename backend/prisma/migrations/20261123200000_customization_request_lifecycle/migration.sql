BEGIN;

CREATE TABLE IF NOT EXISTS public."Customization" (
  "id" UUID NOT NULL,
  "inquiryId" UUID NOT NULL,
  "productType" TEXT NOT NULL,
  "size" TEXT,
  "colour" TEXT,
  "materials" TEXT,
  "quantity" INTEGER NOT NULL,
  "budget" TEXT,
  "specialInstructions" TEXT,
  "requiredCompletionDate" TIMESTAMP(3),
  "deliveryAddress" TEXT,
  "referenceImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customization_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Customization_inquiryId_fkey"
    FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Customization_inquiryId_createdAt_idx"
  ON public."Customization"("inquiryId", "createdAt");

CREATE TABLE IF NOT EXISTS public."PendingOrderRequest" (
  "id" UUID NOT NULL,
  "customizationId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PendingOrderRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PendingOrderRequest_customizationId_fkey"
    FOREIGN KEY ("customizationId") REFERENCES public."Customization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PendingOrderRequest_customizationId_key"
  ON public."PendingOrderRequest"("customizationId");
CREATE INDEX IF NOT EXISTS "PendingOrderRequest_status_createdAt_idx"
  ON public."PendingOrderRequest"("status", "createdAt");

ALTER TABLE public."Customization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PendingOrderRequest" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."Customization", public."PendingOrderRequest"
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public."Customization", public."PendingOrderRequest"
  TO farochet_runtime;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Customization'
      AND policyname = 'runtime_customization_select'
  ) THEN
    CREATE POLICY runtime_customization_select
      ON public."Customization"
      FOR SELECT
      TO farochet_runtime
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Customization'
      AND policyname = 'runtime_customization_insert'
  ) THEN
    CREATE POLICY runtime_customization_insert
      ON public."Customization"
      FOR INSERT
      TO farochet_runtime
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PendingOrderRequest'
      AND policyname = 'runtime_pending_order_request_select'
  ) THEN
    CREATE POLICY runtime_pending_order_request_select
      ON public."PendingOrderRequest"
      FOR SELECT
      TO farochet_runtime
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PendingOrderRequest'
      AND policyname = 'runtime_pending_order_request_insert'
  ) THEN
    CREATE POLICY runtime_pending_order_request_insert
      ON public."PendingOrderRequest"
      FOR INSERT
      TO farochet_runtime
      WITH CHECK (true);
  END IF;
END
$$;

COMMIT;
