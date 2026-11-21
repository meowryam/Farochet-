import repository from "../../data-access/repositories/index.ts";

function orderError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toOrderView(order) {
  const inquiry = order.inquiry;
  return {
    id: order.id,
    originalInquiryId: inquiry?.id ?? order.inquiryId,
    customerId: inquiry?.customerId ?? null,
    approvedPrice: order.approvedPrice,
    negotiatedPriceSnapshot: order.negotiatedPriceSnapshot ?? null,
    manufacturingStatus: order.manufacturingStatus ?? "Incomplete",
    paymentStatus: order.paymentStatus ?? null,
    deliveryStatus: order.deliveryStatus ?? null,
    estimatedCompletionDate: order.estimatedCompletionDate ?? null,
    confirmedAt: order.confirmedAt,
    updatedAt: order.updatedAt,
    productName: inquiry?.product?.name ?? null,
  };
}

function assertViewer(viewer) {
  if (!viewer) {
    throw orderError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
  }
  if (viewer.role !== "RAAZIA" && viewer.role !== "CUSTOMER") {
    throw orderError("This order is not available to this account.", 403, "ORDER_ACCESS_DENIED");
  }
}

function createOrderManagement({ repository }) {
  if (!repository) {
    throw new Error("Order Management requires the centralized Repository.");
  }

  return {
    createConfirmedOrder: async () => {
      throw orderError(
        "Confirmed Orders can only be created through the later accepted-request handoff.",
        409,
        "ORDER_CREATION_NOT_AVAILABLE",
      );
    },

    listOrdersForViewer: async (viewer) => {
      assertViewer(viewer);
      const orders = await repository.listOrders();
      if (viewer.role === "RAAZIA") return orders.map(toOrderView);
      return orders
        .filter((order) => order.inquiry?.customerId === viewer.id)
        .map(toOrderView);
    },

    getOrderForViewer: async (viewer, id) => {
      assertViewer(viewer);
      const order = await repository.findOrderById(id);
      if (!order) {
        if (viewer.role === "CUSTOMER") {
          throw orderError("This order is not available to this account.", 403, "ORDER_ACCESS_DENIED");
        }
        throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }
      if (viewer.role === "CUSTOMER" && order.inquiry?.customerId !== viewer.id) {
        throw orderError("This order is not available to this account.", 403, "ORDER_ACCESS_DENIED");
      }
      return toOrderView(order);
    },
  };
}

const orderManagement = createOrderManagement({ repository });

export default orderManagement;
export { createOrderManagement, toOrderView };
