import { useCallback, useEffect, useState } from "react";
import CustomerShell from "../components/layout/CustomerShell";
import ContentContainer from "../components/layout/ContentContainer";
import PageHeader from "../components/layout/PageHeader";
import FloralSprig from "../components/brand/FloralSprig";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import { API_BASE_URL, checkBackendHealth } from "../services/api";

const SHELL_LINKS = [{ label: "Foundation", href: "/" }];

export default function BootstrapStatusPage() {
  const [health, setHealth] = useState({ state: "idle", data: null, error: null });

  const runHealthCheck = useCallback(async () => {
    setHealth({ state: "loading", data: null, error: null });

    try {
      const data = await checkBackendHealth();
      setHealth({ state: "connected", data, error: null });
    } catch (error) {
      setHealth({
        state: "unavailable",
        data: null,
        error: error instanceof Error ? error.message : "Unknown connection error.",
      });
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const isChecking = health.state === "loading" || health.state === "idle";
  const isConnected = health.state === "connected";

  return (
    <CustomerShell
      headerProps={{ links: SHELL_LINKS, currentPath: "/", accountHref: "/", wishlistHref: "/" }}
      footerProps={{
        catalogueHref: "/",
        customRequestHref: "/",
        inquiryHref: "/",
        wishlistHref: "/",
      }}
    >
      <ContentContainer className="bootstrap-page">
        <PageHeader
          eyebrow="Bootstrap"
          title="Raazia Management System"
          description="The application foundation is running. Business feature screens are intentionally not implemented in this milestone."
          action={<FloralSprig width={88} />}
        />

        <div className="bootstrap-stack">
          <Card
            title="Backend connection"
            description="Confirms that the React frontend can reach the Express health endpoint."
            action={
              <Button variant="outline" onClick={runHealthCheck} loading={isChecking}>
                Check again
              </Button>
            }
          >
            <div className="bootstrap-status">
              {isChecking && <StatusBadge label="Checking" tone="active" />}
              {isConnected && <StatusBadge label="Connected" tone="success" />}
              {health.state === "unavailable" && <StatusBadge label="Unavailable" tone="danger" />}
              <span className="bootstrap-detail">API base URL: {API_BASE_URL}</span>
            </div>

            {isConnected && (
              <p className="bootstrap-detail">
                Service: {health.data?.service ?? "unknown"} | Status: {health.data?.status ?? "unknown"}
              </p>
            )}

            {health.state === "unavailable" && (
              <Alert tone="error" title="Backend unavailable">
                {health.error} Start the backend with <code>npm run dev</code> from <code>backend/</code> and check
                again.
              </Alert>
            )}
          </Card>

          <Card title="Bootstrap scope">
            <ul className="bootstrap-list">
              <li>React, Vite, React Router, and the Farochet UI Kit are integrated.</li>
              <li>Express exposes the health endpoint used by this page.</li>
              <li>Prisma Client is centralized behind the Repository; Supabase credentials are not configured yet.</li>
              <li>Business features (catalogue, inquiries, quotations, orders, wishlists) remain out of scope for Bootstrap.</li>
            </ul>
          </Card>
        </div>
      </ContentContainer>
    </CustomerShell>
  );
}
