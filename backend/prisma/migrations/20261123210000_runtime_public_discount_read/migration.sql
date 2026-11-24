BEGIN;

GRANT SELECT ON TABLE public."PublicDiscount" TO farochet_runtime;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'PublicDiscount'
      AND policyname = 'runtime_public_discount_select'
  ) THEN
    CREATE POLICY runtime_public_discount_select
      ON public."PublicDiscount"
      FOR SELECT
      TO farochet_runtime
      USING (true);
  END IF;
END
$$;

COMMIT;
