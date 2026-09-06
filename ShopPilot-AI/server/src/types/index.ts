export type UserRole = "customer" | "merchant";

export interface UserPreferences {
  budget?: number;
  categories: string[];
  brands: string[];
  priorities: string[];
  notes?: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  stock: number;
  specifications: ProductSpec[];
  tags: string[];
  images: string[];
  relatedProducts: string[];
  weightGrams?: number;
  batteryLifeHours?: number;
  popularity: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  timeline: { status: OrderStatus; at: string; note: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  products?: Product[];
  comparison?: Product[];
  steps?: AgentStep[];
  pendingAction?: PendingAction;
}

export interface AgentStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
  tool?: string;
}

export interface PendingAction {
  id: string;
  type: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  mode: "shopping" | "growth";
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsEventType =
  | "product_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "purchase"
  | "recommendation_clicked"
  | "ai_conversation"
  | "compare";

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: AnalyticsEventType;
  productId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface AgentChatResult {
  conversationId: string;
  message: ChatMessage;
  steps: AgentStep[];
  products: Product[];
  comparison: Product[];
  pendingAction?: PendingAction;
  mockMode: boolean;
}
