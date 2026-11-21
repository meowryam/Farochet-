import repository from "../../data-access/repositories/index.js";

function availabilityError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createAvailabilityManagement({ repository }) {
  if (!repository) {
    throw new Error("Availability Management requires the centralized Repository.");
  }

  return {
    getAvailability: async () => repository.getAvailability(),

    updateAvailability: async (input) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw availabilityError("Availability information is required.", 400, "INVALID_AVAILABILITY");
      }

      if (typeof input.information !== "string" || input.information.trim().length === 0) {
        throw availabilityError(
          "Availability information is required.",
          400,
          "AVAILABILITY_INFORMATION_REQUIRED",
        );
      }

      if (input.information.trim().length > 2000) {
        throw availabilityError(
          "Availability information cannot exceed 2000 characters.",
          400,
          "AVAILABILITY_INFORMATION_TOO_LONG",
        );
      }

      return repository.upsertAvailability(input.information.trim());
    },
  };
}

const availabilityManagement = createAvailabilityManagement({ repository });

export default availabilityManagement;
export { createAvailabilityManagement };
