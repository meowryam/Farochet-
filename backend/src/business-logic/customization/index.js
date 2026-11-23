import repository from "../../data-access/repositories/index.ts";
import { createInMemoryImageStorage } from "../../data-access/storage/inMemoryImageStorage.js";

function customizationError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createCustomizationAndQuotationManagement({
  repository: dataRepository,
  imageStorage = createInMemoryImageStorage(),
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

      // The owner is always the authenticated viewer. Any client-supplied
      // customer identity is ignored and cannot be carried into persistence.
      const storedImages = await imageStorage.storeImages({
        customerId: viewer.id,
        images: input.referenceImages ?? [],
      });

      return dataRepository.createCustomizationRequest({
        inquiry: {
          customerId: viewer.id,
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

    getRequestForViewer: async (viewer, id) => {
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
