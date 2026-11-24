import { z } from "zod";

const MAX_REFERENCE_IMAGES = 5;
const MAX_REFERENCE_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_NEGOTIATION_NOTE_LENGTH = 500;

const customizationIdSchema = z.string().uuid();

// strict() rejects client-supplied proposer, customerId, or any other field;
// the proposer is derived from the authenticated viewer's role.
const negotiationInputSchema = z.object({
  proposedPrice: z.number().refine(
    (value) => Number.isSafeInteger(value) && value > 0,
    "Proposed price must be a positive whole amount in PKR.",
  ),
  note: z.string()
    .trim()
    .max(MAX_NEGOTIATION_NOTE_LENGTH, `Note must be at most ${MAX_NEGOTIATION_NOTE_LENGTH} characters.`)
    .optional(),
}).strict();
const imagePathSchema = z.string().min(1);

const referenceImageSchema = z.object({
  name: z.string().trim().min(1, "Image name is required."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_REFERENCE_IMAGE_BYTES, "Each reference image must be at most 2 MB."),
  base64: z.string().min(1, "Image data is required."),
}).strict().superRefine((image, context) => {
  const decodedBytes = Buffer.from(image.base64, "base64").length;
  if (decodedBytes === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Image data is invalid.",
      path: ["base64"],
    });
  } else if (decodedBytes > MAX_REFERENCE_IMAGE_BYTES) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each reference image must be at most 2 MB.",
      path: ["base64"],
    });
  }
});

const customizationInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productType: z.string().trim().min(1, "Product type is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1."),
  size: z.string().trim().min(1).nullable().optional(),
  colour: z.string().trim().min(1).nullable().optional(),
  materials: z.string().trim().min(1).nullable().optional(),
  budget: z.string().trim().min(1).nullable().optional(),
  specialInstructions: z.string().trim().min(1).nullable().optional(),
  requiredCompletionDate: z.string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Required completion date must be a valid date.")
    .nullable()
    .optional(),
  deliveryAddress: z.string().trim().min(1).nullable().optional(),
  referenceImages: z.array(referenceImageSchema)
    .max(MAX_REFERENCE_IMAGES, "At most 5 reference images may be submitted.")
    .default([]),
}).strict();

function parseCustomizationBody(req, res) {
  const parsed = customizationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
    return null;
  }

  return parsed.data;
}

function parseCustomizationId(req, res) {
  const parsed = customizationIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return badRequestForCustomization(res, "Customization request ID must be a valid UUID.", "INVALID_CUSTOMIZATION_ID");
  }
  return parsed.data;
}

function parseNegotiationBody(req, res) {
  const parsed = negotiationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
    return null;
  }
  return parsed.data;
}

function parseImagePath(req, res) {
  const parsed = imagePathSchema.safeParse(req.query.path);
  if (!parsed.success) {
    return badRequestForCustomization(res, "A reference image path is required.", "INVALID_IMAGE_PATH");
  }
  return parsed.data;
}

function badRequestForCustomization(res, message, code) {
  return res.status(400).json({ error: { code, message } });
}

function createCustomizationController(customizationManagement) {
  return {
    submit: async (req, res) => {
      const input = parseCustomizationBody(req, res);
      if (!input) return;

      const result = await customizationManagement.recordCustomization(
        req.authenticatedUser,
        input,
      );
      return res.status(201).json(result);
    },

    list: async (req, res) => {
      const requests = await customizationManagement.listPendingRequests(req.authenticatedUser);
      return res.json({ requests });
    },

    get: async (req, res) => {
      const id = parseCustomizationId(req, res);
      if (!id) return;
      const request = await customizationManagement.getRequestForViewer(req.authenticatedUser, id);
      return res.json({ request });
    },

    getNegotiation: async (req, res) => {
      const id = parseCustomizationId(req, res);
      if (!id) return;
      const negotiation = await customizationManagement.getNegotiation(req.authenticatedUser, id);
      return res.json(negotiation);
    },

    addNegotiationEntry: async (req, res) => {
      const id = parseCustomizationId(req, res);
      if (!id) return;
      const input = parseNegotiationBody(req, res);
      if (!input) return;
      const entry = await customizationManagement.addNegotiationEntry(req.authenticatedUser, id, input);
      return res.status(201).json({ entry });
    },

    getImage: async (req, res) => {
      const imagePath = parseImagePath(req, res);
      if (!imagePath) return;
      const image = await customizationManagement.getReferenceImageForViewer(
        req.authenticatedUser,
        imagePath,
      );
      return res.json({ image });
    },
  };
}

export {
  createCustomizationController,
  customizationInputSchema,
  referenceImageSchema,
  negotiationInputSchema,
  customizationIdSchema,
  imagePathSchema,
};
