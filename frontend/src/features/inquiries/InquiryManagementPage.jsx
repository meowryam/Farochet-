import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminInquiry,
  listAdminInquiries,
} from "../../services/api";

function CustomerIdentity({ inquiry }) {
  const displayName = typeof inquiry.customerName === "string" && inquiry.customerName.trim()
    ? inquiry.customerName.trim()
    : "Name unavailable";
  const email = typeof inquiry.customerEmail === "string" && inquiry.customerEmail.trim()
    ? inquiry.customerEmail.trim()
    : "Email unavailable";

  return (
    <div className="inquiry-customer-identity">
      <strong>{displayName}</strong>
      <p>{email}</p>
      <small>Customer ID: {inquiry.customerId}</small>
    </div>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function InquiryManagementPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
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
    void loadInquiries();
  }, [loadInquiries]);

  async function endSession() {
    setError("");
    try {
      await signOut();
      navigate("/admin/sign-in", { replace: true });
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not end the session.");
    }
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
    <AdminShell activeKey="inquiries" logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Customer Inquiries"
        description="Review saved inquiries and their linked catalogue context."
        action={
          <Button variant="outline" admin onClick={endSession}>
            Sign out
          </Button>
        }
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

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
                          <CustomerIdentity inquiry={inquiry} />
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
                    <CustomerIdentity inquiry={selectedInquiry} />
                  </div>
                  <div className="catalogue-form-wide">
                    <p>This is a saved Inquiry. It is not a Pending Order Request or confirmed Order.</p>
                  </div>
                </div>
              )}
            </Card>
          )}
      </div>
    </AdminShell>
  );
}
