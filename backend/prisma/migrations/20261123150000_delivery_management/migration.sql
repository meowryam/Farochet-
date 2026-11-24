BEGIN;

ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryFee" INTEGER,
  ADD COLUMN IF NOT EXISTS "deliveryTrackingInformation" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Order'
      AND column_name IN (
        'deliveryMethod',
        'deliveryFee',
        'deliveryTrackingInformation'
      )
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM (VALUES
        ('deliveryMethod', 'text'),
        ('deliveryFee', 'integer'),
        ('deliveryTrackingInformation', 'text')
      ) AS expected(column_name, data_type)
      WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns live
        WHERE live.table_schema = 'public'
          AND live.table_name = 'Order'
          AND live.column_name = expected.column_name
          AND live.data_type = expected.data_type
      )
    ) THEN
      RAISE EXCEPTION 'Existing public."Order" delivery columns have incompatible types';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."Order"'::regclass
      AND conname = 'Order_deliveryMethod_valid'
  ) THEN
    ALTER TABLE public."Order"
      ADD CONSTRAINT "Order_deliveryMethod_valid"
      CHECK (
        "deliveryMethod" IS NULL
        OR "deliveryMethod" IN ('Local handover', 'Courier/service delivery')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."Order"'::regclass
      AND conname = 'Order_deliveryFee_valid'
  ) THEN
    ALTER TABLE public."Order"
      ADD CONSTRAINT "Order_deliveryFee_valid"
      CHECK ("deliveryFee" IS NULL OR "deliveryFee" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."Order"'::regclass
      AND conname = 'Order_localHandoverFee_zero'
  ) THEN
    ALTER TABLE public."Order"
      ADD CONSTRAINT "Order_localHandoverFee_zero"
      CHECK (
        "deliveryMethod" IS DISTINCT FROM 'Local handover'
        OR "deliveryFee" IS NOT DISTINCT FROM 0
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public."OrderPriceRevision"') IS NULL THEN
    CREATE TABLE public."OrderPriceRevision" (
      "id" UUID NOT NULL,
      "orderId" UUID NOT NULL,
      "originalPrice" INTEGER NOT NULL,
      "revisedPrice" INTEGER NOT NULL,
      "actingUserId" UUID NOT NULL,
      "customerAgreed" BOOLEAN NOT NULL,
      "reason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "OrderPriceRevision_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "OrderPriceRevision_originalPrice_positive"
        CHECK ("originalPrice" > 0),
      CONSTRAINT "OrderPriceRevision_revisedPrice_positive"
        CHECK ("revisedPrice" > 0),
      CONSTRAINT "OrderPriceRevision_customerAgreed_true"
        CHECK ("customerAgreed" = TRUE),
      CONSTRAINT "OrderPriceRevision_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES public."Order"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "OrderPriceRevision_actingUserId_fkey"
        FOREIGN KEY ("actingUserId") REFERENCES public."User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  ELSE
    IF EXISTS (
      SELECT 1
      FROM (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'OrderPriceRevision'
      ) AS live
      EXCEPT
      SELECT column_name
      FROM (VALUES
        ('id'), ('orderId'), ('originalPrice'), ('revisedPrice'),
        ('actingUserId'), ('customerAgreed'), ('reason'), ('createdAt')
      ) AS expected(column_name)
    ) OR EXISTS (
      SELECT 1
      FROM (VALUES
        ('id'), ('orderId'), ('originalPrice'), ('revisedPrice'),
        ('actingUserId'), ('customerAgreed'), ('reason'), ('createdAt')
      ) AS expected(column_name)
      EXCEPT
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'OrderPriceRevision'
    ) THEN
      RAISE EXCEPTION 'Existing public."OrderPriceRevision" has incompatible columns';
    END IF;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "OrderPriceRevision_orderId_createdAt_idx"
  ON public."OrderPriceRevision"("orderId", "createdAt");

ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderPriceRevision" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public."Order" TO farochet_runtime;
GRANT UPDATE (
  "approvedPrice",
  "deliveryStatus",
  "deliveryMethod",
  "deliveryFee",
  "deliveryTrackingInformation",
  "updatedAt"
) ON TABLE public."Order" TO farochet_runtime;
GRANT INSERT (
  "id",
  "orderId",
  "originalPrice",
  "revisedPrice",
  "actingUserId",
  "customerAgreed",
  "reason"
) ON TABLE public."OrderPriceRevision" TO farochet_runtime;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Order'
      AND policyname = 'runtime_order_select'
  ) THEN
    CREATE POLICY runtime_order_select
      ON public."Order"
      FOR SELECT
      TO farochet_runtime
      USING (true);
  ELSE
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'Order'
        AND policyname = 'runtime_order_select'
        AND NOT (
          cmd = 'SELECT'
          AND roles::text = '{farochet_runtime}'
          AND qual = 'true'
        )
    ) THEN
      RAISE EXCEPTION 'Existing runtime_order_select policy has incompatible definition';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'Order'
      AND policyname = 'runtime_order_update'
  ) THEN
    CREATE POLICY runtime_order_update
      ON public."Order"
      FOR UPDATE
      TO farochet_runtime
      USING (true)
      WITH CHECK (true);
  ELSE
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'Order'
        AND policyname = 'runtime_order_update'
        AND NOT (
          cmd = 'UPDATE'
          AND roles::text = '{farochet_runtime}'
          AND qual = 'true'
          AND with_check = 'true'
        )
    ) THEN
      RAISE EXCEPTION 'Existing runtime_order_update policy has incompatible definition';
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'OrderPriceRevision'
      AND policyname = 'runtime_order_price_revision_insert'
  ) THEN
    CREATE POLICY runtime_order_price_revision_insert
      ON public."OrderPriceRevision"
      FOR INSERT
      TO farochet_runtime
      WITH CHECK (true);
  ELSE
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'OrderPriceRevision'
        AND policyname = 'runtime_order_price_revision_insert'
        AND NOT (
          cmd = 'INSERT'
          AND roles::text = '{farochet_runtime}'
          AND with_check = 'true'
        )
    ) THEN
      RAISE EXCEPTION 'Existing runtime_order_price_revision_insert policy has incompatible definition';
    END IF;
  END IF;
END
$$;

COMMIT;
