
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerShell from "../../components/layout/CustomerShell";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMyOrder,
  listMyOrders,
  requestCustomerOrderCancellation,
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

function cancellationDecisionLabel(order) {
  if (order.cancellationApproved == null) return "Not yet recorded";
  return order.cancellationApproved ? "Approved by Raazia" : "Rejected by Raazia";
}

export default function CustomerOrdersPage() {
  const { session, loading: authLoading } = useAuth();
  const token = session?.access_token ?? "";

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isRequestingCancellation, setIsRequestingCancellation] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    try {
      setOrders(await listMyOrders(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your orders."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && token) {
      void loadOrders();
    }
  }, [authLoading, loadOrders, token]);

  async function openOrder(orderId) {
    setSelectedOrder(null);
    setCancellationReason("");
    setError("");

    try {
      setSelectedOrder(await getMyOrder(orderId, token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load order details."
      );
    }
  }

  async function submitCancellationRequest(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsRequestingCancellation(true);
    setError("");

    try {
      const updated = await requestCustomerOrderCancellation(
        selectedOrder.id,
        cancellationReason.trim(),
        token,
      );
      setSelectedOrder(updated);
      setOrders((current) => current.map((order) => (
        order.id === updated.id ? { ...order, ...updated } : order
      )));
      setCancellationReason("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit the cancellation request."
      );
    } finally {
      setIsRequestingCancellation(false);
    }
  }

  return (
    <CustomerShell headerProps={{ currentPath: "/orders" }}>
      <section className="farochet-container customer-orders-page">
        <p className="customer-orders-eyebrow">Your account</p>

        <div className="customer-orders-heading">
          <div>
            <h1>My Orders</h1>
            <p>
              Follow the latest information for your confirmed crochet orders.
            </p>
          </div>
        </div>

        {error && (
          <Alert tone="error" title="Orders could not be loaded">
            {error}
          </Alert>
        )}

        {authLoading ? (
          <p className="catalogue-state" role="status">
            Checking your account...
          </p>
        ) : !token ? (
          <Card
            title="Sign in to view your orders"
            description="Your order details are private to your customer account."
          >
            <p>
              Please sign in to your Farochet Customer account to view your
              orders.
            </p>
            <Link to="/sign-in">
              <Button>Sign in</Button>
            </Link>
          </Card>
        ) : (
          <div className="customer-orders-content">
            <Card
              title="Confirmed orders"
              description={
                isLoading
                  ? "Loading your orders..."
                  : `${orders.length} ${
                      orders.length === 1 ? "order" : "orders"
                    }`
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void loadOrders();
                  }}
                  loading={isLoading}
                >
                  Refresh
                </Button>
              }
            >
              {isLoading ? (
                <p className="catalogue-state" role="status">
                  Loading your orders...
                </p>
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
                          <p className="customer-order-item__product">
                            {order.productName ?? "Custom order"}
                          </p>
                          <p className="customer-order-item__reference">
                            Order {order.id}
                          </p>
                        </div>

                        <p className="customer-order-item__price">
                          {formatPrice(order.approvedPrice)}
                        </p>
                      </div>

                      <dl className="customer-order-statuses">
                        <div>
                          <dt>Manufacturing</dt>
                          <dd>{order.manufacturingStatus}</dd>
                        </div>
                        <div>
                          <dt>Payment</dt>
                          <dd>
                            {order.paymentStatus ?? "Not yet recorded"}
                          </dd>
                        </div>
                        <div>
                          <dt>Delivery</dt>
                          <dd>
                            {order.deliveryStatus ?? "Not yet recorded"}
                          </dd>
                        </div>
                      </dl>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void openOrder(order.id);
                        }}
                      >
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
                description={
                  selectedOrder.productName ??
                  `Order ${selectedOrder.id}`
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </Button>
                }
              >
                <dl className="customer-order-detail-grid">
                  <div>
                    <dt>Approved Price</dt>
                    <dd>{formatPrice(selectedOrder.approvedPrice)}</dd>
                  </div>
                  <div>
                    <dt>Order confirmed</dt>
                    <dd>{formatDate(selectedOrder.confirmedAt)}</dd>
                  </div>
                  <div>
                    <dt>Manufacturing/order status</dt>
                    <dd>{selectedOrder.manufacturingStatus}</dd>
                  </div>
                  <div>
                    <dt>Payment status</dt>
                    <dd>
                      {selectedOrder.paymentStatus ?? "Not yet recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>Delivery status</dt>
                    <dd>
                      {selectedOrder.deliveryStatus ?? "Not yet recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>Delivery method</dt>
                    <dd>{selectedOrder.deliveryMethod ?? "Not yet recorded"}</dd>
                  </div>
                  <div>
                    <dt>Delivery fee</dt>
                    <dd>{selectedOrder.deliveryFee == null ? "Not yet recorded" : formatPrice(selectedOrder.deliveryFee)}</dd>
                  </div>
                  <div>
                    <dt>Tracking/delivery information</dt>
                    <dd>{selectedOrder.deliveryTrackingInformation ?? "Not yet provided"}</dd>
                  </div>
                  <div>
                    <dt>Estimated Completion Date</dt>
                    <dd>
                      {formatDate(selectedOrder.estimatedCompletionDate)}
                    </dd>
                  </div>
                  <div>
                    <dt>Original inquiry reference</dt>
                    <dd>{selectedOrder.originalInquiryId}</dd>
                  </div>
                  <div>
                    <dt>Specification change</dt>
                    <dd>
                      {selectedOrder.specificationChangeNotes ?? "No specification change recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>Cancellation request</dt>
                    <dd>
                      {selectedOrder.cancellationRequestedAt
                        ? `Submitted ${formatDate(selectedOrder.cancellationRequestedAt)}`
                        : "Not submitted"}
                    </dd>
                  </div>
                  <div>
                    <dt>Cancellation decision</dt>
                    <dd>{cancellationDecisionLabel(selectedOrder)}</dd>
                  </div>
                  <div>
                    <dt>Manually recorded refund outcome</dt>
                    <dd>{selectedOrder.refundOutcome ?? "Not yet recorded"}</dd>
                  </div>
                </dl>

                {!selectedOrder.cancellationRequestedAt
                  && selectedOrder.cancellationApproved == null
                  && selectedOrder.manufacturingStatus !== "Cancelled" && (
                    <form onSubmit={submitCancellationRequest} className="customer-cancellation-form">
                      <label htmlFor={`cancellation-reason-${selectedOrder.id}`}>
                        Reason for cancellation request (optional)
                      </label>
                      <textarea
                        id={`cancellation-reason-${selectedOrder.id}`}
                        value={cancellationReason}
                        onChange={(event) => setCancellationReason(event.target.value)}
                        rows={3}
                      />
                      <p>Submitting a request does not cancel the Order. Raazia records the decision.</p>
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        loading={isRequestingCancellation}
                        disabled={isRequestingCancellation}
                      >
                        Request cancellation
                      </Button>
                    </form>
                  )}
              </Card>
            )}
          </div>
        )}
      </section>
    </CustomerShell>
  );
}
