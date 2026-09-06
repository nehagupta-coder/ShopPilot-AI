export type UserRole = "customer" | "merchant";

export interface UserPreferences {
  budget?: number;
  categories: string[];
  brands: string[];
  priorities: string[];
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
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

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartView {
  id: string;
  userId: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  insights: string[];
  upsells: Product[];
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
  estimatedDelivery: string;
  timeline: { status: string; at: string; note: string }[];
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

export interface AgentChatResult {
  conversationId: string;
  message: ChatMessage;
  steps: AgentStep[];
  products: Product[];
  comparison: Product[];
  pendingAction?: PendingAction;
  mockMode: boolean;
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

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardData {
  overview: {
    days: number;
    revenue: number;
    orders: number;
    conversionRate: number;
    averageOrderValue: number;
    productViews: number;
    searches: number;
    aiConversations: number;
    recommendationClicks: number;
    addToCarts: number;
    addToCartRate: number;
    abandonedCarts: number;
    abandonedCartRate: number;
    repeatCustomers: number;
  };
  trends: { date: string; revenue: number; orders: number }[];
  topProducts: {
    product: Product;
    views: number;
    addToCarts: number;
    purchases: number;
    conversion: number;
  }[];
  categories: { category: string; views: number; addToCarts: number; conversion: number }[];
  growth: {
    opportunities: {
      title: string;
      insight: string;
      recommendation: string;
      expectedImpact: string;
      type: string;
    }[];
    source: string;
  };
}
