CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "approvedPrice" INTEGER NOT NULL,
    "negotiatedPriceSnapshot" INTEGER,
    "manufacturingStatus" TEXT NOT NULL DEFAULT 'Incomplete',
    "paymentStatus" TEXT,
    "deliveryStatus" TEXT,
    "estimatedCompletionDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_approvedPrice_positive" CHECK ("approvedPrice" > 0),
    CONSTRAINT "Order_negotiatedPrice_positive" CHECK (
        "negotiatedPriceSnapshot" IS NULL OR "negotiatedPriceSnapshot" > 0
    ),
    CONSTRAINT "Order_manufacturingStatus_valid" CHECK (
        "manufacturingStatus" IN ('Incomplete', 'In Progress', 'Completed', 'Cancelled', 'On Hold')
    ),
    CONSTRAINT "Order_paymentStatus_valid" CHECK (
        "paymentStatus" IS NULL OR "paymentStatus" IN (
            'Advance Payment Received',
            'Partial Payment',
            'Full Payment',
            'Refunded'
        )
    ),
    CONSTRAINT "Order_deliveryStatus_valid" CHECK (
        "deliveryStatus" IS NULL OR "deliveryStatus" = 'Delivered'
    ),

    CONSTRAINT "Order_inquiryId_fkey"
        FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Order_inquiryId_confirmedAt_idx" ON "Order"("inquiryId", "confirmedAt");
CREATE INDEX "Order_manufacturingStatus_confirmedAt_idx" ON "Order"("manufacturingStatus", "confirmedAt");
