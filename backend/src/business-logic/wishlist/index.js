import repository from "../../data-access/repositories/index.ts";
import productManagement from "../product/index.js";

function wishlistError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function requireCustomer(user) {
  if (!user || user.role !== "CUSTOMER" || typeof user.id !== "string" || !user.id) {
    throw wishlistError(
      "A signed-in Customer is required to manage a wishlist.",
      403,
      "WISHLIST_CUSTOMER_REQUIRED",
    );
  }
}

function toWishlistProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    images: product.images,
    basePrice: product.basePrice,
  };
}

function createWishlistManagement({
  repository: dataRepository,
  productManagement: products,
} = {}) {
  if (!dataRepository || !products) {
    throw new Error("Wishlist Management requires the centralized Repository and Product Management.");
  }

  async function saveWishlistItem(customer, productId) {
    requireCustomer(customer);
    const product = await products.getCatalogueProduct(productId);
    const result = await dataRepository.addWishlistItem({
      customerId: customer.id,
      productId: product.id,
    });

    return {
      item: { product: toWishlistProduct(product), createdAt: result.item.createdAt },
      created: result.created,
    };
  }

  return {
    addWishlistItem: saveWishlistItem,

    listWishlistItems: async (customer) => {
      requireCustomer(customer);
      const savedItems = await dataRepository.listWishlistItems(customer.id);
      const items = await Promise.all(savedItems.map(async (savedItem) => {
        try {
          const product = await products.getProduct(savedItem.productId);
          return { product: toWishlistProduct(product), createdAt: savedItem.createdAt };
        } catch (error) {
          if (error?.code === "PRODUCT_NOT_FOUND") return null;
          throw error;
        }
      }));

      return items.filter(Boolean);
    },

    removeWishlistItem: async (customer, productId) => {
      requireCustomer(customer);
      const removed = await dataRepository.removeWishlistItem({
        customerId: customer.id,
        productId,
      });
      if (!removed) {
        throw wishlistError(
          "This product is not in your wishlist.",
          404,
          "WISHLIST_ITEM_NOT_FOUND",
        );
      }
      return { removed: true };
    },

    isProductSaved: async (customer, productId) => {
      requireCustomer(customer);
      await products.getCatalogueProduct(productId);
      const item = await dataRepository.findWishlistItem(customer.id, productId);
      return { productId, saved: Boolean(item) };
    },

    addProduct: async (customer, productId) => {
      await saveWishlistItem(customer, productId);
      return { productId, saved: true };
    },
  };
}

const wishlistManagement = createWishlistManagement({
  repository,
  productManagement,
});

export default wishlistManagement;
export { createWishlistManagement };
