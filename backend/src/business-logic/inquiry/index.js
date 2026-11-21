import repository from "../../data-access/repositories/index.ts";

function inquiryError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toReviewInquiry(inquiry) {
  return {
    id: inquiry.id,
    customerId: inquiry.customerId,
    message: inquiry.message,
    createdAt: inquiry.createdAt,
    productName: inquiry.product?.name ?? null,
  };
}

function createInquiryManagement({ repository }) {
  if (!repository) {
    throw new Error("Inquiry Management requires the centralized Repository.");
  }

  return {
    submitInquiry: async () => {
      throw new Error("Inquiry Management is not implemented yet.");
    },

    listInquiries: async () => {
      const inquiries = await repository.listInquiries();
      return inquiries.map(toReviewInquiry);
    },

    getInquiryForViewer: async (viewer, id) => {
      if (!viewer) {
        throw inquiryError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }

      if (viewer.role !== "RAAZIA" && viewer.role !== "CUSTOMER") {
        throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
      }

      const inquiry = await repository.findInquiryById(id);

      if (!inquiry) {
        if (viewer.role === "CUSTOMER") {
          throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
        }
        throw inquiryError("Inquiry was not found.", 404, "INQUIRY_NOT_FOUND");
      }

      if (viewer.role === "CUSTOMER" && inquiry.customerId !== viewer.id) {
        throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
      }

      return toReviewInquiry(inquiry);
    },
  };
}

const inquiryManagement = createInquiryManagement({ repository });

export default inquiryManagement;
export { createInquiryManagement };
