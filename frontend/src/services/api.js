const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend responded with HTTP ${response.status}.`);
  }

  return response.json();
}

export { API_BASE_URL };
