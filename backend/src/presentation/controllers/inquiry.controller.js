import { z } from "zod";

const inquiryIdSchema = z.string().uuid();
<<<<<<< HEAD
const MAX_INQUIRY_MESSAGE_LENGTH = 5000;
const submitInquirySchema = z.object({
  productId: z.union([z.string().uuid(), z.null()]).optional(),
  message: z.string()
    .trim()
    .min(1, "Inquiry message is required.")
    .max(MAX_INQUIRY_MESSAGE_LENGTH, "Inquiry message must be 5,000 characters or fewer."),
=======
const inquiryInputSchema = z.object({
  productId: z.string().uuid().optional(),
  message: z.string().trim().min(1, "Inquiry message is required."),
>>>>>>> 9a9ecf1 (c4m1)
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

function parseInquiryBody(req, res) {
  const parsed = inquiryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
    return null;
  }
  return parsed.data;
}

function createInquiryController(inquiryManagement) {
  return {
    submit: async (req, res) => {
<<<<<<< HEAD
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

=======
      const input = parseInquiryBody(req, res);
      if (!input) return;
      const inquiry = await inquiryManagement.submitInquiry(req.authenticatedUser, input);
      res.status(201).json({ inquiry });
    },

>>>>>>> 9a9ecf1 (c4m1)
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

<<<<<<< HEAD
export { createInquiryController, inquiryIdSchema, submitInquirySchema };
=======
export { createInquiryController, inquiryIdSchema, inquiryInputSchema };
>>>>>>> 9a9ecf1 (c4m1)
