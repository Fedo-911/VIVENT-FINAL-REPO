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
      const detail = errorData.detail || errorData.message;
      errorMessage = Array.isArray(detail)
        ? detail
            .map((item) => {
              const field = Array.isArray(item.loc) ? item.loc.join(".") : "Event";
              return `${field}: ${item.msg}`;
            })
            .join("; ")
        : detail || errorMessage;
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
    start_date,
    end_date,
    page = 1,
    page_size = 20,
    search,
  } = {}) =>
    get("/events", { category, status, start_date, end_date, page, page_size, q: search }),

  get: (id) => get(`/events/${id}`),

  listByStatuses: async ({ statuses = ["approved"], ...params } = {}) => {
    const responses = await Promise.all(statuses.map((status) => eventsApi.list({ ...params, status })));
    const additionalPages = await Promise.all(
      responses.flatMap((response, index) => {
        const pageSize = Number(response?.page_size || params.page_size || 20);
        const totalPages = Math.ceil(Number(response?.total || 0) / pageSize);
        return Array.from({ length: Math.max(0, totalPages - 1) }, (_, pageIndex) =>
          eventsApi.list({ ...params, status: statuses[index], page: pageIndex + 2, page_size: pageSize })
        );
      })
    );
    const items = [...responses, ...additionalPages]
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

  create: async (payload) => {
    const result = await post("/events", payload);
    window.dispatchEvent(new CustomEvent("vivent:events-changed", { detail: { action: "created", event: result } }));
    return result;
  },

  update: async (id, payload) => {
    const result = await patch(`/events/${id}`, payload);
    window.dispatchEvent(new CustomEvent("vivent:events-changed", { detail: { action: "updated", event: result } }));
    return result;
  },

  delete: async (id) => {
    const result = await del(`/events/${id}`);
    window.dispatchEvent(new CustomEvent("vivent:events-changed", { detail: { action: "deleted", id } }));
    return result;
  },

  generateDescription: (notes, category, tone = "professional") =>
    post("/events/ai/generate-description", { notes, category, tone }),
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const registrationsApi = {
  register: async (eventId, role = "participant") => {
    const registration = await post(`/events/${eventId}/register`, { role_at_event: role });
    window.dispatchEvent(new CustomEvent("vivent:registration-created", { detail: registration }));
    return registration;
  },

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

  createSubscriptionCheckoutSession: (planId, successUrl, cancelUrl) =>
    post("/payments/stripe/create-checkout-session", {
      plan_id: planId,
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
  approveEvent: async (id) => {
    const result = await request("PUT", `/admin/events/${id}/approve`);
    window.dispatchEvent(new CustomEvent("vivent:events-changed", { detail: { action: "approved", event: result } }));
    return result;
  },
  rejectEvent: async (id, detail) => {
    const result = await request("PUT", `/admin/events/${id}/reject`, { detail });
    window.dispatchEvent(new CustomEvent("vivent:events-changed", { detail: { action: "rejected", id } }));
    return result;
  },
  dashboard: () => analyticsApi.adminDashboard(),
};

// Contact Messages

export const contactApi = {
  submit: (payload) => post("/contact", payload),
  list: () => get("/contact"),
  listMine: () => get("/contact/mine"),
  get: (id) => get(`/contact/${id}`),
  reply: (id, reply) => post(`/contact/${id}/reply`, { reply }),
  updateStatus: (id, status) => patch(`/contact/${id}/status`, { status }),
  delete: (id) => del(`/contact/${id}`),
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

export const notificationsApi = {
  list: ({ limit = 20, offset = 0 } = {}) => get("/notifications", { limit, offset }),
  unreadCount: () => get("/notifications/unread-count"),
  markRead: (id) => patch(`/notifications/${id}/read`, {}),
  markAllRead: () => patch("/notifications/read-all", {}),
  delete: (id) => del(`/notifications/${id}`),
  clearAll: () => del("/notifications/clear-all"),
};

export const campaignsApi = {
  list: () => get("/automation/social-media/campaigns"),
  detail: (id) => get(`/automation/social-media/campaigns/${id}`),
  start: (campaignId) => post("/automation/social-media/start", { campaign_id: campaignId }),
  postAction: (postId, action, scheduledAt) =>
    patch(`/automation/social-media/posts/${postId}`, { action, ...(scheduledAt ? { scheduled_at: scheduledAt } : {}) }),
};

export const campaignSetupApi = {
  create: (payload) => post("/campaign/setup", payload),
  get: (userId) => get(`/campaign/setup/${userId}`),
  update: (userId, payload) => request("PUT", `/campaign/setup/${userId}`, payload),
  socialAccounts: (userId) => get(`/campaign/social-accounts/${userId}`),
  connectPlatform: (payload) => post("/campaign/connect-platform", payload),
  disconnectPlatform: (platform) => post("/campaign/disconnect-platform", { platform }),
  preferences: (userId) => get(`/campaign/preferences/${userId}`),
};

export const adminPostManagementApi = {
  users: (params) => get("/admin/post-management/users", params),
  user: (userId) => get(`/admin/post-management/user/${userId}`),
  campaign: (userId) => get(`/admin/post-management/user/${userId}/campaign`),
  socialAccounts: (userId) => get(`/admin/post-management/user/${userId}/social-accounts`),
  analytics: (userId) => get(`/admin/post-management/user/${userId}/analytics`),
  posts: (userId) => get(`/admin/post-management/user/${userId}/posts`),
  history: (userId) => get(`/admin/post-management/user/${userId}/history`),
  runAi: (userId) => post(`/admin/post-management/user/${userId}/run-ai`, {}),
  pause: (userId) => post(`/admin/post-management/user/${userId}/pause`, {}),
  resume: (userId) => post(`/admin/post-management/user/${userId}/resume`, {}),
  generateContent: (userId) => post(`/admin/post-management/user/${userId}/generate-content`, {}),
  publishApproved: (userId) => post(`/admin/post-management/user/${userId}/publish`, {}),
  deleteCampaign: (userId) => del(`/admin/post-management/user/${userId}/campaign`),
};

// ─── Default export (backward-compatible) ────────────────────────────────────

const api = {
  auth: authApi,
  events: eventsApi,
  registrations: registrationsApi,
  payments: paymentsApi,
  analytics: analyticsApi,
  admin: adminApi,
  contact: contactApi,
  records: recordsApi,
  plans: plansApi,
  social: socialApi,
  ads: adsApi,
  ai: aiApi,
  subscriptions: subscriptionsApi,
  notifications: notificationsApi,
  campaignSetup: campaignSetupApi,
  adminPostManagement: adminPostManagementApi,
};

export default api;
