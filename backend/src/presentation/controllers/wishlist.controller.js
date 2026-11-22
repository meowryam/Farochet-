import { z } from "zod";

const productIdSchema = z.string().uuid();
const addWishlistItemSchema = z.object({
  productId: productIdSchema,
}).strict();

function validationError(res, message, code) {
  return res.status(400).json({ error: { code, message } });
}

function parseProductId(req, res) {
  const parsed = productIdSchema.safeParse(req.params.productId);
  if (!parsed.success) {
    validationError(res, "Product ID must be a valid UUID.", "INVALID_PRODUCT_ID");
    return null;
  }
  return parsed.data;
}

function createWishlistController(wishlistManagement) {
  return {
    list: async (req, res) => {
      const items = await wishlistManagement.listWishlistItems(req.authenticatedUser);
      res.json({ items });
    },

    add: async (req, res) => {
      const parsed = addWishlistItemSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join(" ");
        return validationError(res, message, "VALIDATION_ERROR");
      }

      const result = await wishlistManagement.addWishlistItem(
        req.authenticatedUser,
        parsed.data.productId,
      );
      res.status(result.created ? 201 : 200).json({
        item: result.item,
        alreadySaved: !result.created,
      });
    },

    remove: async (req, res) => {
      const productId = parseProductId(req, res);
      if (!productId) return;

      await wishlistManagement.removeWishlistItem(req.authenticatedUser, productId);
      res.json({ removed: true });
    },
  };
}

export { addWishlistItemSchema, createWishlistController };
