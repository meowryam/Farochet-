import { useCallback, useEffect, useRef, useState } from "react";
import {
  addMyWishlistItem,
  listMyWishlist,
  removeMyWishlistItem,
} from "../../services/api";

const EMPTY_STATE = {
  customerId: null,
  items: [],
  isLoading: false,
  error: "",
  notice: "",
  pendingProductIds: [],
};

function messageFromError(error) {
  return error instanceof Error ? error.message : "Wishlist request failed.";
}

function updatePendingProduct(state, customerId, productId, pending) {
  if (state.customerId !== customerId) return state;
  const pendingProductIds = new Set(state.pendingProductIds);
  if (pending) pendingProductIds.add(productId);
  else pendingProductIds.delete(productId);
  return { ...state, pendingProductIds: [...pendingProductIds] };
}

export function useCustomerWishlist(session) {
  const customerId = session?.user?.id ?? null;
  const token = session?.access_token ?? null;
  const [state, setState] = useState(EMPTY_STATE);
  const requestSequence = useRef(0);
  const stateBelongsToCustomer = state.customerId === customerId;

  const reload = useCallback(async () => {
    if (!customerId || !token) {
      requestSequence.current += 1;
      setState(EMPTY_STATE);
      return;
    }

    const requestId = ++requestSequence.current;
    setState({
      customerId,
      items: [],
      isLoading: true,
      error: "",
      notice: "",
      pendingProductIds: [],
    });

    try {
      const items = await listMyWishlist(token);
      if (requestId === requestSequence.current) {
        setState({
          customerId,
          items,
          isLoading: false,
          error: "",
          notice: "",
          pendingProductIds: [],
        });
      }
    } catch (error) {
      if (requestId === requestSequence.current) {
        setState({
          customerId,
          items: [],
          isLoading: false,
          error: messageFromError(error),
          notice: "",
          pendingProductIds: [],
        });
      }
    }
  }, [customerId, token]);

  useEffect(() => {
    void reload();
    return () => {
      requestSequence.current += 1;
    };
  }, [reload]);

  const addProduct = useCallback(async (productId) => {
    if (!customerId || !token) return;
    const requestId = requestSequence.current;
    setState((current) => updatePendingProduct(current, customerId, productId, true));

    try {
      const result = await addMyWishlistItem(productId, token);
      if (requestId !== requestSequence.current) return;
      setState((current) => {
        if (current.customerId !== customerId) return current;
        const items = [
          result.item,
          ...current.items.filter((item) => item.product.id !== productId),
        ];
        return {
          ...current,
          items,
          error: "",
          notice: result.alreadySaved
            ? "This product is already in your wishlist."
            : "Added to your wishlist.",
        };
      });
    } catch (error) {
      if (requestId === requestSequence.current) {
        setState((current) => ({
          ...updatePendingProduct(current, customerId, productId, false),
          error: messageFromError(error),
          notice: "",
        }));
      }
    } finally {
      if (requestId === requestSequence.current) {
        setState((current) => updatePendingProduct(current, customerId, productId, false));
      }
    }
  }, [customerId, token]);

  const removeProduct = useCallback(async (productId) => {
    if (!customerId || !token) return;
    const requestId = requestSequence.current;
    setState((current) => updatePendingProduct(current, customerId, productId, true));

    try {
      await removeMyWishlistItem(productId, token);
      if (requestId !== requestSequence.current) return;
      setState((current) => {
        if (current.customerId !== customerId) return current;
        return {
          ...current,
          items: current.items.filter((item) => item.product.id !== productId),
          error: "",
          notice: "Removed from your wishlist.",
        };
      });
    } catch (error) {
      if (requestId === requestSequence.current) {
        setState((current) => ({
          ...updatePendingProduct(current, customerId, productId, false),
          error: messageFromError(error),
          notice: "",
        }));
      }
    } finally {
      if (requestId === requestSequence.current) {
        setState((current) => updatePendingProduct(current, customerId, productId, false));
      }
    }
  }, [customerId, token]);

  const items = stateBelongsToCustomer ? state.items : [];
  const pendingProductIds = stateBelongsToCustomer ? state.pendingProductIds : [];

  return {
    items,
    isLoading: Boolean(customerId) && (
      !stateBelongsToCustomer || state.isLoading
    ),
    error: stateBelongsToCustomer ? state.error : "",
    notice: stateBelongsToCustomer ? state.notice : "",
    reload,
    addProduct,
    removeProduct,
    isActionPending: (productId) => (
      Boolean(customerId) && (
        !stateBelongsToCustomer
        || state.isLoading
        || pendingProductIds.includes(productId)
      )
    ),
  };
}
