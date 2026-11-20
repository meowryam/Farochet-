CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Inquiry_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Inquiry_customerId_createdAt_idx" ON "Inquiry"("customerId", "createdAt");
CREATE INDEX "Inquiry_productId_idx" ON "Inquiry"("productId");
