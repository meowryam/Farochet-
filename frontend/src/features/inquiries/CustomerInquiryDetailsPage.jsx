import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ContentContainer from "../../components/layout/ContentContainer";
import CustomerShell from "../../components/layout/CustomerShell";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import { getMyInquiry } from "../../services/api";

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CustomerInquiryDetailsPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const [inquiry, setInquiry] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadInquiry = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setInquiry(null);
    try {
      setInquiry(await getMyInquiry(id, session?.access_token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load inquiry details.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    void loadInquiry();
  }, [loadInquiry]);

  return (
    <CustomerShell headerProps={{ currentPath: "/inquiries" }}>
      <ContentContainer className="customization-request-page">
        <PageHeader
          eyebrow="Customer"
          title="Inquiry details"
          description="Review the inquiry saved to your account."
          action={
            <Link className="faro-button faro-button--outline faro-button--sm" to="/inquiries">
              Back to my inquiries
            </Link>
          }
        />

        {isLoading ? (
          <p className="catalogue-state" role="status">Loading inquiry details…</p>
        ) : error ? (
          <Card title="Inquiry details unavailable">
            <Alert tone="error" title="Inquiry details could not be loaded">
              {error}
            </Alert>
            <Button variant="outline" onClick={() => void loadInquiry()}>
              Try again
            </Button>
          </Card>
        ) : inquiry ? (
          <Card title="Inquiry information" description={`Reference ${inquiry.id}`}>
            <dl className="inquiry-detail-fields">
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(inquiry.createdAt)}</dd>
              </div>
              <div>
                <dt>Related product</dt>
                <dd>{inquiry.productName ?? "No linked product"}</dd>
              </div>
              <div>
                <dt>Original inquiry</dt>
                <dd>{inquiry.message}</dd>
              </div>
            </dl>
          </Card>
        ) : null}
      </ContentContainer>
    </CustomerShell>
  );
}
