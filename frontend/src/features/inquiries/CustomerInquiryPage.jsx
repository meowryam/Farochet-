import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [productError, setProductError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const [catalogueResult, historyResult] = await Promise.allSettled([
      listProducts(),
      listMyInquiries(session?.access_token),
    ]);

    if (catalogueResult.status === "fulfilled") {
      setProducts(catalogueResult.value);
      setProductError("");
    } else {
      setProductError(
        catalogueResult.reason instanceof Error
          ? catalogueResult.reason.message
          : "Could not load catalogue products.",
      );
    }

    if (historyResult.status === "fulfilled") {
      setInquiries(historyResult.value);
      setHistoryLoaded(true);
      setHistoryError("");
    } else {
      setHistoryLoaded(false);
      setHistoryError(
        historyResult.reason instanceof Error
          ? historyResult.reason.message
          : "Could not load your inquiries.",
      );
    }

    setIsLoading(false);
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
      setInquiries((current) => [
        inquiry,
        ...current.filter((savedInquiry) => savedInquiry.id !== inquiry.id),
      ]);
      setHistoryLoaded(true);
      setHistoryError("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not submit your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((product) => product.id === productId);

  return (
    <CustomerShell headerProps={{ currentPath: "/inquiries" }}>
      <ContentContainer className="customization-request-page">
        <PageHeader
          eyebrow="Customer"
          title="My inquiries"
          description="Review your inquiry history or ask Raazia about a product, price, availability or customization."
          action={<a className="faro-button faro-button--outline faro-button--sm" href="/catalogue">Back to catalogue</a>}
        />

        {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}
        {productError && (
          <Alert tone="error" title="Catalogue products could not be loaded">
            {productError}
          </Alert>
        )}
        {success && <Alert tone="success" title="Inquiry submitted">{success}</Alert>}

        {selectedProduct && (
          <Alert tone="info" title="Related catalogue product">
            {selectedProduct.name}
          </Alert>
        )}

        <Card title="Submit an inquiry" description="Your inquiry is retained separately and does not create an order.">
          <form id="inquiry-form" onSubmit={handleSubmit} className="faro-form">
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
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadPage()}
              loading={isLoading}
            >
              Refresh
            </Button>
          }
        >
          {isLoading ? (
            <p className="catalogue-state" role="status">Loading your inquiries…</p>
          ) : historyError && !historyLoaded ? (
            <div>
              <p role="alert">
                Your inquiry history could not be loaded. {historyError}
              </p>
              <Button variant="outline" onClick={() => void loadPage()}>Try again</Button>
            </div>
          ) : inquiries.length === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="Submit an inquiry above to save it to your inquiry history."
              illustration={<CrochetFlower size={64} />}
              action={
                <Link className="faro-button faro-button--outline" to="/inquiries#inquiry-form">
                  Submit an inquiry
                </Link>
              }
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
                    <small>Reference {inquiry.id}</small>
                    <Link
                      className="faro-button faro-button--outline faro-button--sm"
                      to={`/inquiries/${encodeURIComponent(inquiry.id)}`}
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </ContentContainer>
    </CustomerShell>
  );
}
