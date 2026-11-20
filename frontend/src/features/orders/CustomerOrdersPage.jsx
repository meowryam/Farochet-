import { useCallback, useEffect, useState } from "react";
import CustomerShell from "../../components/layout/CustomerShell";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import TextField from "../../components/ui/TextField";
import {
  clearCustomerAccessToken,
  getCustomerAccessToken,
  getMyOrder,
  listMyOrders,
  saveCustomerAccessToken,
} from "../../services/api";

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

function formatDate(value) {
  if (!value) return "Not yet provided";
  return new Date(value).toLocaleDateString("en-PK", {
    dateStyle: "long",
  });
}

export default function CustomerOrdersPage() {
  const [token, setToken] = useState(() => getCustomerAccessToken());
  const [tokenInput, setTokenInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setOrders(await listMyOrders(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your orders.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadOrders();
  }, [loadOrders, token]);

  function connectCustomerSession(event) {
    event.preventDefault();
    const accessToken = tokenInput.trim();
    if (!accessToken) {
      setError("Sign in and provide your customer access token to view your orders.");
      return;
    }
    try {
      saveCustomerAccessToken(accessToken);
      setToken(accessToken);
      setTokenInput("");
      setError("");
    } catch {
      setError("The browser could not save this session. Check session storage permissions.");
    }
  }

  function disconnectCustomerSession() {
    clearCustomerAccessToken();
    setToken("");
    setOrders([]);
    setSelectedOrder(null);
    setError("");
  }

  async function openOrder(orderId) {
    setSelectedOrder(null);
    setError("");
    try {
      setSelectedOrder(await getMyOrder(orderId, token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load order details.");
    }
  }

  return (
    <CustomerShell headerProps={{ currentPath: "/orders" }}>
      <section className="farochet-container customer-orders-page">
        <p className="customer-orders-eyebrow">Your account</p>
        <div className="customer-orders-heading">
          <div>
            <h1>My Orders</h1>
            <p>Follow the latest information for your confirmed crochet orders.</p>
          </div>
          {token && (
            <Button variant="outline" onClick={disconnectCustomerSession}>
              Sign out
            </Button>
          )}
        </div>

        {error && <Alert tone="error" title="Orders could not be loaded">{error}</Alert>}

        {!token ? (
          <Card title="Sign in to view your orders" description="Your order details are private to your customer account.">
            <form className="customer-orders-session-form" onSubmit={connectCustomerSession}>
              <TextField
                id="customer-access-token"
                label="Customer access token"
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                helpText="Use the access token provided by the sign-in session."
                autoComplete="off"
              />
              <Button type="submit">Continue</Button>
            </form>
          </Card>
        ) : (
          <div className="customer-orders-content">
            <Card
              title="Confirmed orders"
              description={isLoading ? "Loading your orders…" : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
              action={
                <Button variant="outline" size="sm" onClick={() => { void loadOrders(); }} loading={isLoading}>
                  Refresh
                </Button>
              }
            >
              {isLoading ? (
                <p className="catalogue-state" role="status">Loading your orders…</p>
              ) : orders.length === 0 ? (
                <EmptyState
                  title="No confirmed orders yet"
                  description="When a custom-order request is accepted, its confirmed order will appear here."
                />
              ) : (
                <div className="customer-order-list">
                  {orders.map((order) => (
                    <article className="customer-order-item" key={order.id}>
                      <div className="customer-order-item__summary">
                        <div>
                          <p className="customer-order-item__product">{order.productName ?? "Custom order"}</p>
                          <p className="customer-order-item__reference">Order {order.id}</p>
                        </div>
                        <p className="customer-order-item__price">{formatPrice(order.approvedPrice)}</p>
                      </div>
                      <dl className="customer-order-statuses">
                        <div><dt>Manufacturing</dt><dd>{order.manufacturingStatus}</dd></div>
                        <div><dt>Payment</dt><dd>{order.paymentStatus ?? "Not yet recorded"}</dd></div>
                        <div><dt>Delivery</dt><dd>{order.deliveryStatus ?? "Not yet recorded"}</dd></div>
                      </dl>
                      <Button variant="ghost" size="sm" onClick={() => { void openOrder(order.id); }}>
                        View order details
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </Card>

            {selectedOrder && (
              <Card
                title="Order details"
                description={selectedOrder.productName ?? `Order ${selectedOrder.id}`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                }
              >
                <dl className="customer-order-detail-grid">
                  <div><dt>Approved Price</dt><dd>{formatPrice(selectedOrder.approvedPrice)}</dd></div>
                  <div><dt>Order confirmed</dt><dd>{formatDate(selectedOrder.confirmedAt)}</dd></div>
                  <div><dt>Manufacturing/order status</dt><dd>{selectedOrder.manufacturingStatus}</dd></div>
                  <div><dt>Payment status</dt><dd>{selectedOrder.paymentStatus ?? "Not yet recorded"}</dd></div>
                  <div><dt>Delivery status</dt><dd>{selectedOrder.deliveryStatus ?? "Not yet recorded"}</dd></div>
                  <div><dt>Estimated Completion Date</dt><dd>{formatDate(selectedOrder.estimatedCompletionDate)}</dd></div>
                  <div><dt>Original inquiry reference</dt><dd>{selectedOrder.originalInquiryId}</dd></div>
                </dl>
              </Card>
            )}
          </div>
        )}
      </section>
    </CustomerShell>
  );
}
