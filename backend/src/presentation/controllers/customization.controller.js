import { z } from "zod";

const MAX_REFERENCE_IMAGES = 5;
const MAX_REFERENCE_IMAGE_BYTES = 2 * 1024 * 1024;

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
  };
}

export { createCustomizationController, customizationInputSchema, referenceImageSchema };
