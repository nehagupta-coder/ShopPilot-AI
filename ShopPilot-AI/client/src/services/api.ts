import type {
  AgentChatResult,
  CartView,
  Conversation,
  DashboardData,
  Order,
  Paged,
  Product,
  Review,
  User,
} from "../types";

const TOKEN_KEY = "shopilot_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  demo: (kind: "customer" | "merchant") =>
    request<{ user: User; token: string }>("/api/auth/demo", { method: "POST", body: JSON.stringify({ kind }) }),
  me: () => request<{ user: User; dbMode: string; ai: { mock: boolean; provider?: string } }>("/api/auth/me"),

  products: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") q.set(k, String(v));
    });
    return request<Paged<Product>>(`/api/products?${q.toString()}`);
  },
  productMeta: () => request<{ categories: { name: string; count: number }[]; brands: string[] }>("/api/products/meta"),
  product: (id: string) =>
    request<{
      product: Product;
      related: Product[];
      reviews: Review[];
      summary: { summary: string; highlights: string[] };
    }>(`/api/products/${id}`),
  search: (q: string) => request<Paged<Product> & { parsed: Record<string, unknown> }>(`/api/search?q=${encodeURIComponent(q)}`),
  compare: (productIds: string[]) =>
    request<{ products: Product[] }>("/api/products/compare", { method: "POST", body: JSON.stringify({ productIds }) }),
  recommendations: () => request<Paged<Product>>("/api/recommendations"),

  cart: () => request<CartView>("/api/cart"),
  addToCart: (productId: string, quantity = 1) =>
    request<CartView>("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateCart: (productId: string, quantity: number) =>
    request<CartView>("/api/cart", { method: "PATCH", body: JSON.stringify({ productId, quantity }) }),
  removeFromCart: (productId: string) => request<CartView>(`/api/cart/${productId}`, { method: "DELETE" }),
  clearCart: () => request<CartView>("/api/cart/clear", { method: "POST", body: JSON.stringify({ confirm: true }) }),

  orders: () => request<{ orders: Order[] }>("/api/orders"),
  order: (id: string) => request<{ order: Order }>(`/api/orders/${id}`),
  checkout: () => request<{ order: Order; notice: string }>("/api/orders", { method: "POST" }),

  chat: (body: {
    message: string;
    conversationId?: string;
    mode?: "shopping" | "growth";
    confirmActionId?: string;
  }) => request<AgentChatResult>("/api/agent/chat", { method: "POST", body: JSON.stringify(body) }),
  conversations: (mode?: string) =>
    request<{ conversations: Conversation[] }>(`/api/agent/conversations${mode ? `?mode=${mode}` : ""}`),
  conversation: (id: string) => request<{ conversation: Conversation; mockMode: boolean }>(`/api/agent/conversations/${id}`),

  dashboard: () => request<DashboardData>("/api/analytics"),
  advisor: (message: string, conversationId?: string) =>
    request<AgentChatResult>("/api/growth/advisor", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    }),
  track: (eventType: string, productId?: string) =>
    request("/api/analytics/track", { method: "POST", body: JSON.stringify({ eventType, productId }) }),
};
