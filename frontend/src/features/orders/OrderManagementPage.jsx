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
  getAdminOrder,
  getAdminToken,
  listAdminOrders,
  saveAdminToken,
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

export default function OrderManagementPage() {
  const [token, setToken] = useState(() => getAdminToken());
  const [tokenInput, setTokenInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
    if (token) void loadOrders();
  }, [loadOrders, token]);

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
      setError("The browser could not save this session token.");
    }
  }

  function disconnectLocalSession() {
    clearAdminToken();
    setToken("");
    setOrders([]);
    setSelectedOrder(null);
  }

  async function openDetails(id) {
    setError("");
    setSelectedOrder(null);
    try {
      setSelectedOrder(await getAdminOrder(id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load order details.");
    }
  }

  return (
    <AdminShell activeKey="orders" navItems={ORDER_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Confirmed Orders"
        description="Inspect confirmed order records and their independent status information."
        action={token ? (
          <Button variant="outline" admin onClick={disconnectLocalSession}>
            End local session
          </Button>
        ) : null}
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

      {!token ? (
        <Card title="Local Raazia session" description="Temporary development access until the centralized Supabase Auth slice is integrated.">
          <form className="catalogue-session-form" onSubmit={connectLocalSession}>
            <TextField
              id="local-raazia-token-orders"
              label="Development token"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              helpText="Use DEV_RAAZIA_TOKEN from backend/.env."
              autoComplete="off"
            />
            <Button type="submit" admin>Connect</Button>
          </form>
        </Card>
      ) : (
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
            </Card>
          )}
        </div>
      )}
    </AdminShell>
  );
}
