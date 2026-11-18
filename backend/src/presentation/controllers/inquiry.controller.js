import { z } from "zod";

const inquiryIdSchema = z.string().uuid();

function badRequest(res, message, code = "VALIDATION_ERROR") {
  return res.status(400).json({ error: { code, message } });
}

function parseInquiryId(req, res) {
  const parsed = inquiryIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    badRequest(res, "Inquiry ID must be a valid UUID.", "INVALID_INQUIRY_ID");
    return null;
  }

  return parsed.data;
}

function createInquiryController(inquiryManagement) {
  return {
    list: async (_req, res) => {
      const inquiries = await inquiryManagement.listInquiries();
      res.json({ inquiries });
    },

    get: async (req, res) => {
      const id = parseInquiryId(req, res);
      if (!id) return;
      const inquiry = await inquiryManagement.getInquiryForViewer(req.authenticatedUser, id);
      res.json({ inquiry });
    },
  };
}

export { createInquiryController, inquiryIdSchema };
