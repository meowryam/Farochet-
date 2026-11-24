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
  addAdminNegotiationEntry,
  getAdminCustomizationImage,
  getAdminCustomizationRequest,
  getAdminNegotiation,
  listAdminCustomizationRequests,
} from "../../services/api";
import NegotiationPanel from "./NegotiationPanel";

const REQUEST_NAV_ITEMS = [
  { label: "Products", href: "/admin/products", key: "products" },
  { label: "Availability", href: "/admin/availability", key: "availability" },
  { label: "Inquiries", href: "/admin/inquiries", key: "inquiries" },
  { label: "Requests", href: "/admin/customization-requests", key: "requests" },
  { label: "Orders", href: "/admin/orders", key: "orders" },
];

function formatDate(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function display(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default function CustomizationReviewPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [images, setImages] = useState({});
  const [negotiation, setNegotiation] = useState(null);
  const [isNegotiationLoading, setIsNegotiationLoading] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [negotiationError, setNegotiationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setRequests(await listAdminCustomizationRequests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

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
    setIsNegotiationLoading(true);
    setError("");
    setNegotiationError("");
    setSelectedRequest(null);
    setNegotiation(null);
    setImages({});
    try {
      const detail = await getAdminCustomizationRequest(id);
      setSelectedRequest(detail);
      const paths = detail?.customization?.referenceImages ?? [];
      const loaded = await Promise.all(paths.map(async (path) => [path, await getAdminCustomizationImage(path)]));
      setImages(Object.fromEntries(loaded));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load request details.");
    } finally {
      setIsDetailLoading(false);
    }

    try {
      setNegotiation(await getAdminNegotiation(id));
    } catch (loadError) {
      setNegotiationError(loadError instanceof Error ? loadError.message : "Could not load offers.");
    } finally {
      setIsNegotiationLoading(false);
    }
  }

  async function submitOffer(offer) {
    setIsSubmittingOffer(true);
    try {
      await addAdminNegotiationEntry(selectedRequest.id, offer);
      setNegotiation(await getAdminNegotiation(selectedRequest.id));
    } finally {
      setIsSubmittingOffer(false);
    }
  }

  const imagePaths = selectedRequest?.customization?.referenceImages ?? [];

  return (
    <AdminShell activeKey="requests" navItems={REQUEST_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Customization Requests"
        description="Inspect the information submitted with each pending custom-order request."
        action={
          <Button variant="outline" admin onClick={endSession}>
            Sign out
          </Button>
        }
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

      <div className="catalogue-admin-layout">
        <Card
          title="Pending requests"
          description={isLoading ? "Loading requests…" : `${requests.length} pending ${requests.length === 1 ? "request" : "requests"}`}
          action={
            <Button variant="outline" size="sm" admin onClick={() => { void loadRequests(); }} loading={isLoading}>
              Refresh
            </Button>
          }
        >
          {isLoading ? (
            <p className="catalogue-state" role="status">Loading requests…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="Submitted custom-order requests will appear here."
            />
          ) : (
            <div className="catalogue-table-wrap">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Product type</th>
                    <th scope="col">Stored status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>{display(request.inquiry?.customer?.displayName ?? request.inquiry?.customerId)}</td>
                      <td>{display(request.customization?.productType)}</td>
                      <td>{display(request.status)}</td>
                      <td>
                        <div className="catalogue-row-actions">
                          <Button variant="ghost" size="sm" admin onClick={() => { void openDetails(request.id); }}>
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

        {selectedRequest && (
          <Card title="Submitted request" description={selectedRequest.id}>
            {isDetailLoading ? (
              <p className="catalogue-state" role="status">Loading request…</p>
            ) : (
              <div className="catalogue-info-fields">
                <div>
                  <strong>Stored status</strong>
                  <p>{display(selectedRequest.status)}</p>
                </div>
                <div>
                  <strong>Customer</strong>
                  <p>{display(selectedRequest.inquiry?.customer?.displayName ?? selectedRequest.inquiry?.customerId)}</p>
                </div>
                <div className="catalogue-form-wide">
                  <strong>Original inquiry message</strong>
                  <p>{display(selectedRequest.inquiry?.message)}</p>
                </div>
                <div>
                  <strong>Product type</strong>
                  <p>{display(selectedRequest.customization?.productType)}</p>
                </div>
                <div>
                  <strong>Size</strong>
                  <p>{display(selectedRequest.customization?.size)}</p>
                </div>
                <div>
                  <strong>Colour</strong>
                  <p>{display(selectedRequest.customization?.colour)}</p>
                </div>
                <div>
                  <strong>Materials</strong>
                  <p>{display(selectedRequest.customization?.materials)}</p>
                </div>
                <div>
                  <strong>Quantity</strong>
                  <p>{display(selectedRequest.customization?.quantity)}</p>
                </div>
                <div>
                  <strong>Budget</strong>
                  <p>{display(selectedRequest.customization?.budget)}</p>
                </div>
                <div>
                  <strong>Required completion date</strong>
                  <p>{selectedRequest.customization?.requiredCompletionDate
                    ? formatDate(selectedRequest.customization.requiredCompletionDate)
                    : "—"}</p>
                </div>
                <div className="catalogue-form-wide">
                  <strong>Special instructions</strong>
                  <p>{display(selectedRequest.customization?.specialInstructions)}</p>
                </div>
                <div className="catalogue-form-wide">
                  <strong>Delivery address</strong>
                  <p>{display(selectedRequest.customization?.deliveryAddress)}</p>
                </div>
                <div className="catalogue-form-wide">
                  <strong>Reference images</strong>
                  {imagePaths.length === 0 ? (
                    <p>No reference images submitted.</p>
                  ) : (
                    <div className="catalogue-product-grid">
                      {imagePaths.map((path) => (
                        images[path] ? (
                          <img
                            key={path}
                            src={`data:${images[path].contentType};base64,${images[path].base64}`}
                            alt={images[path].name || "Custom-order reference"}
                            className="catalogue-product-image"
                          />
                        ) : null
                      ))}
                    </div>
                  )}
                </div>
                <div className="catalogue-form-wide">
                  <p>This is a Pending Order Request. It is not a confirmed Order.</p>
                </div>
                <div className="catalogue-form-wide">
                  {isNegotiationLoading ? (
                    <p className="catalogue-state" role="status">Loading offers…</p>
                  ) : (
                    <NegotiationPanel
                      negotiation={negotiation}
                      onSubmit={submitOffer}
                      isSubmitting={isSubmittingOffer}
                      error={negotiationError}
                      admin
                      idPrefix="admin-negotiation"
                    />
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
