import repository from "../../data-access/repositories/index.ts";

function validateStandardCataloguePrice(price) {
  if (!Number.isSafeInteger(price) || price <= 0) {
    const error = new Error("Standard Catalogue Price must be a positive whole-PKR amount.");
    error.status = 400;
    error.code = "INVALID_STANDARD_CATALOGUE_PRICE";
    throw error;
  }

  return price;
}

function pricingError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validateFixedDiscountAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw pricingError(
      "Fixed public discount must be a positive whole-PKR amount.",
      400,
      "INVALID_FIXED_DISCOUNT_AMOUNT",
    );
  }
  return amount;
}

function createPricingAndDiscountManagement({ repository }) {
  if (!repository) {
    throw new Error("Pricing and Discount Management requires the centralized Repository.");
  }

  async function getListedProducts() {
    return repository.listProducts({ includeArchived: false });
  }

  async function validateAgainstListedProducts(amount) {
    const listedProducts = await getListedProducts();
    if (listedProducts.length === 0) {
      throw pricingError(
        "A public sale cannot be activated until at least one Product is listed.",
        409,
        "NO_LISTED_PRODUCTS",
      );
    }

    const minimumPrice = Math.min(...listedProducts.map((product) => product.basePrice));
    if (amount >= minimumPrice) {
      throw pricingError(
        `Fixed public discount must be lower than every listed Product price. The minimum Standard Catalogue Price is PKR ${minimumPrice}.`,
        400,
        "PUBLIC_DISCOUNT_TOO_HIGH",
      );
    }
  }

  async function activateOrUpdatePublicDiscount(fixedDiscountAmount) {
    const amount = validateFixedDiscountAmount(fixedDiscountAmount);
    await validateAgainstListedProducts(amount);
    return repository.upsertPublicDiscount({
      active: true,
      fixedDiscountAmount: amount,
    });
  }

  async function removePublicDiscount() {
    return repository.upsertPublicDiscount({
      active: false,
      fixedDiscountAmount: null,
    });
  }

  async function getPublicPricingState() {
    const [discount, listedProducts] = await Promise.all([
      repository.getPublicDiscount(),
      getListedProducts(),
    ]);
    const active = Boolean(discount?.active && Number.isSafeInteger(discount.fixedDiscountAmount));
    const fixedDiscountAmount = active ? discount.fixedDiscountAmount : null;

    return {
      active,
      fixedDiscountAmount,
      products: listedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        images: product.images,
        isArchived: product.isArchived,
        ...publicPrice(product.basePrice, active ? fixedDiscountAmount : null),
      })),
    };
  }

  function publicPrice(standardCataloguePrice, fixedDiscountAmount) {
    return {
      standardCataloguePrice,
      effectivePublicPrice: fixedDiscountAmount == null
        ? standardCataloguePrice
        : standardCataloguePrice - fixedDiscountAmount,
      fixedDiscountAmount,
    };
  }

  async function addPublicPricing(products) {
    const discount = await repository.getPublicDiscount();
    const fixedDiscountAmount = discount?.active && Number.isSafeInteger(discount.fixedDiscountAmount)
      ? discount.fixedDiscountAmount
      : null;

    return products.map((product) => ({
      ...product,
      ...publicPrice(product.basePrice, fixedDiscountAmount),
    }));
  }

  async function validateStandardPriceUpdate(basePrice) {
    validateStandardCataloguePrice(basePrice);
    const discount = await repository.getPublicDiscount();
    if (discount?.active && Number.isSafeInteger(discount.fixedDiscountAmount)
      && basePrice <= discount.fixedDiscountAmount) {
      throw pricingError(
        "Standard Catalogue Price must remain higher than the active fixed public discount.",
        400,
        "STANDARD_PRICE_BELOW_ACTIVE_DISCOUNT",
      );
    }
  }

  return {
    validateStandardCataloguePrice,
    validateFixedDiscountAmount,
    activateOrUpdatePublicDiscount,
    removePublicDiscount,
    getPublicPricingState,
    addPublicPricing,
    validateStandardPriceUpdate,
  };
}

const pricingAndDiscountManagement = createPricingAndDiscountManagement({ repository });

export default pricingAndDiscountManagement;
export { validateStandardCataloguePrice, validateFixedDiscountAmount, createPricingAndDiscountManagement };
