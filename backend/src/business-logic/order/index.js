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
    deliveryMethod: order.deliveryMethod ?? null,
    deliveryFee: order.deliveryFee ?? null,
    deliveryTrackingInformation: order.deliveryTrackingInformation ?? null,
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
    createConfirmedOrder: async ({
      requestId,
      decision,
      inquiryId,
      approvedPrice,
      negotiatedPriceSnapshot,
    }) => {
      // Status Management has no order-status initializer in the current
      // code, so no initializer is invented here. The three values below are
      // the existing schema defaults; this choice is reported as a pending
      // STOP AND ASK item for team confirmation (ADR-005 Decision 3).
      const result = await repository.decidePendingRequest({
        requestId,
        decision,
        order: {
          inquiryId,
          approvedPrice,
          negotiatedPriceSnapshot: negotiatedPriceSnapshot ?? null,
          manufacturingStatus: "Incomplete",
          paymentStatus: null,
          deliveryStatus: null,
        },
      });
      return toOrderView(result.order);
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

    /**
     * List orders filtered by confirmedAt date range for Sales Summary.
     * Only Raazia may call this. Returns minimal view objects needed by FR-18.
     *
     * @param {object} viewer - Must be RAAZIA.
     * @param {{ confirmedAtStart: Date, confirmedAtEnd: Date }} range
     * @returns {Promise<Array<{ id, approvedPrice, manufacturingStatus, confirmedAt }>>}
     */
    listOrdersForSalesSummary: async (viewer, { confirmedAtStart, confirmedAtEnd }) => {
      if (!viewer || viewer.role !== "RAAZIA") {
        throw orderError(
          "Only Raazia can retrieve order data for the sales summary.",
          403,
          "SALES_SUMMARY_ACCESS_DENIED",
        );
      }
      const orders = await repository.listOrdersForDateRange({ confirmedAtStart, confirmedAtEnd });
      return orders.map((order) => ({
        id: order.id,
        approvedPrice: order.approvedPrice,
        manufacturingStatus: order.manufacturingStatus ?? "Incomplete",
        confirmedAt: order.confirmedAt,
      }));
    },
  };
}

const orderManagement = createOrderManagement({ repository });

export default orderManagement;
export { createOrderManagement, toOrderView };
