import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminManufacturingProgress,
  updateAdminPaymentStatus,
} from "../../services/api";

const ORDER_NAV_ITEMS = [
  { label: "Products", href: "/admin/products", key: "products" },
  { label: "Inquiries", href: "/admin/inquiries", key: "inquiries" },
  { label: "Orders", href: "/admin/orders", key: "orders" },
];

function formatDate(value) {
  if (!value) return "Not yet provided";
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function OrderManagementPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [manufacturingStatus, setManufacturingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setOrders(await listAdminOrders());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load confirmed orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

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
    setError("");
    setSelectedOrder(null);
    try {
      const order = await getAdminOrder(id);
      setSelectedOrder(order);
      setManufacturingStatus(order.manufacturingStatus);
      setPaymentStatus(order.paymentStatus ?? "");
      setEstimatedCompletionDate(toDateInputValue(order.estimatedCompletionDate));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load order details.");
    }
  }

  async function saveManufacturingProgress(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await updateAdminManufacturingProgress(selectedOrder.id, {
        manufacturingStatus,
        estimatedCompletionDate: estimatedCompletionDate || null,
      });
      setSelectedOrder((current) => ({
        ...(current ?? {}),
        ...updated,
      }));
      setManufacturingStatus(updated.manufacturingStatus);
      setEstimatedCompletionDate(toDateInputValue(updated.estimatedCompletionDate));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update manufacturing progress.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePaymentStatus(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await updateAdminPaymentStatus(selectedOrder.id, paymentStatus);
      setSelectedOrder((current) => ({ ...(current ?? {}), ...updated }));
      setOrders((current) => current.map((order) => (
        order.id === updated.id ? { ...order, ...updated } : order
      )));
      setPaymentStatus(updated.paymentStatus);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update payment status.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell activeKey="orders" navItems={ORDER_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Confirmed Orders"
        description="Inspect confirmed order records and their independent status information."
        action={<Button variant="outline" admin onClick={endSession}>Sign out</Button>}
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

      <div className="catalogue-admin-layout">
        <Card
          title="Confirmed orders"
          description={isLoading ? "Loading confirmed orders…" : `${orders.length} confirmed ${orders.length === 1 ? "order" : "orders"}`}
          action={
            <Button variant="outline" size="sm" admin onClick={() => { void loadOrders(); }} loading={isLoading}>
              Refresh
            </Button>
          }
        >
          {isLoading ? (
            <p className="catalogue-state" role="status">Loading orders…</p>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No confirmed orders yet"
              description="Confirmed orders will appear after Raazia accepts a pending order request."
            />
          ) : (
            <div className="catalogue-table-wrap">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Confirmed</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Original inquiry</th>
                    <th scope="col">Approved Price</th>
                    <th scope="col">Manufacturing</th>
                    <th scope="col">Payment</th>
                    <th scope="col">Delivery</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{formatDate(order.confirmedAt)}</td>
                      <td>{order.customerId}</td>
                      <td>{order.originalInquiryId}</td>
                      <td>{formatPrice(order.approvedPrice)}</td>
                      <td>{order.manufacturingStatus}</td>
                      <td>{order.paymentStatus ?? "Not yet recorded"}</td>
                      <td>{order.deliveryStatus ?? "Not yet recorded"}</td>
                      <td>
                        <Button variant="ghost" size="sm" admin onClick={() => { void openDetails(order.id); }}>
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selectedOrder && (
          <Card title="Order details" description={selectedOrder.id}>
            <div className="catalogue-info-fields">
              <div><strong>Original inquiry</strong><p>{selectedOrder.originalInquiryId}</p></div>
              <div><strong>Product</strong><p>{selectedOrder.productName ?? "No linked product"}</p></div>
              <div><strong>Approved Price</strong><p>{formatPrice(selectedOrder.approvedPrice)}</p></div>
              <div><strong>Negotiated Price snapshot</strong><p>{selectedOrder.negotiatedPriceSnapshot == null ? "Not applicable" : formatPrice(selectedOrder.negotiatedPriceSnapshot)}</p></div>
              <div><strong>Manufacturing/order status</strong><p>{selectedOrder.manufacturingStatus}</p></div>
              <div><strong>Payment status</strong><p>{selectedOrder.paymentStatus ?? "Not yet recorded"}</p></div>
              <div><strong>Delivery status</strong><p>{selectedOrder.deliveryStatus ?? "Not yet recorded"}</p></div>
              <div><strong>Estimated Completion Date</strong><p>{formatDate(selectedOrder.estimatedCompletionDate)}</p></div>
            </div>
            <form onSubmit={saveManufacturingProgress} className="catalogue-info-fields">
              <SelectField
                id={`manufacturing-status-${selectedOrder.id}`}
                label="Manufacturing/order status"
                value={manufacturingStatus}
                onChange={(event) => setManufacturingStatus(event.target.value)}
                options={[
                  { value: "Incomplete", label: "Incomplete" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Completed", label: "Completed" },
                  { value: "Cancelled", label: "Cancelled" },
                  { value: "On Hold", label: "On Hold" },
                ]}
                required
              />
              <TextField
                id={`estimated-completion-${selectedOrder.id}`}
                label="Estimated Completion Date"
                type="date"
                value={estimatedCompletionDate}
                onChange={(event) => setEstimatedCompletionDate(event.target.value)}
                helpText="Optional estimate. A blank date displays “Not yet provided”."
              />
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving}>
                  Save manufacturing progress
                </Button>
              </div>
            </form>
            <form onSubmit={savePaymentStatus} className="catalogue-info-fields">
              <SelectField
                id={`payment-status-${selectedOrder.id}`}
                label="Payment status"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                options={[
                  { value: "Advance Payment Received", label: "Advance Payment Received" },
                  { value: "Partial Payment", label: "Partial Payment" },
                  { value: "Full Payment", label: "Full Payment" },
                  { value: "Refunded", label: "Refunded" },
                ]}
                required
              />
              <p>Records a payment state only; it does not process a payment or refund.</p>
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving}>
                  Save payment status
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
