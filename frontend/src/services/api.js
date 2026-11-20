const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
const ADMIN_TOKEN_KEY = "farochet.dev.raazia-token";

function getAdminToken() {
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

function saveAdminToken(token) {
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request(path, { token = getAdminToken(), ...options } = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (response.status === 401) clearAdminToken();
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Backend responded with HTTP ${response.status}.`);
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

export { API_BASE_URL, clearAdminToken, getAdminToken, saveAdminToken };
