BEGIN;

ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "specificationChangeNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "specificationChangeRecordedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "specificationChangeResolvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationRequestReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationApproved" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "cancellationDecisionAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationDecisionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "refundOutcome" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Order'
      AND column_name IN (
        'specificationChangeNotes',
        'specificationChangeRecordedAt',
        'specificationChangeResolvedAt',
        'cancellationRequestedAt',
        'cancellationRequestReason',
        'cancellationApproved',
        'cancellationDecisionAt',
        'cancellationDecisionNotes',
        'refundOutcome'
      )
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM (VALUES
        ('specificationChangeNotes', 'text'),
        ('specificationChangeRecordedAt', 'timestamp without time zone'),
        ('specificationChangeResolvedAt', 'timestamp without time zone'),
        ('cancellationRequestedAt', 'timestamp without time zone'),
        ('cancellationRequestReason', 'text'),
        ('cancellationApproved', 'boolean'),
        ('cancellationDecisionAt', 'timestamp without time zone'),
        ('cancellationDecisionNotes', 'text'),
        ('refundOutcome', 'text')
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
      RAISE EXCEPTION 'Existing public."Order" order-change columns have incompatible types';
    END IF;
  END IF;
END
$$;

-- Existing status endpoints and the new On Hold/Cancelled transitions write
-- these columns; the earlier delivery migration omitted them.
GRANT UPDATE (
  "manufacturingStatus",
  "paymentStatus",
  "estimatedCompletionDate",
  "specificationChangeNotes",
  "specificationChangeRecordedAt",
  "specificationChangeResolvedAt",
  "cancellationRequestedAt",
  "cancellationRequestReason",
  "cancellationApproved",
  "cancellationDecisionAt",
  "cancellationDecisionNotes",
  "refundOutcome"
) ON TABLE public."Order" TO farochet_runtime;

-- Order reads now include append-only price history. The earlier migration
-- granted INSERT and an INSERT policy but no SELECT privilege or policy.
GRANT SELECT ON TABLE public."OrderPriceRevision" TO farochet_runtime;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'OrderPriceRevision'
      AND policyname = 'runtime_order_price_revision_select'
  ) THEN
    CREATE POLICY runtime_order_price_revision_select
      ON public."OrderPriceRevision"
      FOR SELECT
      TO farochet_runtime
      USING (true);
  ELSE
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'OrderPriceRevision'
        AND policyname = 'runtime_order_price_revision_select'
        AND NOT (
          cmd = 'SELECT'
          AND roles::text = '{farochet_runtime}'
          AND qual = 'true'
        )
    ) THEN
      RAISE EXCEPTION 'Existing runtime_order_price_revision_select policy has incompatible definition';
    END IF;
  END IF;
END
$$;

COMMIT;
