
const API_BASE = "http://127.0.0.1:9000";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = options.headers || {};
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + url, { ...options, headers });
  if (!res.ok) throw await res.json();
  return res.json();
}
