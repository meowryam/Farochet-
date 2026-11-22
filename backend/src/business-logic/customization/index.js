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

  return {
    recordCustomization: async (viewer, input) => {
      if (!viewer) {
        throw customizationError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
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
  };
}

const customizationAndQuotationManagement = createCustomizationAndQuotationManagement({
  repository,
});

export default customizationAndQuotationManagement;
export { createCustomizationAndQuotationManagement };
