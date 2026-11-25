import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import SelectField from "../../components/ui/SelectField";
import TextArea from "../../components/ui/TextArea";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminManufacturingProgress,
  updateAdminPaymentStatus,
  updateAdminDelivery,
  recordAdminSpecificationChange,
  recordAdminOrderPriceRevision,
  recordAdminCancellationDecision,
  recordAdminRefundOutcome,
} from "../../services/api";

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
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryTrackingInformation, setDeliveryTrackingInformation] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [courierFeeIncrease, setCourierFeeIncrease] = useState("");
  const [customerAgreed, setCustomerAgreed] = useState(false);
  const [revisedApprovedPrice, setRevisedApprovedPrice] = useState("");
  const [specificationChangeNotes, setSpecificationChangeNotes] = useState("");
  const [orderRevisionPrice, setOrderRevisionPrice] = useState("");
  const [orderRevisionReason, setOrderRevisionReason] = useState("");
  const [orderRevisionAgreed, setOrderRevisionAgreed] = useState(false);
  const [cancellationApproved, setCancellationApproved] = useState("");
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [refundOutcome, setRefundOutcome] = useState("");
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
      setDeliveryMethod(order.deliveryMethod ?? "");
      setDeliveryFee(order.deliveryFee == null ? "" : String(order.deliveryFee));
      setDeliveryTrackingInformation(order.deliveryTrackingInformation ?? "");
      setDeliveryStatus(order.deliveryStatus ?? "");
      setCourierFeeIncrease("");
      setCustomerAgreed(false);
      setRevisedApprovedPrice("");
      setSpecificationChangeNotes("");
      setOrderRevisionPrice("");
      setOrderRevisionReason("");
      setOrderRevisionAgreed(false);
      setCancellationApproved("");
      setCancellationNotes("");
      setRefundOutcome(order.refundOutcome ?? "");
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load order details.");
    }
  }

  function applyOrderUpdate(updated) {
    setSelectedOrder((current) => ({ ...(current ?? {}), ...updated }));
    setOrders((current) => current.map((order) => (
      order.id === updated.id ? { ...order, ...updated } : order
    )));
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

  async function saveDelivery(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        deliveryMethod,
        deliveryFee: deliveryMethod === "Local handover"
          ? 0
          : deliveryFee === "" ? undefined : Number(deliveryFee),
        deliveryTrackingInformation: deliveryTrackingInformation || null,
        deliveryStatus: deliveryStatus || null,
      };
      if (courierFeeIncrease !== "") {
        payload.courierFeeIncrease = Number(courierFeeIncrease);
        if (Number(courierFeeIncrease) >= 200) {
          payload.customerAgreed = customerAgreed;
          payload.revisedApprovedPrice = revisedApprovedPrice === ""
            ? undefined
            : Number(revisedApprovedPrice);
        }
      }
      const updated = await updateAdminDelivery(selectedOrder.id, payload);
      setSelectedOrder((current) => ({ ...(current ?? {}), ...updated }));
      setOrders((current) => current.map((order) => (
        order.id === updated.id ? { ...order, ...updated } : order
      )));
      setDeliveryMethod(updated.deliveryMethod ?? "");
      setDeliveryFee(updated.deliveryFee == null ? "" : String(updated.deliveryFee));
      setDeliveryTrackingInformation(updated.deliveryTrackingInformation ?? "");
      setDeliveryStatus(updated.deliveryStatus ?? "");
      setCourierFeeIncrease("");
      setCustomerAgreed(false);
      setRevisedApprovedPrice("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update delivery information.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSpecificationChange(event) {
    event.preventDefault();
    if (!selectedOrder || !specificationChangeNotes.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await recordAdminSpecificationChange(
        selectedOrder.id,
        specificationChangeNotes.trim(),
      );
      applyOrderUpdate(updated);
      setSpecificationChangeNotes("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not record the specification change.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveOrderPriceRevision(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await recordAdminOrderPriceRevision(selectedOrder.id, {
        revisedApprovedPrice: Number(orderRevisionPrice),
        customerAgreed: orderRevisionAgreed,
        reason: orderRevisionReason.trim(),
      });
      applyOrderUpdate(updated);
      setOrderRevisionPrice("");
      setOrderRevisionReason("");
      setOrderRevisionAgreed(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not record the price revision.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCancellationDecision(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await recordAdminCancellationDecision(selectedOrder.id, {
        approved: cancellationApproved === "approved",
        notes: cancellationNotes.trim() || undefined,
      });
      applyOrderUpdate(updated);
      setCancellationApproved("");
      setCancellationNotes("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not record the cancellation decision.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRefundOutcome(event) {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await recordAdminRefundOutcome(
        selectedOrder.id,
        refundOutcome.trim() || null,
      );
      applyOrderUpdate(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not record the refund outcome.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell activeKey="orders" logoutHref={null}>
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
              <div><strong>Delivery method</strong><p>{selectedOrder.deliveryMethod ?? "Not yet recorded"}</p></div>
              <div><strong>Delivery fee</strong><p>{selectedOrder.deliveryFee == null ? "Not yet recorded" : formatPrice(selectedOrder.deliveryFee)}</p></div>
              <div><strong>Tracking/delivery information</strong><p>{selectedOrder.deliveryTrackingInformation ?? "Not yet provided"}</p></div>
              <div><strong>Estimated Completion Date</strong><p>{formatDate(selectedOrder.estimatedCompletionDate)}</p></div>
              <div><strong>Specification change</strong><p>{selectedOrder.specificationChangeNotes ?? "None recorded"}</p></div>
              <div><strong>Cancellation request</strong><p>{selectedOrder.cancellationRequestReason ?? "None"}</p></div>
              <div><strong>Cancellation decision</strong><p>{selectedOrder.cancellationApproved == null ? "Not yet recorded" : (selectedOrder.cancellationApproved ? "Approved" : "Rejected")}</p></div>
              <div><strong>Manual refund outcome</strong><p>{selectedOrder.refundOutcome ?? "None recorded"}</p></div>
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
            <form onSubmit={saveDelivery} className="catalogue-info-fields">
              <SelectField
                id={`delivery-method-${selectedOrder.id}`}
                label="Delivery method"
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value)}
                options={[
                  { value: "Local handover", label: "Local/in-city handover" },
                  { value: "Courier/service delivery", label: "Courier/service delivery" },
                ]}
                required
              />
              <TextField
                id={`delivery-fee-${selectedOrder.id}`}
                label="Applicable delivery fee (PKR)"
                type="number"
                value={deliveryFee}
                onChange={(event) => setDeliveryFee(event.target.value)}
                helpText="Use 0 for local handover."
              />
              <TextField
                id={`delivery-tracking-${selectedOrder.id}`}
                label="Tracking/delivery information"
                value={deliveryTrackingInformation}
                onChange={(event) => setDeliveryTrackingInformation(event.target.value)}
              />
              <SelectField
                id={`delivery-status-${selectedOrder.id}`}
                label="Delivery status"
                value={deliveryStatus}
                onChange={(event) => setDeliveryStatus(event.target.value)}
                options={[{ value: "Delivered", label: "Delivered" }]}
                helpText="Leave blank while delivery remains unrecorded."
              />
              <TextField
                id={`courier-fee-increase-${selectedOrder.id}`}
                label="Pre-dispatch courier fee increase (PKR)"
                type="number"
                value={courierFeeIncrease}
                onChange={(event) => {
                  setCourierFeeIncrease(event.target.value);
                  setCustomerAgreed(false);
                }}
                helpText="Below 200 is absorbed. 200 or more requires agreement."
              />
              {Number(courierFeeIncrease) >= 200 && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={customerAgreed}
                      onChange={(event) => setCustomerAgreed(event.target.checked)}
                    />
                    {" "}Customer agreed to the revised price
                  </label>
                  <TextField
                    id={`revised-approved-price-${selectedOrder.id}`}
                    label="Revised Approved Price (PKR)"
                    type="number"
                    value={revisedApprovedPrice}
                    onChange={(event) => setRevisedApprovedPrice(event.target.value)}
                  />
                </>
              )}
              <p>Delivery updates do not change manufacturing or payment status.</p>
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving}>
                  Save delivery information
                </Button>
              </div>
            </form>

            <form onSubmit={saveSpecificationChange} className="catalogue-info-fields">
              <h3>Cost-affecting specification changes</h3>
              <TextArea
                id={`specification-change-${selectedOrder.id}`}
                label="Specification change note"
                value={specificationChangeNotes}
                onChange={(event) => setSpecificationChangeNotes(event.target.value)}
                helpText="Records the change and places the Order On Hold until revised terms are agreed."
                required
              />
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving || !specificationChangeNotes.trim()}>
                  Place On Hold for renegotiation
                </Button>
              </div>
            </form>

            <form onSubmit={saveOrderPriceRevision} className="catalogue-info-fields">
              <h3>Order price revision</h3>
              <TextField
                id={`order-revision-price-${selectedOrder.id}`}
                label="Revised Order Approved Price (PKR)"
                type="number"
                value={orderRevisionPrice}
                onChange={(event) => setOrderRevisionPrice(event.target.value)}
                required
              />
              <TextArea
                id={`order-revision-reason-${selectedOrder.id}`}
                label="Reason for revision"
                value={orderRevisionReason}
                onChange={(event) => setOrderRevisionReason(event.target.value)}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={orderRevisionAgreed}
                  onChange={(event) => setOrderRevisionAgreed(event.target.checked)}
                />
                {" "}Customer has agreed to the revised price
              </label>
              <p>The original price, revised price, time, Order, and acting user are retained in price history.</p>
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving || !orderRevisionAgreed}>
                  Record price revision
                </Button>
              </div>
            </form>

            {selectedOrder.priceRevisions?.length > 0 && (
              <div>
                <h3>Price revision history</h3>
                <ul>
                  {selectedOrder.priceRevisions.map((revision) => (
                    <li key={revision.id}>
                      {formatPrice(revision.originalPrice)} → {formatPrice(revision.revisedPrice)}
                      {" · "}{formatDate(revision.createdAt)}
                      {" · "}{revision.reason}
                      {" · "}{revision.customerAgreed ? "Customer agreed" : "Agreement not recorded"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={saveCancellationDecision} className="catalogue-info-fields">
              <h3>Cancellation decision</h3>
              <p>
                Only Raazia records the outcome. A Customer request is not
                required when cancelling after failed renegotiation.
              </p>
              <SelectField
                id={`cancellation-decision-${selectedOrder.id}`}
                label="Cancellation decision"
                value={cancellationApproved}
                onChange={(event) => setCancellationApproved(event.target.value)}
                options={[
                  { value: "approved", label: "Approve cancellation" },
                  { value: "rejected", label: "Reject cancellation" },
                ]}
                required
                disabled={selectedOrder.cancellationApproved != null}
              />
              <TextArea
                id={`cancellation-notes-${selectedOrder.id}`}
                label="Cancellation decision note"
                value={cancellationNotes}
                onChange={(event) => setCancellationNotes(event.target.value)}
              />
              <div className="catalogue-form-actions">
                <Button
                  type="submit"
                  admin
                  loading={isSaving}
                  disabled={isSaving || selectedOrder.cancellationApproved != null || !cancellationApproved}
                >
                  Record cancellation decision
                </Button>
              </div>
            </form>

            <form onSubmit={saveRefundOutcome} className="catalogue-info-fields">
              <h3>Refund outcome</h3>
              <TextField
                id={`refund-outcome-${selectedOrder.id}`}
                label="Manually recorded refund outcome"
                value={refundOutcome}
                onChange={(event) => setRefundOutcome(event.target.value)}
                helpText="Recording an outcome does not calculate or execute a refund and does not change payment status."
              />
              <div className="catalogue-form-actions">
                <Button type="submit" admin loading={isSaving} disabled={isSaving}>
                  Record refund outcome
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
