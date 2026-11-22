BEGIN;

CREATE TABLE public."WishlistItem" (
  "id" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WishlistItem_customerId_productId_key" UNIQUE ("customerId", "productId"),
  CONSTRAINT "WishlistItem_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES public."User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WishlistItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES public."Product"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "WishlistItem_customerId_createdAt_idx"
  ON public."WishlistItem"("customerId", "createdAt");
CREATE INDEX "WishlistItem_productId_idx"
  ON public."WishlistItem"("productId");

ALTER TABLE public."WishlistItem" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."WishlistItem"
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public."WishlistItem"
  TO farochet_runtime;

CREATE POLICY runtime_wishlist_item_select
  ON public."WishlistItem"
  FOR SELECT
  TO farochet_runtime
  USING (true);

CREATE POLICY runtime_wishlist_item_insert
  ON public."WishlistItem"
  FOR INSERT
  TO farochet_runtime
  WITH CHECK (true);

CREATE POLICY runtime_wishlist_item_delete
  ON public."WishlistItem"
  FOR DELETE
  TO farochet_runtime
  USING (true);

COMMIT;
