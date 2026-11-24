import repository from "../../data-access/repositories/index.ts";

const MANUFACTURING_STATUSES = new Set([
  "Incomplete",
  "In Progress",
  "Completed",
  "Cancelled",
  "On Hold",
]);
const PAYMENT_STATUSES = new Set([
  "Advance Payment Received",
  "Partial Payment",
  "Full Payment",
  "Refunded",
]);

function statusError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function parseEstimatedCompletionDate(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw statusError("Estimated Completion Date must be a valid date or null.", 400, "INVALID_ESTIMATED_COMPLETION_DATE");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw statusError("Estimated Completion Date must use YYYY-MM-DD format.", 400, "INVALID_ESTIMATED_COMPLETION_DATE");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw statusError("Estimated Completion Date must be a valid calendar date.", 400, "INVALID_ESTIMATED_COMPLETION_DATE");
  }

  return date;
}

function createStatusManagement({ repository }) {
  if (!repository) {
    throw new Error("Status Management requires the centralized Repository.");
  }

  return {
    updateManufacturingProgress: async (viewer, orderId, input) => {
      if (!viewer) {
        throw statusError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
      if (viewer.role !== "RAAZIA") {
        throw statusError("Only Raazia can update manufacturing progress.", 403, "MANUFACTURING_STATUS_UPDATE_DENIED");
      }
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw statusError("Manufacturing progress data is required.", 400, "INVALID_MANUFACTURING_PROGRESS");
      }

      const hasStatus = Object.prototype.hasOwnProperty.call(input, "manufacturingStatus");
      const hasEstimate = Object.prototype.hasOwnProperty.call(input, "estimatedCompletionDate");
      if (!hasStatus && !hasEstimate) {
        throw statusError("Provide a manufacturing status or Estimated Completion Date.", 400, "MANUFACTURING_PROGRESS_FIELDS_REQUIRED");
      }

      const data = {};
      if (hasStatus) {
        if (typeof input.manufacturingStatus !== "string" || !MANUFACTURING_STATUSES.has(input.manufacturingStatus)) {
          throw statusError(
            "Manufacturing status must be Incomplete, In Progress, Completed, Cancelled, or On Hold.",
            400,
            "INVALID_MANUFACTURING_STATUS",
          );
        }
        data.manufacturingStatus = input.manufacturingStatus;
      }
      if (hasEstimate) {
        data.estimatedCompletionDate = parseEstimatedCompletionDate(input.estimatedCompletionDate);
      }

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw statusError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }

      const updated = await repository.updateOrderManufacturing(orderId, data);
      return {
        id: updated.id,
        manufacturingStatus: updated.manufacturingStatus,
        paymentStatus: updated.paymentStatus,
        deliveryStatus: updated.deliveryStatus,
        estimatedCompletionDate: updated.estimatedCompletionDate ?? null,
        updatedAt: updated.updatedAt,
      };
    },

    updatePaymentStatus: async (viewer, orderId, input) => {
      if (!viewer) {
        throw statusError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
      if (viewer.role !== "RAAZIA") {
        throw statusError("Only Raazia can update payment status.", 403, "PAYMENT_STATUS_UPDATE_DENIED");
      }
      if (!input || typeof input !== "object" || Array.isArray(input)
        || !PAYMENT_STATUSES.has(input.paymentStatus)) {
        throw statusError(
          "Payment status must be Advance Payment Received, Partial Payment, Full Payment, or Refunded.",
          400,
          "INVALID_PAYMENT_STATUS",
        );
      }

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw statusError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }

      const updated = await repository.updateOrderPaymentStatus(orderId, input.paymentStatus);
      return {
        id: updated.id,
        manufacturingStatus: updated.manufacturingStatus,
        paymentStatus: updated.paymentStatus,
        deliveryStatus: updated.deliveryStatus,
        updatedAt: updated.updatedAt,
      };
    },

    updateDelivery: async (viewer, orderId, input) => {
      if (!viewer) {
        throw statusError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
      if (viewer.role !== "RAAZIA") {
        throw statusError("Only Raazia can update delivery information.", 403, "DELIVERY_UPDATE_DENIED");
      }
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw statusError("Delivery data is required.", 400, "INVALID_DELIVERY_UPDATE");
      }

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw statusError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }

      if (input.deliveryMethod === "Local handover") {
        input = { ...input, deliveryFee: 0 };
        if (input.courierFeeIncrease !== undefined) {
          throw statusError(
            "Courier fee increases apply only to courier/service delivery.",
            400,
            "LOCAL_HANDOVER_COURIER_INCREASE_INVALID",
          );
        }
      }

      let approvedPrice = order.approvedPrice;
      let significantIncrease = false;
      if (input.courierFeeIncrease !== undefined) {
        if (input.courierFeeIncrease < 200) {
          approvedPrice = order.approvedPrice;
        } else {
          if (order.deliveryStatus === "Delivered" || input.deliveryStatus === "Delivered") {
            throw statusError(
              "A significant courier fee increase cannot revise an Order that is already delivered or being marked Delivered.",
              400,
              "COURIER_INCREASE_AFTER_DELIVERY_DENIED",
            );
          }
          if (input.customerAgreed !== true || input.revisedApprovedPrice === undefined) {
            throw statusError(
              "Customer agreement and a revised Approved Price are required for a significant courier fee increase.",
              400,
              "SIGNIFICANT_COURIER_INCREASE_AGREEMENT_REQUIRED",
            );
          }
          significantIncrease = true;
          approvedPrice = input.revisedApprovedPrice;
        }
      }

      const data = {
        deliveryMethod: input.deliveryMethod,
        deliveryFee: input.deliveryMethod === "Local handover" ? 0 : input.deliveryFee,
        deliveryTrackingInformation: input.deliveryTrackingInformation ?? null,
      };
      if (significantIncrease) {
        data.approvedPrice = approvedPrice;
      }
      if (Object.prototype.hasOwnProperty.call(input, "deliveryStatus")) {
        data.deliveryStatus = input.deliveryStatus ?? null;
      }

      const updated = await repository.updateOrderDelivery(orderId, data, significantIncrease
        ? {
            originalPrice: order.approvedPrice,
            revisedPrice: approvedPrice,
            actingUserId: viewer.id,
            customerAgreed: true,
            reason: "Courier fee increase",
          }
        : null);
      return {
        id: updated.id,
        manufacturingStatus: updated.manufacturingStatus,
        paymentStatus: updated.paymentStatus,
        deliveryStatus: updated.deliveryStatus,
        deliveryMethod: updated.deliveryMethod ?? null,
        deliveryFee: updated.deliveryFee ?? null,
        deliveryTrackingInformation: updated.deliveryTrackingInformation ?? null,
        approvedPrice: updated.approvedPrice,
        updatedAt: updated.updatedAt,
      };
    },
  };
}

const statusManagement = createStatusManagement({ repository });

export default statusManagement;
export { createStatusManagement, MANUFACTURING_STATUSES, PAYMENT_STATUSES };
