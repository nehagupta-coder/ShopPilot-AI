import { events, orders, products as productStore, carts } from "../data/store.js";
import { createId, nowIso } from "../utils/id.js";
import type { AnalyticsEvent, AnalyticsEventType } from "../types/index.js";

export async function trackEvent(input: {
  userId?: string;
  eventType: AnalyticsEventType;
  productId?: string;
  metadata?: Record<string, unknown>;
}) {
  const event: AnalyticsEvent = {
    id: createId("evt"),
    userId: input.userId,
    eventType: input.eventType,
    productId: input.productId,
    metadata: input.metadata,
    createdAt: nowIso(),
  };
  await events.create(event);
  return event;
}

function inPeriod(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 86400000;
}

export async function getOverview(days = 30) {
  const [allEvents, allOrders, allProducts, allCarts] = await Promise.all([
    events.all(),
    orders.all(),
    productStore.all(),
    carts.all(),
  ]);
  const ev = allEvents.filter((e) => inPeriod(e.createdAt, days));
  const ords = allOrders.filter((o) => inPeriod(o.createdAt, days));
  const views = ev.filter((e) => e.eventType === "product_view").length;
  const addToCarts = ev.filter((e) => e.eventType === "add_to_cart").length;
  const checkouts = ev.filter((e) => e.eventType === "checkout_started").length;
  const purchases = ev.filter((e) => e.eventType === "purchase").length;
  const searches = ev.filter((e) => e.eventType === "search").length;
  const aiChats = ev.filter((e) => e.eventType === "ai_conversation").length;
  const recClicks = ev.filter((e) => e.eventType === "recommendation_clicked").length;
  const revenue = ords.reduce((s, o) => s + o.total, 0);
  const aov = ords.length ? Math.round(revenue / ords.length) : 0;
  const conversionRate = views ? Number(((purchases / views) * 100).toFixed(2)) : 0;
  const addToCartRate = views ? Number(((addToCarts / views) * 100).toFixed(2)) : 0;
  const checkoutRate = addToCarts ? Number(((checkouts / addToCarts) * 100).toFixed(2)) : 0;
  const abandoned = allCarts.filter((c) => c.items.length > 0).length;
  const abandonedRate = addToCarts
    ? Number(((Math.max(addToCarts - purchases, 0) / addToCarts) * 100).toFixed(2))
    : 0;
  const buyerIds = new Set(ords.map((o) => o.userId));
  const repeat = [...buyerIds].filter((id) => ords.filter((o) => o.userId === id).length > 1).length;

  return {
    days,
    revenue,
    orders: ords.length,
    conversionRate,
    averageOrderValue: aov,
    productViews: views,
    searches,
    aiConversations: aiChats,
    recommendationClicks: recClicks,
    addToCarts,
    addToCartRate,
    checkouts,
    checkoutRate,
    purchases,
    abandonedCarts: abandoned,
    abandonedCartRate: abandonedRate,
    repeatCustomers: repeat,
    catalogSize: allProducts.length,
  };
}

export async function salesTrends(days = 30) {
  const allOrders = await orders.all();
  const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const order of allOrders) {
    const key = order.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  }
  return [...buckets.values()];
}

export async function topProducts(limit = 6) {
  const [allEvents, allProducts] = await Promise.all([events.all(), productStore.all()]);
  return allProducts
    .map((p) => {
      const views = allEvents.filter((e) => e.productId === p.id && e.eventType === "product_view").length;
      const carts = allEvents.filter((e) => e.productId === p.id && e.eventType === "add_to_cart").length;
      const purchases = allEvents.filter(
        (e) => e.eventType === "purchase" && (e.metadata?.productIds as string[] | undefined)?.includes(p.id),
      ).length;
      const conversion = views ? Number(((Math.max(purchases, carts * 0.35) / views) * 100).toFixed(1)) : 0;
      return { product: p, views, addToCarts: carts, purchases, conversion };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function categoryPerformance() {
  const [allEvents, allProducts] = await Promise.all([events.all(), productStore.all()]);
  const cats = [...new Set(allProducts.map((p) => p.category))];
  return cats.map((category) => {
    const ids = new Set(allProducts.filter((p) => p.category === category).map((p) => p.id));
    const views = allEvents.filter((e) => e.productId && ids.has(e.productId) && e.eventType === "product_view").length;
    const carts = allEvents.filter((e) => e.productId && ids.has(e.productId) && e.eventType === "add_to_cart").length;
    const conversion = views ? Number(((carts / views) * 100).toFixed(1)) : 0;
    return { category, views, addToCarts: carts, conversion };
  });
}

export async function identifyGrowthOpportunities() {
  const [perf, overview, cats] = await Promise.all([
    topProducts(12),
    getOverview(30),
    categoryPerformance(),
  ]);
  const avgConv =
    perf.reduce((s, p) => s + p.conversion, 0) / Math.max(perf.length, 1);
  const highViewLowConv = perf.filter((p) => p.views > 20 && p.conversion < avgConv * 0.75);
  const weakCategory = [...cats].sort((a, b) => a.conversion - b.conversion)[0];
  const opportunities = [];

  if (highViewLowConv.length) {
    const names = highViewLowConv.slice(0, 2).map((p) => p.product.name).join(" and ");
    opportunities.push({
      title: "Opportunity detected",
      insight: `${names} receive high traffic but convert below the catalog average of ${avgConv.toFixed(1)}%.`,
      recommendation: "Try a 5% limited-time discount or bundle these products with complementary accessories.",
      expectedImpact: "Bundling accessories typically lifts average order value and recovers abandoned interest.",
      type: "conversion",
    });
  }

  if (weakCategory) {
    opportunities.push({
      title: "Category to promote",
      insight: `${weakCategory.category} has the lowest view-to-cart conversion (${weakCategory.conversion}%).`,
      recommendation: `Feature a curated ${weakCategory.category.toLowerCase()} collection on the home page and let the AI agent lead with value explainers.`,
      expectedImpact: "Clearer merchandising plus explainable recommendations can lift cart rate without cutting margin.",
      type: "category",
    });
  }

  if (overview.abandonedCartRate > 40) {
    opportunities.push({
      title: "Abandoned carts",
      insight: `${overview.abandonedCartRate}% of add-to-cart events are not completing as purchases in the demo window.`,
      recommendation: "Offer a bundle reminder in the cart AI: stand + mouse with laptop unlocks ₹1,200 off.",
      expectedImpact: "Recovering even 10% of abandoned carts would raise revenue without new traffic.",
      type: "cart",
    });
  }

  if (overview.averageOrderValue < 45000) {
    opportunities.push({
      title: "Increase AOV",
      insight: `Average order value is ₹${overview.averageOrderValue.toLocaleString("en-IN")}. Work-from-home bundles sit well above this.`,
      recommendation: "Prompt the shopping agent to assemble WFH or gaming setups instead of single SKUs.",
      expectedImpact: "Setup-style carts can raise AOV by attaching monitors, keyboards, and audio.",
      type: "aov",
    });
  }

  return { opportunities, generatedAt: nowIso(), source: "seeded demo analytics" };
}

export async function recommendOffer(productId?: string) {
  const catalog = await productStore.all();
  const product = productId ? catalog.find((p) => p.id === productId) : undefined;
  if (product) {
    return {
      productId: product.id,
      headline: `5% flash offer on ${product.name}`,
      copy: `Drop ${product.name} from ₹${product.price.toLocaleString("en-IN")} to ₹${Math.round(product.price * 0.95).toLocaleString("en-IN")} for 48 hours, or bundle it with a stand and mouse for ₹1,200 off.`,
      expectedLift: "High-view items typically respond faster to a short, clearly framed offer than a permanent markdown.",
    };
  }
  return {
    headline: "Weekend accessory attach offer",
    copy: "Laptop + stand + mouse unlocks ₹1,200 off. Promote it in the agent and on the cart page.",
    expectedLift: "Attach-rate offers raise AOV without discounting hero SKUs.",
  };
}

export async function recommendBundle(productIds: string[] = []) {
  const catalog = await productStore.all();
  const chosen = productIds
    .map((id) => catalog.find((p) => p.id === id))
    .filter(Boolean);
  if (chosen.length >= 2) {
    const total = chosen.reduce((s, p) => s + (p?.price ?? 0), 0);
    return {
      items: chosen,
      total,
      discounted: Math.max(0, total - 1200),
      rationale: "These items are frequently bought together in the demo catalog relationships.",
    };
  }
  const laptop = catalog.find((p) => p.id === "p_asus_vivobook15");
  const extras = ["p_stand_alum", "p_logi_m331", "p_lg_24", "p_logi_k380"]
    .map((id) => catalog.find((p) => p.id === id))
    .filter(Boolean);
  const items = [laptop, ...extras].filter(Boolean);
  const total = items.reduce((s, p) => s + (p?.price ?? 0), 0);
  return {
    name: "Work-from-home starter",
    items,
    total,
    discounted: total - 1200,
    rationale: "Laptop + display + input + ergonomics is the highest attach pattern in this catalog.",
  };
}
