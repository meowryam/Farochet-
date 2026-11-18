import { useCallback, useEffect, useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import TextField from "../../components/ui/TextField";
import {
  clearAdminToken,
  getAdminInquiry,
  getAdminToken,
  listAdminInquiries,
  saveAdminToken,
} from "../../services/api";

const INQUIRY_NAV_ITEMS = [
  { label: "Products", href: "/admin/products", key: "products" },
  { label: "Inquiries", href: "/admin/inquiries", key: "inquiries" },
];

const CUSTOMER_CONTEXT_FALLBACK = "Customer name and email not available yet";

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function InquiryManagementPage() {
  const [token, setToken] = useState(() => getAdminToken());
  const [tokenInput, setTokenInput] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setInquiries(await listAdminInquiries());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load inquiries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void loadInquiries();
  }, [loadInquiries, token]);

  function connectLocalSession(event) {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      setError("Enter the local Raazia token configured in backend/.env.");
      return;
    }

    try {
      saveAdminToken(nextToken);
      setToken(nextToken);
      setTokenInput("");
      setError("");
    } catch {
      setError("The browser could not save this session token. Check session storage permissions.");
    }
  }

  function disconnectLocalSession() {
    clearAdminToken();
    setToken("");
    setInquiries([]);
    setSelectedInquiry(null);
    setError("");
  }

  async function openDetails(id) {
    setIsDetailLoading(true);
    setError("");
    setSelectedInquiry(null);
    try {
      setSelectedInquiry(await getAdminInquiry(id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load inquiry details.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <AdminShell activeKey="inquiries" navItems={INQUIRY_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Customer Inquiries"
        description="Review saved inquiries and their linked catalogue context."
        action={
          token ? (
            <Button variant="outline" admin onClick={disconnectLocalSession}>
              End local session
            </Button>
          ) : null
        }
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

      {!token ? (
        <Card title="Local Raazia session" description="Temporary development access until the centralized Supabase Auth slice is integrated.">
          <form className="catalogue-session-form" onSubmit={connectLocalSession}>
            <TextField
              id="local-raazia-token-inquiries"
              label="Development token"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              helpText="Use DEV_RAAZIA_TOKEN from backend/.env. The server assigns the RAAZIA role; do not enter a role or user ID."
              autoComplete="off"
            />
            <Button type="submit" admin>Connect</Button>
          </form>
        </Card>
      ) : (
        <div className="catalogue-admin-layout">
          <Card
            title="Saved inquiries"
            description={isLoading ? "Loading saved inquiries…" : `${inquiries.length} saved ${inquiries.length === 1 ? "inquiry" : "inquiries"}`}
            action={
              <Button variant="outline" size="sm" admin onClick={() => { void loadInquiries(); }} loading={isLoading}>
                Refresh
              </Button>
            }
          >
            {isLoading ? (
              <p className="catalogue-state" role="status">Loading inquiries…</p>
            ) : inquiries.length === 0 ? (
              <EmptyState
                title="No inquiries yet"
                description="Saved customer inquiries will appear here."
              />
            ) : (
              <div className="catalogue-table-wrap">
                <table className="catalogue-table">
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Date</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Related product</th>
                      <th scope="col">Message</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td>{inquiry.id}</td>
                        <td>{formatDate(inquiry.createdAt)}</td>
                        <td>
                          <div className="catalogue-product-summary">
                            <div>
                              <strong>{inquiry.customerId}</strong>
                              <p>{CUSTOMER_CONTEXT_FALLBACK}</p>
                            </div>
                          </div>
                        </td>
                        <td>{inquiry.productName ?? "No linked product"}</td>
                        <td>{inquiry.message}</td>
                        <td>
                          <div className="catalogue-row-actions">
                            <Button variant="ghost" size="sm" admin onClick={() => { void openDetails(inquiry.id); }}>
                              View details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {selectedInquiry && (
            <Card title="Inquiry details" description={selectedInquiry.id}>
              {isDetailLoading ? (
                <p className="catalogue-state" role="status">Loading inquiry…</p>
              ) : (
                <div className="catalogue-info-fields">
                  <div>
                    <strong>Date</strong>
                    <p>{formatDate(selectedInquiry.createdAt)}</p>
                  </div>
                  <div>
                    <strong>Related product</strong>
                    <p>{selectedInquiry.productName ?? "No linked product"}</p>
                  </div>
                  <div className="catalogue-form-wide">
                    <strong>Original message</strong>
                    <p>{selectedInquiry.message}</p>
                  </div>
                  <div className="catalogue-form-wide">
                    <strong>Customer context</strong>
                    <p>{selectedInquiry.customerId}</p>
                    <p>{CUSTOMER_CONTEXT_FALLBACK}</p>
                  </div>
                  <div className="catalogue-form-wide">
                    <p>This is a saved Inquiry. It is not a Pending Order Request or confirmed Order.</p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </AdminShell>
  );
}
