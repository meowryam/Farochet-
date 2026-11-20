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

function createOrderController(orderManagement) {
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
  };
}

export { createOrderController, orderIdSchema };
