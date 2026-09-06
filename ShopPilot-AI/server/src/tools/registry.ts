import {
  addToCart,
  calculateCartTotal,
  clearCart,
  removeFromCart,
  updateCart,
  viewCart,
} from "../services/cartService.js";
import {
  categoryPerformance,
  getOverview,
  identifyGrowthOpportunities,
  recommendBundle as analyticsBundle,
  recommendOffer,
  salesTrends,
  topProducts,
} from "../services/analyticsService.js";
import {
  compareProducts,
  complementaryProducts,
  explainMatch,
  generateProductSummary,
  getProduct,
  getReviews,
  listProducts,
  scoreProduct,
  type ProductFilters,
} from "../services/productService.js";
import { getOrderStatus, listOrders } from "../services/orderService.js";
import { users, products as productStore } from "../data/store.js";
import { bundleDiscount } from "../seed/catalog.js";
import { formatInr } from "../utils/id.js";
import type { Product } from "../types/index.js";

export interface ToolContext {
  userId: string;
  role: "customer" | "merchant";
  lastProductIds: string[];
  confirmed?: boolean;
}

type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;

function num(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function arr(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String);
  return undefined;
}

async function pickBest(filters: ProductFilters) {
  const { items } = await listProducts({ ...filters, limit: 12, page: 1 });
  const ranked = [...items].sort((a, b) => scoreProduct(b, filters) - scoreProduct(a, filters));
  return ranked;
}

function summarizeProduct(p: Product, filters: ProductFilters = {}) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    priceLabel: formatInr(p.price),
    rating: p.rating,
    discount: p.discount,
    tags: p.tags,
    specs: Object.fromEntries(p.specifications.map((s) => [s.key, s.value])),
    reasons: explainMatch(p, filters),
    image: p.images[0],
  };
}

export const toolHandlers: Record<string, ToolHandler> = {
  async searchProducts(args, _ctx) {
    const filters: ProductFilters = {
      q: str(args.query),
      category: str(args.category),
      maxPrice: num(args.maxPrice),
      minPrice: num(args.minPrice),
      minRamGb: num(args.minRamGb),
      minRating: num(args.minRating),
      tags: arr(args.tags),
      limit: num(args.limit) ?? 8,
    };
    const { items, total } = await listProducts(filters);
    return {
      total,
      products: items.map((p) => summarizeProduct(p, filters)),
    };
  },

  async getProductDetails(args) {
    const product = await getProduct(String(args.productId));
    return summarizeProduct(product);
  },

  async compareProducts(args) {
    const ids = arr(args.productIds) ?? [];
    const items = await compareProducts(ids);
    return {
      products: items.map((p) => summarizeProduct(p)),
      axes: ["price", "rating", "RAM", "Storage", "Battery", "Weight"],
    };
  },

  async getRecommendations(args, ctx) {
    const user = await users.findById(ctx.userId);
    const filters: ProductFilters = {
      category: str(args.category) ?? user?.preferences.categories[0],
      maxPrice: num(args.maxPrice) ?? user?.preferences.budget,
      tags: arr(args.tags) ?? user?.preferences.priorities,
      limit: num(args.limit) ?? 6,
    };
    const ranked = await pickBest(filters);
    return { products: ranked.slice(0, filters.limit).map((p) => summarizeProduct(p, filters)) };
  },

  async findBestProductForBudget(args) {
    const filters: ProductFilters = {
      category: str(args.category),
      maxPrice: num(args.budget),
      tags: arr(args.tags),
      minRamGb: num(args.minRamGb),
      limit: 8,
    };
    const ranked = await pickBest(filters);
    const best = ranked[0];
    if (!best) return { product: null, message: "No product matched those constraints." };
    const runnerUp = ranked[1];
    return {
      product: summarizeProduct(best, filters),
      alternatives: ranked.slice(1, 3).map((p) => summarizeProduct(p, filters)),
      whyBest: explainMatch(best, filters),
      vsNext: runnerUp
        ? `${best.name} scores higher than ${runnerUp.name} for the stated constraints while staying at ${formatInr(best.price)}.`
        : undefined,
    };
  },

  async addToCart(args, ctx) {
    const cart = await addToCart(ctx.userId, String(args.productId), num(args.quantity) ?? 1);
    return { ok: true, cart: slimCart(cart) };
  },

  async removeFromCart(args, ctx) {
    const cart = await removeFromCart(ctx.userId, String(args.productId));
    return { ok: true, cart: slimCart(cart) };
  },

  async updateCart(args, ctx) {
    const cart = await updateCart(ctx.userId, String(args.productId), num(args.quantity) ?? 1);
    return { ok: true, cart: slimCart(cart) };
  },

  async getCart(_args, ctx) {
    return slimCart(await viewCart(ctx.userId));
  },

  async calculateCartTotal(_args, ctx) {
    return calculateCartTotal(ctx.userId);
  },

  async clearCart(args, ctx) {
    if (!args.confirmed && !ctx.confirmed) {
      return { needsConfirmation: true, summary: "Clear every item from the cart." };
    }
    return { ok: true, cart: slimCart(await clearCart(ctx.userId)) };
  },

  async getOrderStatus(args, ctx) {
    if (args.orderId) return getOrderStatus(ctx.userId, String(args.orderId));
    const list = await listOrders(ctx.userId);
    if (!list.length) return { message: "No orders yet." };
    return getOrderStatus(ctx.userId, list[0].id);
  },

  async getUserPreferences(_args, ctx) {
    const user = await users.findById(ctx.userId);
    return user?.preferences ?? {};
  },

  async saveUserPreference(args, ctx) {
    const user = await users.findById(ctx.userId);
    if (!user) return { ok: false };
    const preferences = {
      ...user.preferences,
      budget: num(args.budget) ?? user.preferences.budget,
      categories: arr(args.categories) ?? user.preferences.categories,
      brands: arr(args.brands) ?? user.preferences.brands,
      notes: str(args.notes) ?? user.preferences.notes,
    };
    await users.update(ctx.userId, { preferences });
    return { ok: true, preferences };
  },

  async getProductReviews(args) {
    const list = await getReviews(String(args.productId));
    return { reviews: list.slice(0, 6) };
  },

  async generateProductSummary(args) {
    return generateProductSummary(String(args.productId));
  },

  async recommendBundle(args) {
    const theme = (str(args.theme) ?? "wfh").toLowerCase();
    const budget = num(args.budget);
    const catalog = await productStore.all();
    const ids = arr(args.productIds);
    if (ids?.length) return analyticsBundle(ids);

    const pick = (id: string) => catalog.find((p) => p.id === id);
    let plan: (Product | undefined)[] = [];
    if (theme.includes("game")) {
      plan = [pick("p_asus_tuf15"), pick("p_headset_jbl"), pick("p_razer_deathadder"), pick("p_monitor_samsung27")];
    } else if (theme.includes("phone")) {
      plan = [pick("p_nord_ce4"), pick("p_phone_case"), pick("p_screen_glass"), pick("p_charger_65")];
    } else {
      plan = [
        pick("p_asus_vivobook15"),
        pick("p_lg_24"),
        pick("p_logi_k380"),
        pick("p_logi_m331"),
        pick("p_sony_ch720"),
      ];
    }
    let items = plan.filter((p): p is Product => Boolean(p));
    let total = items.reduce((s, p) => s + p.price, 0);
    if (budget != null && total > budget) {
      const swapped = catalog.find(
        (p) => p.category === "Laptops" && p.price < (items[0]?.price ?? 0) && p.tags.includes("coding"),
      );
      if (swapped) items = [swapped, ...items.slice(1)];
      total = items.reduce((s, p) => s + p.price, 0);
      while (total > budget && items.length > 1) {
        items = items.slice(0, -1);
        total = items.reduce((s, p) => s + p.price, 0);
      }
    }
    const discounted = Math.max(0, total - bundleDiscount);
    return {
      theme,
      budget,
      withinBudget: budget == null ? true : discounted <= budget,
      items: items.map((p) => summarizeProduct(p, budget != null ? { maxPrice: budget } : {})),
      subtotal: total,
      bundleDiscount,
      total: discounted,
      leftover: budget == null ? 0 : Math.max(0, budget - discounted),
    };
  },

  async getSalesAnalytics(args) {
    return getOverview(num(args.days) ?? 30);
  },

  async getConversionAnalytics() {
    const overview = await getOverview(30);
    const categories = await categoryPerformance();
    return {
      conversionRate: overview.conversionRate,
      addToCartRate: overview.addToCartRate,
      checkoutRate: overview.checkoutRate,
      categories,
    };
  },

  async getTopProducts(args) {
    return topProducts(num(args.limit) ?? 6);
  },

  async getAbandonedCartAnalytics() {
    const overview = await getOverview(30);
    return {
      abandonedCarts: overview.abandonedCarts,
      abandonedCartRate: overview.abandonedCartRate,
    };
  },

  async analyzeSales(args) {
    const days = num(args.days) ?? 30;
    const [overview, trends] = await Promise.all([getOverview(days), salesTrends(days)]);
    return { overview, trends };
  },

  async identifyGrowthOpportunities() {
    return identifyGrowthOpportunities();
  },

  async recommendOffer(args) {
    return recommendOffer(str(args.productId));
  },

  async getComplementary(args) {
    const product = await getProduct(String(args.productId));
    const extras = await complementaryProducts(product);
    return { extras: extras.map((p) => summarizeProduct(p)) };
  },
};

function slimCart(cart: Awaited<ReturnType<typeof viewCart>>) {
  return {
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,
    insights: cart.insights,
    items: cart.items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
    })),
  };
}

export async function executeTool(name: string, args: Record<string, unknown>, ctx: ToolContext) {
  const handler = toolHandlers[name];
  if (!handler) return { error: `Unknown tool: ${name}` };
  return handler(args, ctx);
}
