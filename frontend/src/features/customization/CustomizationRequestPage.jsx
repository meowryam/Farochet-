import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import ContentContainer from "../../components/layout/ContentContainer";
import CustomerShell from "../../components/layout/CustomerShell";
import PageHeader from "../../components/layout/PageHeader";
import { getPublicProduct, submitCustomizationRequest } from "../../services/api";

const INITIAL_FORM = {
  productType: "",
  quantity: "1",
  size: "",
  colour: "",
  materials: "",
  budget: "",
  specialInstructions: "",
  requiredCompletionDate: "",
  deliveryAddress: "",
};

function optional(value) {
  return value === "" ? null : value;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({
        name: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function CustomizationRequestPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProductLoading(false);
      setProductError("");
      return undefined;
    }

    let active = true;
    setProductLoading(true);
    setProductError("");
    getPublicProduct(productId)
      .then((product) => {
        if (active) {
          setForm((current) => ({
            ...current,
            productType: current.productType || product.name,
          }));
        }
      })
      .catch((loadError) => {
        if (active) setProductError(loadError.message);
      })
      .finally(() => {
        if (active) setProductLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  function update(field) {
    return (event) => {
      const value = field === "quantity" && event.target.value !== ""
        ? Number(event.target.value)
        : event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);

    try {
      const referenceImages = await Promise.all(Array.from(files).map(readImage));
      const submission = await submitCustomizationRequest({
        ...(productId ? { productId } : {}),
        productType: form.productType,
        quantity: form.quantity,
        size: optional(form.size),
        colour: optional(form.colour),
        materials: optional(form.materials),
        budget: optional(form.budget),
        specialInstructions: optional(form.specialInstructions),
        requiredCompletionDate: optional(form.requiredCompletionDate),
        deliveryAddress: optional(form.deliveryAddress),
        referenceImages,
      });
      setResult(submission);
      setForm(INITIAL_FORM);
      setFiles([]);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not submit the request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerShell>
      <ContentContainer className="customization-request-page">
        <PageHeader
          eyebrow="Customer"
          title="Request a custom piece"
          description="Tell Raazia what you have in mind. Your request stays pending until she reviews it."
        />

        <Card
          title="Custom order details"
          description="Product type and quantity are required. Everything else is optional."
        >
          {error && <Alert tone="error">{error}</Alert>}
          {productError && (
            <Alert tone="error" title="The selected product is no longer available">
              {productError}
            </Alert>
          )}
          {result && (
            <Alert tone="success" title="Request submitted">
              Your request is recorded as pending for review.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="faro-form">
            <TextField
              id="productType"
              name="productType"
              label="Product type"
              value={form.productType}
              onChange={update("productType")}
              required
            />
            <TextField
              id="quantity"
              name="quantity"
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={update("quantity")}
              required
            />
            <TextField id="size" name="size" label="Size" value={form.size} onChange={update("size")} />
            <TextField id="colour" name="colour" label="Colour" value={form.colour} onChange={update("colour")} />
            <TextField id="materials" name="materials" label="Materials" value={form.materials} onChange={update("materials")} />
            <TextField id="budget" name="budget" label="Budget" value={form.budget} onChange={update("budget")} />
            <TextArea
              id="specialInstructions"
              name="specialInstructions"
              label="Special instructions"
              value={form.specialInstructions}
              onChange={update("specialInstructions")}
              helpText="These instructions are also saved as your originating inquiry message."
            />
            <TextField
              id="requiredCompletionDate"
              name="requiredCompletionDate"
              label="Required completion date"
              type="date"
              value={form.requiredCompletionDate}
              onChange={update("requiredCompletionDate")}
            />
            <TextField
              id="deliveryAddress"
              name="deliveryAddress"
              label="Delivery address"
              value={form.deliveryAddress}
              onChange={update("deliveryAddress")}
            />

            <div className="faro-field">
              <label className="faro-field__label" htmlFor="referenceImages">Reference images</label>
              <input
                id="referenceImages"
                name="referenceImages"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => setFiles(event.target.files ?? [])}
              />
              <span className="faro-field__help">
                JPG, PNG or WebP; at most 5 images of 2 MB each.
              </span>
            </div>

            <Button type="submit" loading={submitting || productLoading} disabled={Boolean(productError)}>
              Submit request
            </Button>
          </form>
        </Card>
      </ContentContainer>
    </CustomerShell>
  );
}
