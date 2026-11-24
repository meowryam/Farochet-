import { z } from "zod";

const productIdSchema = z.string().uuid();
<<<<<<< HEAD
const addWishlistItemSchema = z.object({
  productId: productIdSchema,
}).strict();

function validationError(res, message, code) {
  return res.status(400).json({ error: { code, message } });
}
=======
>>>>>>> 9a9ecf1 (c4m1)

function parseProductId(req, res) {
  const parsed = productIdSchema.safeParse(req.params.productId);
  if (!parsed.success) {
<<<<<<< HEAD
    validationError(res, "Product ID must be a valid UUID.", "INVALID_PRODUCT_ID");
=======
    res.status(400).json({
      error: { code: "INVALID_PRODUCT_ID", message: "Product ID must be a valid UUID." },
    });
>>>>>>> 9a9ecf1 (c4m1)
    return null;
  }
  return parsed.data;
}

function createWishlistController(wishlistManagement) {
  return {
<<<<<<< HEAD
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
=======
    checkProduct: async (req, res) => {
      const productId = parseProductId(req, res);
      if (!productId) return;
      const result = await wishlistManagement.isProductSaved(req.authenticatedUser, productId);
      res.json(result);
    },

    addProduct: async (req, res) => {
      const productId = parseProductId(req, res);
      if (!productId) return;
      const result = await wishlistManagement.addWishlistItem(req.authenticatedUser, productId);
      res.status(200).json(result);
>>>>>>> 9a9ecf1 (c4m1)
    },
  };
}

<<<<<<< HEAD
export { addWishlistItemSchema, createWishlistController };
=======
export { createWishlistController };
>>>>>>> 9a9ecf1 (c4m1)
