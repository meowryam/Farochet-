import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import TextArea from "../../components/ui/TextArea";
import TextField from "../../components/ui/TextField";
import ContentContainer from "../../components/layout/ContentContainer";
import CustomerShell from "../../components/layout/CustomerShell";
import PageHeader from "../../components/layout/PageHeader";
import CrochetFlower from "../../components/brand/CrochetFlower";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMyInquiry,
  listMyInquiries,
  listProducts,
  submitCustomerInquiry,
} from "../../services/api";

const MAX_INQUIRY_MESSAGE_LENGTH = 5000;

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CustomerInquiryPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const [products, setProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [catalogue, history] = await Promise.all([
        listProducts(),
        listMyInquiries(session?.access_token),
      ]);
      setProducts(catalogue);
      setInquiries(history);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your inquiries.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setValidationError("Please enter your inquiry.");
      return;
    }
    if (message.length > MAX_INQUIRY_MESSAGE_LENGTH) {
      setValidationError(`Please keep your inquiry to ${MAX_INQUIRY_MESSAGE_LENGTH.toLocaleString("en-PK")} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      const inquiry = await submitCustomerInquiry({
        productId: productId || null,
        message: message.trim(),
      }, session?.access_token);
      setSuccess(`Inquiry submitted${inquiry.id ? ` — reference ${inquiry.id}` : "."}`);
      setMessage("");
      setInquiries((current) => [inquiry, ...current]);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not submit your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((product) => product.id === productId);

  async function viewInquiry(id) {
    setDetailError("");
    setSelectedInquiry(null);
    setIsDetailLoading(true);
    try {
      setSelectedInquiry(await getMyInquiry(id, session?.access_token));
    } catch (detailLoadError) {
      setDetailError(
        detailLoadError instanceof Error
          ? detailLoadError.message
          : "Could not load inquiry details.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <CustomerShell>
      <ContentContainer className="customization-request-page">
        <PageHeader
          eyebrow="Customer"
          title="Submit an inquiry"
          description="Ask Raazia about product details, price, availability or customization."
          action={<a className="faro-button faro-button--outline faro-button--sm" href="/catalogue">Back to catalogue</a>}
        />

        {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}
        {success && <Alert tone="success" title="Inquiry submitted">{success}</Alert>}

        {selectedProduct && (
          <Alert tone="info" title="Related catalogue product">
            {selectedProduct.name}
          </Alert>
        )}

        <Card title="Your inquiry" description="The inquiry is retained separately and does not create an order.">
          <form onSubmit={handleSubmit} className="faro-form">
            {productId && !selectedProduct && !isLoading && (
              <TextField
                id="selectedProduct"
                label="Related product"
                value="This product reference could not be loaded"
                disabled
              />
            )}
            <TextArea
              id="inquiryMessage"
              name="inquiryMessage"
              label="Inquiry details"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required={false}
              error={validationError}
              helpText="Maximum 5,000 characters."
              placeholder="Tell us what you would like to know."
            />
            <Button type="submit" loading={submitting} disabled={submitting}>Submit inquiry</Button>
          </form>
        </Card>

        <Card
          title="My inquiries"
          description={isLoading ? "Loading your inquiries…" : `${inquiries.length} saved ${inquiries.length === 1 ? "inquiry" : "inquiries"}`}
        >
          {isLoading ? (
            <p className="catalogue-state" role="status">Loading your inquiries…</p>
          ) : inquiries.length === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="Submit an inquiry above to save it to your inquiry history."
              illustration={<CrochetFlower size={64} />}
            />
          ) : (
            <div className="inquiry-history-list">
              {inquiries.map((inquiry) => (
                <article className="inquiry-history-item" key={inquiry.id}>
                  <div>
                    <strong>{inquiry.productName ?? "General inquiry"}</strong>
                    <p>{formatDate(inquiry.createdAt)}</p>
                  </div>
                  <p>{inquiry.message}</p>
                  <div className="inquiry-history-item__actions">
                    <small>{inquiry.id}</small>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void viewInquiry(inquiry.id)}
                      loading={isDetailLoading}
                    >
                      View Details
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        {detailError && <Alert tone="error" title="Inquiry details could not be loaded">{detailError}</Alert>}
        {isDetailLoading && <p className="catalogue-state" role="status">Loading inquiry details…</p>}
        {selectedInquiry && (
          <Card title="Inquiry details" description={selectedInquiry.id}>
            <dl className="inquiry-detail-fields">
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(selectedInquiry.createdAt)}</dd>
              </div>
              <div>
                <dt>Related product</dt>
                <dd>{selectedInquiry.productName ?? "No linked product"}</dd>
              </div>
              <div>
                <dt>Original inquiry</dt>
                <dd>{selectedInquiry.message}</dd>
              </div>
            </dl>
          </Card>
        )}
      </ContentContainer>
    </CustomerShell>
  );
}
