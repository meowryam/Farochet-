import repository from "../../data-access/repositories/index.ts";

const MANUFACTURING_STATUSES = new Set([
  "Incomplete",
  "In Progress",
  "Completed",
  "Cancelled",
  "On Hold",
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
  };
}

const statusManagement = createStatusManagement({ repository });

export default statusManagement;
export { createStatusManagement, MANUFACTURING_STATUSES };
