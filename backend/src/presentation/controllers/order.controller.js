import { z } from "zod";

const orderIdSchema = z.string().uuid();

function parseOrderId(req, res) {
  const parsed = orderIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "INVALID_ORDER_ID", message: "Order ID must be a valid UUID." },
    });
    return null;
  }
  return parsed.data;
}

const manufacturingProgressSchema = z.object({
  manufacturingStatus: z.enum([
    "Incomplete",
    "In Progress",
    "Completed",
    "Cancelled",
    "On Hold",
  ]).optional(),
  estimatedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Estimated Completion Date must use YYYY-MM-DD format.")
    .nullable()
    .optional(),
}).strict().refine(
  (value) => value.manufacturingStatus !== undefined || value.estimatedCompletionDate !== undefined,
  { message: "Provide a manufacturing status or Estimated Completion Date." },
);

const paymentStatusSchema = z.object({
  paymentStatus: z.enum([
    "Advance Payment Received",
    "Partial Payment",
    "Full Payment",
    "Refunded",
  ]),
}).strict();

const deliveryManagementSchema = z.object({
  deliveryMethod: z.enum(["Local handover", "Courier/service delivery"]),
  deliveryFee: z.number().int().nonnegative().nullable().optional(),
  deliveryTrackingInformation: z.string().trim().max(500).nullable().optional(),
  deliveryStatus: z.enum(["Delivered"]).nullable().optional(),
  courierFeeIncrease: z.number().int().nonnegative().optional(),
  customerAgreed: z.boolean().optional(),
  revisedApprovedPrice: z.number().int().positive().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.deliveryMethod === "Local handover" && value.deliveryFee !== undefined && value.deliveryFee !== 0) {
    ctx.addIssue({ code: "custom", message: "Local handover deliveryFee must be 0." });
  }
  if (
    value.deliveryMethod === "Courier/service delivery"
    && (typeof value.deliveryFee !== "number" || !Number.isInteger(value.deliveryFee) || value.deliveryFee < 0)
  ) {
    ctx.addIssue({ code: "custom", message: "Courier/service delivery requires a non-negative integer deliveryFee." });
  }
  if (value.deliveryMethod === "Local handover" && value.courierFeeIncrease !== undefined) {
    ctx.addIssue({ code: "custom", message: "Courier fee increases apply only to courier/service delivery." });
  }
  if (value.courierFeeIncrease !== undefined && value.courierFeeIncrease >= 200) {
    if (value.customerAgreed !== true) {
      ctx.addIssue({ code: "custom", message: "Customer agreement is required for a courier fee increase of PKR 200 or more." });
    }
    if (value.revisedApprovedPrice === undefined) {
      ctx.addIssue({ code: "custom", message: "revisedApprovedPrice is required when customer agreement is recorded." });
    }
  }
});

function createOrderController(orderManagement, statusManagement) {
  return {
    list: async (req, res) => {
      const orders = await orderManagement.listOrdersForViewer(req.authenticatedUser);
      res.json({ orders });
    },
    get: async (req, res) => {
      const id = parseOrderId(req, res);
      if (!id) return;
      const order = await orderManagement.getOrderForViewer(req.authenticatedUser, id);
      res.json({ order });
    },
    updateManufacturingProgress: async (req, res) => {
      const id = parseOrderId(req, res);
      if (!id) return;
      const parsed = manufacturingProgressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((issue) => issue.message).join(" "),
          },
        });
      }
      const order = await statusManagement.updateManufacturingProgress(
        req.authenticatedUser,
        id,
        parsed.data,
      );
      res.json({ order });
    },
    updatePaymentStatus: async (req, res) => {
      const id = parseOrderId(req, res);
      if (!id) return;
      const parsed = paymentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((issue) => issue.message).join(" "),
          },
        });
      }
      const order = await statusManagement.updatePaymentStatus(
        req.authenticatedUser,
        id,
        parsed.data,
      );
      res.json({ order });
    },
    updateDelivery: async (req, res) => {
      const id = parseOrderId(req, res);
      if (!id) return;
      const parsed = deliveryManagementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((issue) => issue.message).join(" "),
          },
        });
      }
      const order = await statusManagement.updateDelivery(
        req.authenticatedUser,
        id,
        parsed.data,
      );
      res.json({ order });
    },
  };
}

export {
  createOrderController,
  manufacturingProgressSchema,
  orderIdSchema,
  paymentStatusSchema,
  deliveryManagementSchema,
};
