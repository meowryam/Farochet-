import repository from "../../data-access/repositories/index.ts";
import { createInMemoryImageStorage } from "../../data-access/storage/inMemoryImageStorage.js";

// PendingOrderRequest.status is a plain String. These are the only new
// decision values introduced by Cycle 5; they are not PRD status terms.
const REQUEST_DECISION_STATUSES = Object.freeze({
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
});

function customizationError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createCustomizationAndQuotationManagement({
  repository: dataRepository,
  productManagement,
  imageStorage = createInMemoryImageStorage(),
  orderManagement,
} = {}) {
  if (!dataRepository) {
    throw new Error("Customization and Quotation Management requires the centralized Repository.");
  }
  if (!imageStorage || typeof imageStorage.storeImages !== "function") {
    throw new Error("Customization and Quotation Management requires an image storage interface.");
  }

  function requireViewer(viewer) {
    if (!viewer) {
      throw customizationError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
    }
  }

  function requireRaazia(viewer) {
    requireViewer(viewer);
    if (viewer.role !== "RAAZIA") {
      throw customizationError(
        "This operation is not permitted for this account.",
        403,
        "FORBIDDEN",
      );
    }
  }

  function requestNotFound() {
    return customizationError(
      "Customization request was not found.",
      404,
      "CUSTOMIZATION_REQUEST_NOT_FOUND",
    );
  }

  function imageNotFound() {
    return customizationError(
      "Reference image was not found.",
      404,
      "CUSTOMIZATION_IMAGE_NOT_FOUND",
    );
  }

  function requestNotPending() {
    return customizationError(
      "Request is not pending.",
      409,
      "REQUEST_NOT_PENDING",
    );
  }

  function requireOrderManagement() {
    if (!orderManagement || typeof orderManagement.createConfirmedOrder !== "function") {
      throw customizationError(
        "Order Management is not available for the accepted-request handoff.",
        503,
        "ORDER_MANAGEMENT_NOT_AVAILABLE",
      );
    }
  }

  // Shared by request review and negotiation so both apply the same
  // authentication and customer-ownership rules.
  async function readRequestForViewer(viewer, id) {
    requireViewer(viewer);
    const request = await dataRepository.findCustomizationRequestById(id);
    if (!request) throw requestNotFound();

    if (viewer.role === "RAAZIA") return request;

    if (viewer.role === "CUSTOMER") {
      // Ownership is derived from the persisted Inquiry, never from the
      // request body, query string, or a client-supplied customer id.
      const ownerId = request.inquiry?.customerId;
      if (ownerId && ownerId === viewer.id) return request;
      throw requestNotFound();
    }

    throw customizationError(
      "This operation is not permitted for this account.",
      403,
      "FORBIDDEN",
    );
  }

  // Read-only quotation reference. No price is created, stored, or written
  // back to the Product or PublicDiscount records.
  async function getQuotationReference(request) {
    const productId = request.inquiry?.productId;
    if (!productId) return { standardCataloguePrice: null, publicPrice: null };

    const product = await dataRepository.findProductById(productId);
    if (!product) return { standardCataloguePrice: null, publicPrice: null };

    const standardCataloguePrice = product.basePrice;
    const discount = await dataRepository.getPublicDiscount();
    const publicPrice = discount?.active && Number.isSafeInteger(discount.fixedDiscountAmount)
      ? standardCataloguePrice - discount.fixedDiscountAmount
      : null;

    return { standardCataloguePrice, publicPrice };
  }

  return {
    recordCustomization: async (viewer, input) => {
      requireViewer(viewer);
      if (viewer.role !== "CUSTOMER") {
        throw customizationError(
          "This operation is not permitted for this account.",
          403,
          "FORBIDDEN",
        );
      }

      if (input.productId) {
        if (!productManagement) {
          throw customizationError("Product information is not available.", 503, "PRODUCT_MANAGEMENT_UNAVAILABLE");
        }
        await productManagement.getCatalogueProduct(input.productId);
      }

      // The owner is always the authenticated viewer. Any client-supplied
      // customer identity is ignored and cannot be carried into persistence.
      const storedImages = await imageStorage.storeImages({
        customerId: viewer.id,
        images: input.referenceImages ?? [],
      });

      return dataRepository.createCustomizationRequest({
        inquiry: {
          customerId: viewer.id,
          productId: input.productId ?? null,
          message: input.specialInstructions ?? "",
        },
        customization: {
          productType: input.productType,
          size: input.size ?? null,
          colour: input.colour ?? null,
          materials: input.materials ?? null,
          quantity: input.quantity,
          budget: input.budget ?? null,
          specialInstructions: input.specialInstructions ?? null,
          requiredCompletionDate: input.requiredCompletionDate
            ? new Date(input.requiredCompletionDate)
            : null,
          deliveryAddress: input.deliveryAddress ?? null,
          referenceImages: storedImages.map((image) => image.path),
        },
      });
    },

    // Read-only review support. Raazia sees the submitted information exactly
    // as stored; this component does not assess feasibility or decide outcome.
    listPendingRequests: async (viewer) => {
      requireRaazia(viewer);
      return dataRepository.listPendingCustomizationRequests();
    },

    getRequestForViewer: readRequestForViewer,

    getNegotiation: async (viewer, id) => {
      const request = await readRequestForViewer(viewer, id);
      const [quotation, entries] = await Promise.all([
        getQuotationReference(request),
        dataRepository.listNegotiationEntries(request.customization.id),
      ]);
      return { quotation, entries };
    },

    addNegotiationEntry: async (viewer, id, input) => {
      const request = await readRequestForViewer(viewer, id);
      if (request.status !== "PENDING") {
        throw customizationError(
          "Negotiation is only available while the request is pending.",
          409,
          "REQUEST_NOT_PENDING",
        );
      }

      // Proposer is derived from the signed-in viewer's role. Client-supplied
      // identity fields are rejected by the controller schema.
      const proposer = viewer.role === "RAAZIA" ? "RAAZIA" : "CUSTOMER";
      return dataRepository.createNegotiationEntry({
        customizationId: request.customization.id,
        proposer,
        proposedPrice: input.proposedPrice,
        note: input.note ?? null,
      });
    },

    // FR-10/FR-11: only Raazia records the decision. On acceptance this
    // component provides the accepted request details to Order Management;
    // the conditional status change and Order insert are one repository
    // transaction so a repeated click/retry cannot create a second Order.
    acceptRequest: async (viewer, id, input) => {
      requireRaazia(viewer);
      const request = await readRequestForViewer(viewer, id);
      if (request.status !== "PENDING") throw requestNotPending();

      let negotiatedPriceSnapshot = null;
      if (input.negotiationEntryId !== undefined && input.negotiationEntryId !== null) {
        const entries = await dataRepository.listNegotiationEntries(request.customization.id);
        const selected = entries.find((entry) => entry.id === input.negotiationEntryId);
        if (!selected) {
          throw customizationError(
            "The selected negotiation entry does not belong to this request.",
            400,
            "INVALID_NEGOTIATION_ENTRY",
          );
        }
        negotiatedPriceSnapshot = selected.proposedPrice;
      }

      requireOrderManagement();
      const order = await orderManagement.createConfirmedOrder({
        requestId: id,
        decision: REQUEST_DECISION_STATUSES.ACCEPTED,
        // The original Inquiry comes from persisted request data, never from
        // the request body.
        inquiryId: request.customization?.inquiryId ?? request.inquiry?.id,
        approvedPrice: input.approvedPrice,
        negotiatedPriceSnapshot,
      });

      return {
        requestId: id,
        status: REQUEST_DECISION_STATUSES.ACCEPTED,
        order,
      };
    },

    rejectRequest: async (viewer, id) => {
      requireRaazia(viewer);
      const request = await readRequestForViewer(viewer, id);
      if (request.status !== "PENDING") throw requestNotPending();

      const result = await dataRepository.decidePendingRequest({
        requestId: id,
        decision: REQUEST_DECISION_STATUSES.REJECTED,
      });
      return {
        requestId: result.request.id,
        status: result.request.status,
      };
    },

    getReferenceImageForViewer: async (viewer, imagePath) => {
      requireViewer(viewer);

      if (typeof imageStorage.getImage !== "function") {
        throw customizationError(
          "Reference image retrieval is not available.",
          503,
          "IMAGE_STORAGE_RETRIEVAL_NOT_AVAILABLE",
        );
      }

      const owner = await dataRepository.findCustomizationByReferenceImage(imagePath);
      if (!owner) throw imageNotFound();

      if (viewer.role === "RAAZIA") {
        const image = await imageStorage.getImage(imagePath);
        if (!image) throw imageNotFound();
        return image;
      }

      if (viewer.role === "CUSTOMER") {
        if (owner.inquiry?.customerId !== viewer.id) throw imageNotFound();
        const image = await imageStorage.getImage(imagePath);
        if (!image) throw imageNotFound();
        return image;
      }

      throw customizationError(
        "This operation is not permitted for this account.",
        403,
        "FORBIDDEN",
      );
    },
  };
}

const customizationAndQuotationManagement = createCustomizationAndQuotationManagement({
  repository,
});

export default customizationAndQuotationManagement;
export { createCustomizationAndQuotationManagement };
