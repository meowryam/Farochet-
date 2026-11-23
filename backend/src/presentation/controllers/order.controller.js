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
  };
}

export {
  createOrderController,
  manufacturingProgressSchema,
  orderIdSchema,
  paymentStatusSchema,
};
