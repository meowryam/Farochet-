BEGIN;

GRANT INSERT ON TABLE public."Inquiry" TO farochet_runtime;

CREATE POLICY runtime_inquiry_insert
  ON public."Inquiry"
  FOR INSERT
  TO farochet_runtime
  WITH CHECK (true);

COMMIT;
