import { z } from "zod";

const inquiryIdSchema = z.string().uuid();
const MAX_INQUIRY_MESSAGE_LENGTH = 5000;
const submitInquirySchema = z.object({
  productId: z.union([z.string().uuid(), z.null()]).optional(),
  message: z.string()
    .trim()
    .min(1, "Inquiry message is required.")
    .max(MAX_INQUIRY_MESSAGE_LENGTH, "Inquiry message must be 5,000 characters or fewer."),
}).strict();

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
    submit: async (req, res) => {
      const parsed = submitInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join(" ");
        return badRequest(res, message);
      }
      const inquiry = await inquiryManagement.submitInquiry(req.authenticatedUser, parsed.data);
      res.status(201).json({ inquiry });
    },

    listMyInquiries: async (req, res) => {
      const inquiries = await inquiryManagement.listMyInquiries(req.authenticatedUser);
      res.json({ inquiries });
    },

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

export { createInquiryController, inquiryIdSchema, submitInquirySchema };
