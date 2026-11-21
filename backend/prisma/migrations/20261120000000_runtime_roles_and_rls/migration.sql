BEGIN;

ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Inquiry" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public."Product",
  public."User",
  public."Inquiry"
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL PRIVILEGES ON TYPE public."UserRole"
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public."Product" TO farochet_runtime;
GRANT SELECT, INSERT ON TABLE public."User" TO farochet_runtime;
GRANT SELECT ON TABLE public."Inquiry" TO farochet_runtime;
GRANT USAGE ON TYPE public."UserRole" TO farochet_runtime;

CREATE POLICY runtime_product_select
  ON public."Product"
  FOR SELECT
  TO farochet_runtime
  USING (true);

CREATE POLICY runtime_product_insert
  ON public."Product"
  FOR INSERT
  TO farochet_runtime
  WITH CHECK (true);

CREATE POLICY runtime_product_update
  ON public."Product"
  FOR UPDATE
  TO farochet_runtime
  USING (true)
  WITH CHECK (true);

CREATE POLICY runtime_user_select
  ON public."User"
  FOR SELECT
  TO farochet_runtime
  USING (true);

CREATE POLICY runtime_user_insert_customer_only
  ON public."User"
  FOR INSERT
  TO farochet_runtime
  WITH CHECK ("role" = 'CUSTOMER'::public."UserRole");

CREATE POLICY runtime_inquiry_select
  ON public."Inquiry"
  FOR SELECT
  TO farochet_runtime
  USING (true);

COMMIT;
