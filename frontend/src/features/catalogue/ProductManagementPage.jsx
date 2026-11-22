import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import TextArea from "../../components/ui/TextArea";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../contexts/AuthContext";
import {
  archiveAdminProduct,
  createAdminProduct,
  getPublicPricing,
  listAdminProducts,
  removeAdminPublicDiscount,
  setAdminPublicDiscount,
  updateAdminProduct,
} from "../../services/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  images: "",
  basePrice: "",
};

const PRODUCT_NAV_ITEMS = [{ label: "Products", href: "/admin/products", key: "products" }];

function imageSource(reference) {
  if (reference.startsWith("/") && !reference.startsWith("//")) return reference;
  try {
    const url = new URL(reference);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

function ProductImage({ source }) {
  const [failed, setFailed] = useState(false);

  if (!source || failed) {
    return (
      <div className="catalogue-product-image catalogue-product-image--empty" aria-hidden="true">
        Image
      </div>
    );
  }

  return <img src={source} alt="" className="catalogue-product-image" onError={() => setFailed(true)} />;
}

export default function ProductManagementPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [publicPricing, setPublicPricing] = useState({
    active: false,
    fixedDiscountAmount: null,
    products: [],
  });
  const [discountAmount, setDiscountAmount] = useState("");
  const [isDiscountSaving, setIsDiscountSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [loadedProducts, loadedPricing] = await Promise.all([
        listAdminProducts(),
        getPublicPricing(),
      ]);
      setProducts(loadedProducts);
      setPublicPricing(loadedPricing);
      setDiscountAmount(
        loadedPricing.fixedDiscountAmount == null
          ? ""
          : String(loadedPricing.fixedDiscountAmount),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function endSession() {
    setError("");
    try {
      await signOut();
      navigate("/admin/sign-in", { replace: true });
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not end the session.");
    }
  }

  function startEditing(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "",
      images: product.images.join("\n"),
      basePrice: String(product.basePrice),
    });
    setNotice("");
    setError("");
    setIsFormOpen(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  }

  async function submitProduct(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      images: form.images.split(/\r?\n/).map((image) => image.trim()).filter(Boolean),
      basePrice: Number(form.basePrice),
    };

    try {
      if (editingId) {
        await updateAdminProduct(editingId, payload);
        setNotice("Product information saved.");
      } else {
        await createAdminProduct(payload);
        setNotice("Product added to the catalogue.");
      }
      resetForm();
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save product information.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeProduct(product) {
    const confirmed = window.confirm(
      `Remove "${product.name}" from the catalogue? Its record will be retained for historical references.`,
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    try {
      await archiveAdminProduct(product.id);
      setNotice(`${product.name} was removed from the catalogue. Its record was retained.`);
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not remove this product.");
    }
  }

  async function savePublicDiscount(event) {
    event.preventDefault();
    setIsDiscountSaving(true);
    setError("");
    setNotice("");

    const parsedAmount = Number(discountAmount);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setError("Fixed public discount must be a positive whole-PKR amount.");
      setIsDiscountSaving(false);
      return;
    }

    try {
      const result = await setAdminPublicDiscount(parsedAmount);
      setPublicPricing({
        active: result.active,
        fixedDiscountAmount: result.fixedDiscountAmount,
        products: result.products,
      });
      setNotice("Public sale discount saved.");
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the public sale discount.");
    } finally {
      setIsDiscountSaving(false);
    }
  }

  async function endPublicSale() {
    setIsDiscountSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await removeAdminPublicDiscount();
      setPublicPricing({
        active: result.active,
        fixedDiscountAmount: result.fixedDiscountAmount,
        products: result.products,
      });
      setDiscountAmount("");
      setNotice("Public sale ended.");
      await loadProducts();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not end the public sale.");
    } finally {
      setIsDiscountSaving(false);
    }
  }

  return (
    <AdminShell activeKey="products" navItems={PRODUCT_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Product Management"
        description="Maintain product information and Standard Catalogue Prices."
        action={
          <div className="catalogue-header-actions">
            <Button admin onClick={() => { resetForm(); setIsFormOpen(true); }}>
              Add Product
            </Button>
            <Button variant="outline" admin onClick={endSession}>
              Sign out
            </Button>
          </div>
        }
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="catalogue-admin-layout">
          <form className="catalogue-product-form" onSubmit={savePublicDiscount}>
            <Card
              title="Public Sale / Discount Management"
              description="One fixed whole-PKR discount is applied uniformly to every listed product."
            >
              <div className="catalogue-info-fields">
                <div className="faro-field">
                  <label className="faro-field__label">Sale status</label>
                  <strong>{publicPricing.active ? "Active" : "Inactive"}</strong>
                  {publicPricing.active && (
                    <span className="faro-field__help">
                      Fixed discount: {formatPrice(publicPricing.fixedDiscountAmount)}
                    </span>
                  )}
                </div>
                <div className="faro-field">
                  <label className="faro-field__label" htmlFor="public-discount-amount">
                    Fixed discount amount (PKR)
                  </label>
                  <input
                    id="public-discount-amount"
                    className="faro-field__control"
                    type="number"
                    min="1"
                    step="1"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    required
                  />
                  <span className="faro-field__help">
                    Must be positive, whole-PKR, and lower than every listed Standard Catalogue Price.
                  </span>
                </div>
              </div>
              <div className="catalogue-form-actions">
                {publicPricing.active && (
                  <Button
                    variant="outline"
                    admin
                    type="button"
                    onClick={endPublicSale}
                    disabled={isDiscountSaving}
                  >
                    End sale
                  </Button>
                )}
                <Button type="submit" admin loading={isDiscountSaving}>
                  {publicPricing.active ? "Update discount" : "Activate sale"}
                </Button>
              </div>
            </Card>
          </form>

          {isFormOpen && (
            <form className="catalogue-product-form" onSubmit={submitProduct}>
              <Card title={editingId ? "Edit product information" : "Product information"}>
                <div className="catalogue-info-fields">
                  <TextField
                    id="product-name"
                    name="name"
                    label="Product name"
                    value={form.name}
                    onChange={updateField}
                    required
                  />
                  <TextField
                    id="product-category"
                    name="category"
                    label="Category"
                    value={form.category}
                    onChange={updateField}
                  />
                  <div className="catalogue-form-wide">
                    <TextArea
                      id="product-description"
                      name="description"
                      label="Description"
                      value={form.description}
                      onChange={updateField}
                      rows={4}
                    />
                  </div>
                  <div className="catalogue-form-wide">
                    <TextArea
                      id="product-images"
                      name="images"
                      label="Image references"
                      value={form.images}
                      onChange={updateField}
                      helpText="Enter one existing image reference per line. This form does not upload files or select a storage provider."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
              <Card
                title="Pricing & Discount Management"
                description="Maintain the Standard Catalogue Price separately from any public discount or order-specific price."
              >
                <div className="faro-field">
                  <label className="faro-field__label" htmlFor="product-base-price">
                    Standard Catalogue Price (PKR) *
                  </label>
                  <input
                    id="product-base-price"
                    className="faro-field__control"
                    name="basePrice"
                    type="number"
                    min="1"
                    step="1"
                    value={form.basePrice}
                    onChange={updateField}
                    required
                  />
                  <span className="faro-field__help">Enter a positive whole number of rupees. Public discounts are managed separately.</span>
                </div>
              </Card>
              <div className="catalogue-form-actions">
                {editingId && (
                  <Button variant="outline" admin onClick={resetForm} disabled={isSaving}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" admin loading={isSaving}>
                  {editingId ? "Save changes" : "Add product"}
                </Button>
              </div>
            </form>
          )}

          <Card
            title="Catalogue products"
            description={isLoading ? "Loading saved products…" : `${products.length} saved product${products.length === 1 ? "" : "s"}`}
            action={
              <Button variant="outline" size="sm" admin onClick={loadProducts} loading={isLoading}>
                Refresh
              </Button>
            }
          >
            {isLoading ? (
              <p className="catalogue-state" role="status">Loading products…</p>
            ) : products.length === 0 ? (
              <EmptyState
                title="No products yet"
                description="Add a product to begin maintaining the catalogue."
                action={
                  <Button admin onClick={() => setIsFormOpen(true)}>
                    Add Product
                  </Button>
                }
              />
            ) : (
              <div className="catalogue-table-wrap">
                <table className="catalogue-table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Category</th>
                      <th scope="col">Standard Catalogue Price</th>
                      <th scope="col">Effective Public Price</th>
                      <th scope="col">Catalogue record</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const source = product.images.map(imageSource).find(Boolean);
                      const pricedProduct = publicPricing.products.find((item) => item.id === product.id);
                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="catalogue-product-summary">
                              <ProductImage key={`${product.id}:${source ?? "empty"}`} source={source} />
                              <div>
                                <strong>{product.name}</strong>
                                {product.description && <p>{product.description}</p>}
                              </div>
                            </div>
                          </td>
                          <td>{product.category || "Not provided"}</td>
                          <td>{formatPrice(product.basePrice)}</td>
                          <td>
                            {formatPrice(pricedProduct?.effectivePublicPrice ?? product.basePrice)}
                          </td>
                          <td>
                            <span className={`catalogue-record-badge ${product.isArchived ? "is-archived" : ""}`}>
                              {product.isArchived ? "Archived" : "Listed"}
                            </span>
                          </td>
                          <td>
                            <div className="catalogue-row-actions">
                              {!product.isArchived && (
                                <>
                                  <Button variant="ghost" size="sm" admin onClick={() => startEditing(product)}>
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" admin onClick={() => removeProduct(product)}>
                                    Remove
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
      </div>
    </AdminShell>
  );
}
