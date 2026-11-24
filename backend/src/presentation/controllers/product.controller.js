import { z } from "zod";

const productInputSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  description: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  images: z.array(z.string().trim().min(1, "Image references cannot be blank.")).optional().default([]),
  basePrice: z.number().int().positive("Standard Catalogue Price must be a positive whole-PKR amount."),
}).strict();

const productIdSchema = z.string().uuid();

function badRequest(res, message, code = "VALIDATION_ERROR") {
  return res.status(400).json({ error: { code, message } });
}

function parseProductBody(req, res) {
  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    badRequest(res, message);
    return null;
  }

  return parsed.data;
}

function parseProductId(req, res) {
  const parsed = productIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    badRequest(res, "Product ID must be a valid UUID.", "INVALID_PRODUCT_ID");
    return null;
  }

  return parsed.data;
}

function toPublicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    images: product.images,
    standardCataloguePrice: product.standardCataloguePrice,
    effectivePublicPrice: product.effectivePublicPrice,
    fixedDiscountAmount: product.fixedDiscountAmount,
  };
}

function createProductController(productManagement) {
  return {
    list: async (_req, res) => {
      const products = await productManagement.listProducts();
      res.json({ products });
    },

    get: async (req, res) => {
      const id = parseProductId(req, res);
      if (!id) return;
      const product = await productManagement.getProduct(id);
      res.json({ product });
    },

    create: async (req, res) => {
      const input = parseProductBody(req, res);
      if (!input) return;
      const product = await productManagement.createProduct(input);
      res.status(201).json({ product });
    },

    update: async (req, res) => {
      const id = parseProductId(req, res);
      if (!id) return;
      const input = parseProductBody(req, res);
      if (!input) return;
      const product = await productManagement.updateProduct(id, input);
      res.json({ product });
    },

    archive: async (req, res) => {
      const id = parseProductId(req, res);
      if (!id) return;
      const product = await productManagement.archiveProduct(id);
      res.json({ product });
    },
    listPublic: async (_req, res) => {
      const products = await productManagement.listCatalogue();
      res.json({ products: products.map(toPublicProduct) });
    },
    getPublic: async (req, res) => {
      const id = parseProductId(req, res);
      if (!id) return;
      const product = await productManagement.getCatalogueProduct(id);
      res.json({ product: toPublicProduct(product) });
    },
  };
}

export { createProductController, productInputSchema };
