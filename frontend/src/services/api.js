import { getSupabaseClient } from "./supabaseClient";

const CUSTOMER_TOKEN_KEY = "farochet.customer.access-token";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

async function getAccessToken() {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? "";
}

function getCustomerAccessToken() {
  return window.sessionStorage.getItem(CUSTOMER_TOKEN_KEY) ?? "";
}

function saveCustomerAccessToken(token) {
  window.sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

function clearCustomerAccessToken() {
  window.sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

async function request(path, { token, clearTokenOnUnauthorized, ...options } = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const accessToken = token ?? await getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (response.status === 401) {
    clearTokenOnUnauthorized?.();
    const { error: signOutError } = await getSupabaseClient().auth.signOut({ scope: "local" });
    if (signOutError) throw signOutError;
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message ?? `Backend responded with HTTP ${response.status}.`);
    error.code = data?.error?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend responded with HTTP ${response.status}.`);
  }

  return response.json();
}

export function getCurrentUser(token) {
  return request("/auth/me", { token }).then((data) => data.user);
}

export function registerCustomer({ displayName, email, password }) {
  return request("/auth/register", {
    token: "",
    method: "POST",
    body: JSON.stringify({ displayName, email, password }),
  });
}

export function activateCustomerRegistration(token) {
  return request("/auth/registration/activate", {
    token,
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function completeCustomerProfile(token) {
  return request("/auth/profile", {
    token,
    method: "POST",
    body: JSON.stringify({}),
  }).then((data) => data.user);
}

export function listAdminProducts() {
  return request("/admin/products").then((data) => data.products);
}

export function createAdminProduct(product) {
  return request("/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  }).then((data) => data.product);
}

export function updateAdminProduct(id, product) {
  return request(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  }).then((data) => data.product);
}

export function archiveAdminProduct(id) {
  return request(`/admin/products/${encodeURIComponent(id)}/archive`, {
    method: "PATCH",
  }).then((data) => data.product);
}

export function getAdminAvailability() {
  return request("/admin/availability").then((data) => data.availability);
}

export function updateAdminAvailability(information) {
  return request("/admin/availability", {
    method: "PUT",
    body: JSON.stringify({ information }),
  }).then((data) => data.availability);
}

export function getPublicAvailability() {
  return fetch(`${API_BASE_URL}/availability`, { headers: { Accept: "application/json" } })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? `Backend responded with HTTP ${response.status}.`);
      }
      return data.availability;
    });
}

export function listAdminInquiries() {
  return request("/admin/inquiries").then((data) => data.inquiries);
}

export function getAdminInquiry(id) {
  return request(`/admin/inquiries/${encodeURIComponent(id)}`).then((data) => data.inquiry);
}

export function listAdminOrders() {
  return request("/admin/orders").then((data) => data.orders);
}

export function getAdminOrder(id) {
  return request(`/admin/orders/${encodeURIComponent(id)}`).then((data) => data.order);
}

export function updateAdminManufacturingProgress(id, progress) {
  return request(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(progress),
  }).then((data) => data.order);
}

export function listMyOrders(token = getCustomerAccessToken()) {
  return request("/orders/my", {
    token,
    clearTokenOnUnauthorized: clearCustomerAccessToken,
  }).then((data) => data.orders);
}

export function getMyOrder(id, token = getCustomerAccessToken()) {
  return request(`/orders/${encodeURIComponent(id)}`, {
    token,
    clearTokenOnUnauthorized: clearCustomerAccessToken,
  }).then((data) => data.order);
}

export {
  API_BASE_URL,
  clearCustomerAccessToken,
  getCustomerAccessToken,
  saveCustomerAccessToken,
};
