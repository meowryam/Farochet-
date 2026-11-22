CREATE TABLE "PublicDiscount" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "fixedDiscountAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDiscount_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PublicDiscount"
    ADD CONSTRAINT "PublicDiscount_fixedDiscountAmount_positive"
    CHECK ("fixedDiscountAmount" IS NULL OR "fixedDiscountAmount" > 0);
