import { z } from "zod";

const availabilityInputSchema = z.object({
  information: z.string().trim().min(1, "Availability information is required.")
    .max(2000, "Availability information cannot exceed 2000 characters."),
}).strict();

function createAvailabilityController(availabilityManagement) {
  return {
    get: async (_req, res) => {
      const availability = await availabilityManagement.getAvailability();
      res.json({ availability });
    },

    update: async (req, res) => {
      const parsed = availabilityInputSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join(" ");
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message },
        });
      }

      const availability = await availabilityManagement.updateAvailability(parsed.data);
      res.json({ availability });
    },
  };
}

export { availabilityInputSchema, createAvailabilityController };
