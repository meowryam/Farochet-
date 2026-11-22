import { z } from "zod";

const fixedDiscountSchema = z.object({
  fixedDiscountAmount: z.number({
    error: "Fixed discount amount must be a whole-PKR number.",
  }).int("Fixed discount amount must be a whole-PKR number.")
    .positive("Fixed discount amount must be positive."),
}).strict();

function createPricingController(pricingAndDiscountManagement) {
  return {
    publicState: async (_req, res) => {
      const state = await pricingAndDiscountManagement.getPublicPricingState();
      res.json(state);
    },

    activateOrUpdate: async (req, res) => {
      const parsed = fixedDiscountSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join(" ");
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message },
        });
      }

      const discount = await pricingAndDiscountManagement.activateOrUpdatePublicDiscount(
        parsed.data.fixedDiscountAmount,
      );
      const state = await pricingAndDiscountManagement.getPublicPricingState();
      res.json({ discount, ...state });
    },

    remove: async (_req, res) => {
      const discount = await pricingAndDiscountManagement.removePublicDiscount();
      const state = await pricingAndDiscountManagement.getPublicPricingState();
      res.json({ discount, ...state });
    },
  };
}

export { createPricingController, fixedDiscountSchema };
