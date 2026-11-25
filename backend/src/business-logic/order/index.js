import defaultRepository from "../../data-access/repositories/index.ts";
import defaultStatusManagement, { createStatusManagement } from "../status/index.js";

function orderError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPriceRevisionView(revision, order) {
  return {
    id: revision.id,
    orderId: revision.orderId ?? order.id,
    originalPrice: revision.originalPrice,
    revisedPrice: revision.revisedPrice,
    actingUserId: revision.actingUserId,
    customerAgreed: revision.customerAgreed,
    reason: revision.reason ?? null,
    createdAt: revision.createdAt,
  };
}

function toAdminOrderView(order) {
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
    specificationChangeNotes: order.specificationChangeNotes ?? null,
    specificationChangeRecordedAt: order.specificationChangeRecordedAt ?? null,
    specificationChangeResolvedAt: order.specificationChangeResolvedAt ?? null,
    cancellationRequestedAt: order.cancellationRequestedAt ?? null,
    cancellationRequestReason: order.cancellationRequestReason ?? null,
    cancellationApproved: order.cancellationApproved ?? null,
    cancellationDecisionAt: order.cancellationDecisionAt ?? null,
    cancellationDecisionNotes: order.cancellationDecisionNotes ?? null,
    refundOutcome: order.refundOutcome ?? null,
    priceRevisions: Array.isArray(order.priceRevisions)
      ? order.priceRevisions.map((revision) => toPriceRevisionView(revision, order))
      : [],
    confirmedAt: order.confirmedAt,
    updatedAt: order.updatedAt,
    productName: inquiry?.product?.name ?? null,
  };
}

function toCustomerOrderView(order) {
  const view = toAdminOrderView(order);
  // Internal decision notes and price-change history are Raazia-only (UI C-12).
  delete view.cancellationDecisionNotes;
  delete view.priceRevisions;
  return view;
}

function assertViewer(viewer) {
  if (!viewer) {
    throw orderError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
  }
  if (viewer.role !== "RAAZIA" && viewer.role !== "CUSTOMER") {
    throw orderError("This order is not available to this account.", 403, "ORDER_ACCESS_DENIED");
  }
}

// Role authorization belongs to centralized Middleware (ADR-004). This helper
// only establishes the authenticated acting user needed for change records.
function requireActingUserId(viewer) {
  if (!viewer || typeof viewer.id !== "string" || viewer.id.length === 0) {
    throw orderError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
  }
  return viewer.id;
}

function requireWholePrice(value, code = "INVALID_APPROVED_PRICE") {
  if (!Number.isInteger(value) || value <= 0) {
    throw orderError("Price must be a positive whole PKR amount.", 400, code);
  }
  return value;
}

function requireNote(value, message, code) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw orderError(message, 400, code);
  }
  return value.trim();
}

function optionalText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function createOrderManagement({ repository, statusManagement } = {}) {
  if (!repository) {
    throw new Error("Order Management requires the centralized Repository.");
  }

  const statuses = statusManagement
    ?? (repository === defaultRepository
      ? defaultStatusManagement
      : createStatusManagement({ repository }));

  function statusWriterFor(repositoryOverride) {
    if (repositoryOverride === repository && statuses) return statuses;
    return createStatusManagement({ repository: repositoryOverride });
  }

  async function runOrderTransaction(callback) {
    if (typeof repository.withOrderTransaction === "function") {
      return repository.withOrderTransaction(callback);
    }
    return callback(repository);
  }

  async function findOrderForViewer(viewer, id) {
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
    return order;
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
      // the existing schema defaults and match ADR-005 Decision 3.
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
      return toAdminOrderView(result.order);
    },

    listOrdersForViewer: async (viewer) => {
      assertViewer(viewer);
      const orders = await repository.listOrders();
      if (viewer.role === "RAAZIA") return orders.map(toAdminOrderView);
      return orders
        .filter((order) => order.inquiry?.customerId === viewer.id)
        .map(toCustomerOrderView);
    },

    getOrderForViewer: async (viewer, id) => {
      const order = await findOrderForViewer(viewer, id);
      return viewer.role === "RAAZIA" ? toAdminOrderView(order) : toCustomerOrderView(order);
    },

    recordSpecificationChange: async (viewer, orderId, input) => {
      const actingUserId = requireActingUserId(viewer);
      const notes = requireNote(
        input?.notes,
        "A specification change note is required.",
        "SPECIFICATION_CHANGE_NOTE_REQUIRED",
      );

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }
      if (order.cancellationApproved === true || order.manufacturingStatus === "Cancelled") {
        throw orderError("A cancelled Order cannot be placed On Hold for renegotiation.", 409, "CANCELLED_ORDER_CHANGE_DENIED");
      }

      return runOrderTransaction(async (txRepository) => {
        const current = await txRepository.findOrderById(orderId);
        if (!current) {
          throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
        }
        if (current.cancellationApproved === true || current.manufacturingStatus === "Cancelled") {
          throw orderError("A cancelled Order cannot be placed On Hold for renegotiation.", 409, "CANCELLED_ORDER_CHANGE_DENIED");
        }
        await txRepository.recordOrderSpecificationChange(orderId, {
          specificationChangeNotes: notes,
          specificationChangeRecordedAt: new Date(),
          specificationChangeResolvedAt: null,
        });
        // Status Management validates and writes the status value, but inside
        // the same Repository transaction as the specification record.
        const txStatuses = statusWriterFor(txRepository);
        await txStatuses.updateManufacturingProgress(
          { ...viewer, id: actingUserId },
          orderId,
          { manufacturingStatus: "On Hold" },
        );
        return toAdminOrderView(await txRepository.findOrderById(orderId));
      });
    },

    recordPriceRevision: async (viewer, orderId, input) => {
      const actingUserId = requireActingUserId(viewer);
      const revisedPrice = requireWholePrice(
        input?.revisedApprovedPrice,
        "INVALID_REVISED_APPROVED_PRICE",
      );
      const reason = requireNote(
        input?.reason,
        "A reason for the price revision is required.",
        "PRICE_REVISION_REASON_REQUIRED",
      );
      if (input.customerAgreed !== true) {
        throw orderError(
          "Customer agreement is required before recording a revised Approved Price.",
          400,
          "PRICE_REVISION_AGREEMENT_REQUIRED",
        );
      }

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }
      if (order.cancellationApproved === true || order.manufacturingStatus === "Cancelled") {
        throw orderError("A cancelled Order cannot receive a price revision.", 409, "CANCELLED_ORDER_PRICE_REVISION_DENIED");
      }

      const data = { approvedPrice: revisedPrice };
      if (order.specificationChangeRecordedAt && !order.specificationChangeResolvedAt) {
        data.specificationChangeResolvedAt = new Date();
      }

      await repository.updateOrderApprovedPrice(orderId, data, {
        originalPrice: order.approvedPrice,
        revisedPrice,
        actingUserId,
        customerAgreed: true,
        reason,
      });
      return toAdminOrderView(await repository.findOrderById(orderId));
    },

    requestCancellation: async (viewer, orderId, input) => {
      const order = await findOrderForViewer(viewer, orderId);
      if (order.cancellationApproved !== null && order.cancellationApproved !== undefined) {
        throw orderError("A cancellation decision has already been recorded.", 409, "CANCELLATION_DECISION_RECORDED");
      }
      if (order.manufacturingStatus === "Cancelled") {
        throw orderError("This Order has already been cancelled.", 409, "ORDER_ALREADY_CANCELLED");
      }
      if (order.cancellationRequestedAt) {
        return toCustomerOrderView(order);
      }

      const reason = optionalText(input?.reason);
      await repository.updateOrderCancellationRequest(orderId, {
        cancellationRequestedAt: new Date(),
        cancellationRequestReason: reason,
      });
      return toCustomerOrderView(await repository.findOrderById(orderId));
    },

    decideCancellation: async (viewer, orderId, input) => {
      const actingUserId = requireActingUserId(viewer);
      if (typeof input?.approved !== "boolean") {
        throw orderError("A cancellation decision is required.", 400, "CANCELLATION_DECISION_REQUIRED");
      }
      const notes = optionalText(input.notes);
      const hasRefundOutcome = Object.prototype.hasOwnProperty.call(input ?? {}, "refundOutcome");
      const refundOutcome = hasRefundOutcome ? optionalText(input.refundOutcome) : undefined;

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }

      return runOrderTransaction(async (txRepository) => {
        const current = await txRepository.findOrderById(orderId);
        if (!current) {
          throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
        }

        // A rejected decision must never contradict an already Cancelled Order.
        if (current.manufacturingStatus === "Cancelled" && input.approved !== true) {
          throw orderError(
            "A Cancelled Order cannot receive a rejection decision.",
            409,
            "CANCELLED_ORDER_DECISION_CONFLICT",
          );
        }
        if (current.cancellationApproved !== null && current.cancellationApproved !== undefined) {
          if (current.cancellationApproved === input.approved) {
            return toAdminOrderView(current);
          }
          throw orderError("A different cancellation decision has already been recorded.", 409, "CANCELLATION_DECISION_RECORDED");
        }
        // A Customer request remains necessary for a rejection; approval may be
        // Raazia-initiated after failed renegotiation under PRD FR-13.
        if (!current.cancellationRequestedAt && input.approved !== true) {
          throw orderError("No Customer cancellation request is awaiting a decision.", 409, "CANCELLATION_REQUEST_REQUIRED");
        }
        if (input.approved && current.deliveryStatus === "Delivered") {
          throw orderError("A delivered Order cannot be cancelled.", 409, "DELIVERED_ORDER_CANCELLATION_DENIED");
        }

        const decisionData = {
          cancellationApproved: input.approved,
          cancellationDecisionAt: new Date(),
          cancellationDecisionNotes: notes,
        };
        if (hasRefundOutcome) {
          decisionData.refundOutcome = refundOutcome;
        }

        if (input.approved) {
          // Status Management remains the sole status writer, inside this
          // transaction so the decision and status cannot diverge.
          const txStatuses = statusWriterFor(txRepository);
          await txStatuses.updateManufacturingProgress(
            { ...viewer, id: actingUserId },
            orderId,
            { manufacturingStatus: "Cancelled" },
          );
        }
        await txRepository.recordCancellationDecision(orderId, decisionData);
        return toAdminOrderView(await txRepository.findOrderById(orderId));
      });
    },

    recordRefundOutcome: async (viewer, orderId, input) => {
      requireActingUserId(viewer);
      if (!input || !Object.prototype.hasOwnProperty.call(input, "refundOutcome")) {
        throw orderError("A refund outcome is required.", 400, "REFUND_OUTCOME_REQUIRED");
      }

      const order = await repository.findOrderById(orderId);
      if (!order) {
        throw orderError("Order was not found.", 404, "ORDER_NOT_FOUND");
      }
      // Recording is manual bookkeeping only: no refund is calculated or
      // executed and no status attribute is changed.
      await repository.updateOrderRefundOutcome(orderId, {
        refundOutcome: optionalText(input.refundOutcome),
      });
      return toAdminOrderView(await repository.findOrderById(orderId));
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

const orderManagement = createOrderManagement({ repository: defaultRepository });

export default orderManagement;
export { createOrderManagement, toAdminOrderView, toCustomerOrderView };
