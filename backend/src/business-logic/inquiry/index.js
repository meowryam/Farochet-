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

function toAdminInquiry(inquiry) {
  const displayName = inquiry.customer?.displayName;
  const email = inquiry.customer?.email;

  return {
    ...toReviewInquiry(inquiry),
    customerName: typeof displayName === "string" && displayName.trim() ? displayName.trim() : null,
    customerEmail: typeof email === "string" && email.trim() ? email.trim() : null,
  };
}

function createInquiryManagement({ repository }) {
  if (!repository) {
    throw new Error("Inquiry Management requires the centralized Repository.");
  }

  return {
    submitInquiry: async (viewer, data) => {
      if (!viewer) {
        throw inquiryError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
      if (viewer.role !== "CUSTOMER") {
        throw inquiryError("Only customers can submit inquiries.", 403, "FORBIDDEN");
      }
      if (!data?.message || typeof data.message !== "string" || data.message.trim().length === 0) {
        throw inquiryError("Inquiry message is required.", 400, "VALIDATION_ERROR");
      }

      if (data.productId) {
        const product = await repository.findProductById(data.productId);
        if (!product) {
          throw inquiryError("The selected product was not found.", 404, "PRODUCT_NOT_FOUND");
        }
        if (product.isArchived) {
          throw inquiryError("The selected product is not available for inquiries.", 404, "PRODUCT_NOT_FOUND");
        }
      }

      const inquiry = await repository.createInquiry({
        customerId: viewer.id,
        productId: data.productId ?? null,
        message: data.message.trim(),
      });
      return toReviewInquiry(inquiry);
    },

    listMyInquiries: async (viewer) => {
      if (!viewer) {
        throw inquiryError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }
      if (viewer.role !== "CUSTOMER") {
        throw inquiryError("This operation is not permitted for this account.", 403, "FORBIDDEN");
      }
      const inquiries = await repository.listInquiriesByCustomer(viewer.id);
      return inquiries.map(toReviewInquiry);
    },

    listInquiries: async () => {
      const inquiries = await repository.listInquiries();
      return inquiries.map(toAdminInquiry);
    },

    getInquiryForViewer: async (viewer, id) => {
      if (!viewer) {
        throw inquiryError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED");
      }

      if (viewer.role !== "RAAZIA" && viewer.role !== "CUSTOMER") {
        throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
      }

      const inquiry = viewer.role === "RAAZIA"
        ? await repository.findAdminInquiryById(id)
        : await repository.findInquiryById(id);

      if (!inquiry) {
        if (viewer.role === "CUSTOMER") {
          throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
        }
        throw inquiryError("Inquiry was not found.", 404, "INQUIRY_NOT_FOUND");
      }

      if (viewer.role === "CUSTOMER" && inquiry.customerId !== viewer.id) {
        throw inquiryError("This inquiry is not available to this account.", 403, "INQUIRY_ACCESS_DENIED");
      }

      return viewer.role === "RAAZIA"
        ? toAdminInquiry(inquiry)
        : toReviewInquiry(inquiry);
    },
  };
}

const inquiryManagement = createInquiryManagement({ repository });

export default inquiryManagement;
export { createInquiryManagement };
