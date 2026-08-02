/**
 * VIVENT API Client
 * Central API layer for all backend communication.
 * All requests go through http://127.0.0.1:8000 with JWT auth injection.
 */

const BASE_URL = "http://127.0.0.1:8000";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("viventToken");

async function request(method, path, body = null, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    method,
    headers,
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (response.status === 401) {
    // Auto-logout on auth expiry
    localStorage.removeItem("viventToken");
    localStorage.removeItem("viventAuth");
    localStorage.removeItem("viventAuthRole");
    localStorage.removeItem("viventUser");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Keep the HTTP status message when the response body is not JSON.
    }
    throw new Error(errorMessage);
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

const get = (path, params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return request("GET", qs ? `${path}?${qs}` : path);
};

const post = (path, body) => request("POST", path, body);
const patch = (path, body) => request("PATCH", path, body);
const del = (path) => request("DELETE", path);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email, password) =>
    post("/auth/login", { email, password }),

  register: (email, password, fullName, role) =>
    post("/auth/register", { email, password, full_name: fullName, role }),

  me: () => get("/auth/me"),

  logout: () => post("/auth/logout", {}),
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: ({
    category,
    status,
    page = 1,
    page_size = 20,
    search,
  } = {}) =>
    get("/events", { category, status, page, page_size, q: search }),

  get: (id) => get(`/events/${id}`),

  listByStatuses: async ({ statuses = ["approved"], ...params } = {}) => {
    const responses = await Promise.all(
      statuses.map((status) => eventsApi.list({ ...params, status }))
    );
    const items = responses
      .flatMap((response) => response?.items || [])
      .sort((first, second) =>
        String(first.start_date || "").localeCompare(String(second.start_date || ""))
      );
    return {
      ...(responses[0] || {}),
      items,
      total: items.length,
    };
  },

  create: (payload) => post("/events", payload),

  update: (id, payload) => patch(`/events/${id}`, payload),

  delete: (id) => del(`/events/${id}`),

  generateDescription: (notes, category, tone = "professional") =>
    post("/events/ai/generate-description", { notes, category, tone }),
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const registrationsApi = {
  register: (eventId, role = "participant") =>
    post(`/events/${eventId}/register`, { role }),

  myRegistrations: () => get("/registrations/my"),

  getEventRegistrations: (eventId) =>
    get(`/events/${eventId}/registrations`),

  updateStatus: (registrationId, status) =>
    patch(`/registrations/${registrationId}`, { status }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  initiate: (eventId, amount, method = "card") =>
    post("/payments/initiate", { event_id: eventId, amount, payment_method: method }),

  createStripeCheckoutSession: (eventId, successUrl, cancelUrl) =>
    post("/payments/stripe/create-checkout-session", {
      event_id: eventId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),

  confirm: (transactionId) =>
    post("/payments/confirm", { transaction_id: transactionId }),

  myPayments: () => get("/payments/my-payments"),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  adminDashboard: () => get("/analytics/admin/dashboard"),
  businessDashboard: () => get("/analytics/business/dashboard"),
  studentDashboard: () => get("/analytics/student/dashboard"),
  eventAnalytics: (eventId) => get(`/analytics/events/${eventId}`),
};

// â”€â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const adminApi = {
  pendingEvents: () => get("/admin/events/pending"),
  approveEvent: (id) => request("PUT", `/admin/events/${id}/approve`),
  rejectEvent: (id, detail) => request("PUT", `/admin/events/${id}/reject`, { detail }),
  dashboard: () => analyticsApi.adminDashboard(),
};

// ─── Records ──────────────────────────────────────────────────────────────────

export const recordsApi = {
  myEvents: () => get("/records/my-events"),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plansApi = {
  list: () => get("/plans"),
  get: (id) => get(`/plans/${id}`),
  create: (payload) => post("/plans", payload),
  update: (id, payload) => patch(`/plans/${id}`, payload),
  delete: (id) => del(`/plans/${id}`),
};

// ─── Social Media Accounts ────────────────────────────────────────────────────

export const socialApi = {
  list: () => get("/social-media"),
  add: (payload) => post("/social-media", payload),
  update: (id, payload) => patch(`/social-media/${id}`, payload),
  delete: (id) => del(`/social-media/${id}`),
};

// ─── Ads / Promotions ─────────────────────────────────────────────────────────

export const adsApi = {
  list: (params) => get("/ads", params),
  get: (id) => get(`/ads/${id}`),
  create: (payload) => post("/ads", payload),
  update: (id, payload) => patch(`/ads/${id}`, payload),
  delete: (id) => del(`/ads/${id}`),
  approve: (id) => patch(`/ads/${id}/approve`, {}),
  reject: (id) => patch(`/ads/${id}/reject`, {}),
};

// ─── AI Features ──────────────────────────────────────────────────────────────

export const aiApi = {
  generateDescription: (notes, category, tone = "professional") =>
    eventsApi.generateDescription(notes, category, tone),
  socialPostIdeas: (eventTitle, category, platforms) =>
    post("/events/ai/social-ideas", { event_title: eventTitle, category, platforms }),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptionsApi = {
  /** GET /subscriptions/me — fetch logged-in user's active subscription */
  me: () => get("/subscriptions/me"),

  /** POST /subscriptions — subscribe / switch plan */
  subscribe: (planId) => post("/subscriptions", { plan_id: planId }),

  /** PATCH /subscriptions/cancel — cancel active subscription */
  cancel: () => patch("/subscriptions/cancel", {}),
};

// ─── Default export (backward-compatible) ────────────────────────────────────

const api = {
  auth: authApi,
  events: eventsApi,
  registrations: registrationsApi,
  payments: paymentsApi,
  analytics: analyticsApi,
  admin: adminApi,
  records: recordsApi,
  plans: plansApi,
  social: socialApi,
  ads: adsApi,
  ai: aiApi,
  subscriptions: subscriptionsApi,
};

export default api;
