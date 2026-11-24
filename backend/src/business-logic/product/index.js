import repository from "../../data-access/repositories/index.ts";
import pricingAndDiscountManagement from "../pricing/index.js";

function productError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeProductInput(input, pricingAndDiscountManagement) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw productError("Product information is required.", 400, "INVALID_PRODUCT");
  }

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw productError("Product name is required.", 400, "PRODUCT_NAME_REQUIRED");
  }

  if (input.description != null && typeof input.description !== "string") {
    throw productError("Product description must be text.", 400, "INVALID_PRODUCT_DESCRIPTION");
  }

  if (input.category != null && typeof input.category !== "string") {
    throw productError("Product category must be text.", 400, "INVALID_PRODUCT_CATEGORY");
  }

  const images = input.images ?? [];
  if (!Array.isArray(images) || images.some((image) => typeof image !== "string" || image.trim().length === 0)) {
    throw productError("Product images must be non-empty image references.", 400, "INVALID_PRODUCT_IMAGES");
  }

  const basePrice = pricingAndDiscountManagement.validateStandardCataloguePrice(input.basePrice);

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    images: images.map((image) => image.trim()),
    basePrice,
  };
}

function productNotFound() {
  return productError("Product was not found.", 404, "PRODUCT_NOT_FOUND");
}

function archivedProduct() {
  return productError("Archived products cannot be edited.", 409, "PRODUCT_ARCHIVED");
}

function createProductManagement({ repository, pricingAndDiscountManagement }) {
  if (!repository || !pricingAndDiscountManagement) {
    throw new Error("Product Management requires the centralized Repository and Pricing Management.");
  }

  return {
    listProducts: async () => repository.listProducts({ includeArchived: true }),

    listCatalogue: async () => {
      const products = await repository.listProducts({ includeArchived: false });
      return pricingAndDiscountManagement.addPublicPricing(products);
    },

    getCatalogueProduct: async (id) => {
      const product = await repository.findProductById(id);
      if (!product || product.isArchived) throw productNotFound();
      const [pricedProduct] = await pricingAndDiscountManagement.addPublicPricing([product]);
      return pricedProduct;
    },

    getProduct: async (id) => {
      const product = await repository.findProductById(id);
      if (!product) throw productNotFound();
      return product;
    },

    createProduct: async (input) => {
      const product = normalizeProductInput(input, pricingAndDiscountManagement);
      await pricingAndDiscountManagement.validateStandardPriceUpdate(product.basePrice);
      return repository.createProduct(product);
    },

    updateProduct: async (id, input) => {
      const existing = await repository.findProductById(id);
      if (!existing) throw productNotFound();
      if (existing.isArchived) throw archivedProduct();

      const product = normalizeProductInput(input, pricingAndDiscountManagement);
      await pricingAndDiscountManagement.validateStandardPriceUpdate(product.basePrice);
      return repository.updateProduct(id, product);
    },

    archiveProduct: async (id) => {
      const existing = await repository.findProductById(id);
      if (!existing) throw productNotFound();
      if (existing.isArchived) return existing;
      return repository.archiveProduct(id);
    },

    seedProducts: async (inputs) => {
      if (!Array.isArray(inputs)) {
        throw productError("Product seed data must be an array.", 400, "INVALID_PRODUCT_SEEDS");
      }

      const products = inputs.map((input) =>
        normalizeProductInput(input, pricingAndDiscountManagement),
      );
      return repository.seedProducts(products);
    },
  };
}

const productManagement = createProductManagement({
  repository,
  pricingAndDiscountManagement,
});

export default productManagement;
export { createProductManagement };
