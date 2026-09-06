import { conversations } from "../data/store.js";
import { isMockAI } from "../config/env.js";
import { executeTool, type ToolContext } from "../tools/registry.js";
import { getAIProvider, type ProviderMessage } from "./providers.js";
import { planMockTools } from "./mockPlanner.js";
import { trackEvent } from "../services/analyticsService.js";
import { createId, formatInr, nowIso } from "../utils/id.js";
import type {
  AgentChatResult,
  AgentStep,
  ChatMessage,
  Conversation,
  PendingAction,
  Product,
} from "../types/index.js";
import { products as productStore } from "../data/store.js";

const SHOP_SYSTEM = `You are ShopPilot, an agentic shopping copilot for an Indian electronics store.
You MUST use tools to read catalog, cart, orders, and analytics. Never invent product names or prices.
Always explain WHY a product fits (budget, RAM, battery, weight, rating, value).
Currency is INR. Be concise, warm, and specific.
For destructive actions (clear cart, large removals) ask for confirmation and do not execute until confirmed.
Never process real payments. Checkout is a mock.
When you recommend, name the product and price.`;

const GROWTH_SYSTEM = `You are ShopPilot Growth Advisor for a merchant dashboard.
Use analytics tools on the demo database. Do not invent real-world market data.
Return: opportunity, recommendation, expected impact. Label insights as AI-generated from seeded analytics.
Be practical and specific.`;

function step(label: string, tool?: string): AgentStep {
  return { id: createId("step"), label, status: "done", tool };
}

function collectIds(result: unknown, acc: string[]) {
  if (!result || typeof result !== "object") return;
  const obj = result as Record<string, unknown>;
  if (typeof obj.id === "string" && obj.id.startsWith("p_")) acc.push(obj.id);
  if (obj.product && typeof obj.product === "object") collectIds(obj.product, acc);
  for (const key of ["products", "items", "alternatives", "extras"]) {
    if (Array.isArray(obj[key])) obj[key].forEach((x) => collectIds(x, acc));
  }
}

function collectProducts(result: unknown, map: Map<string, Record<string, unknown>>) {
  if (!result || typeof result !== "object") return;
  const obj = result as Record<string, unknown>;
  if (typeof obj.id === "string" && obj.id.startsWith("p_") && obj.name) map.set(obj.id, obj);
  if (obj.product) collectProducts(obj.product, map);
  for (const key of ["products", "items", "alternatives", "extras"]) {
    if (Array.isArray(obj[key])) obj[key].forEach((x) => collectProducts(x, map));
  }
}

async function hydrateProducts(ids: string[]): Promise<Product[]> {
  const all = await productStore.all();
  return ids
    .filter((id, i, a) => a.indexOf(id) === i)
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

function mockNarrative(
  userText: string,
  toolLog: { name: string; result: unknown }[],
  mode: "shopping" | "growth",
): string {
  if (mode === "growth") {
    const bundle = toolLog.find((t) => t.name === "recommendBundle")?.result as
      | { items?: { name?: string; price?: number }[]; name?: string; total?: number; discounted?: number; rationale?: string }
      | undefined;
    if (bundle?.items?.length) {
      const lines = bundle.items
        .map((i) => `• ${i.name ?? "Item"}`)
        .join("\n");
      return [
        "I looked at catalog attach patterns (related products and complementary categories) in this demo store.",
        "",
        `**Recommended bundle:** ${bundle.name ?? "Work-from-home starter"}`,
        lines,
        "",
        `**Bundle price:** ${formatInr(bundle.discounted ?? bundle.total ?? 0)} after the ₹1,200 attach offer.`,
        "",
        `**Why:** ${bundle.rationale ?? "These SKUs are frequently paired in the catalog relationships."}`,
        "",
        "**Expected impact:** Promoting this bundle in the shopping agent and on the cart page should lift average order value without discounting the hero laptop.",
        "",
        "These insights are AI-generated from this application's demo catalog relationships.",
      ].join("\n");
    }
    const offer = toolLog.find((t) => t.name === "recommendOffer")?.result as
      | { headline?: string; copy?: string; expectedLift?: string }
      | undefined;
    if (offer?.headline) {
      return [
        "I analysed top-traffic products in the seeded analytics.",
        "",
        `**Opportunity:** ${offer.headline}`,
        offer.copy ?? "",
        "",
        `**Expected impact:** ${offer.expectedLift ?? "A short, framed offer usually beats a permanent markdown."}`,
        "",
        "These insights are AI-generated from this application's demo events and catalog.",
      ].join("\n");
    }
    const opp = toolLog.find((t) => t.name === "identifyGrowthOpportunities")?.result as
      | { opportunities?: { title: string; insight: string; recommendation: string; expectedImpact: string }[] }
      | undefined;
    const first = opp?.opportunities?.[0];
    if (first) {
      return [
        "I analysed the seeded demo analytics (not live market data).",
        "",
        `**${first.title}**`,
        first.insight,
        "",
        `**Recommendation:** ${first.recommendation}`,
        "",
        `**Expected impact:** ${first.expectedImpact}`,
        "",
        "These insights are AI-generated from this application's demo events, orders, and catalog.",
      ].join("\n");
    }
    return "I pulled the latest demo analytics. Ask me about conversion, bundles, or which products to promote.";
  }

  const best = toolLog.find((t) => t.name === "findBestProductForBudget")?.result as
    | { product?: { name: string; priceLabel: string; reasons?: string[] }; whyBest?: string[] }
    | undefined;
  const search = toolLog.find((t) => t.name === "searchProducts")?.result as
    | { products?: { name: string; priceLabel: string; reasons?: string[]; id: string }[]; total?: number }
    | undefined;
  const bundle = toolLog.find((t) => t.name === "recommendBundle")?.result as
    | {
        items?: { name: string; priceLabel: string }[];
        total?: number;
        leftover?: number;
        withinBudget?: boolean;
      }
    | undefined;
  const cart = toolLog.find((t) => t.name === "addToCart" || t.name === "getCart")?.result as
    | { cart?: { total: number; items: { name: string }[] }; ok?: boolean; items?: { name: string }[]; total?: number }
    | undefined;
  const order = toolLog.find((t) => t.name === "getOrderStatus")?.result as
    | { status?: string; orderId?: string; estimatedDelivery?: string; message?: string }
    | undefined;

  if (order?.orderId) {
    return `Your latest order **${order.orderId}** is **${order.status}**. Estimated delivery ${new Date(order.estimatedDelivery ?? "").toLocaleDateString("en-IN")}. This is a mock fulfilment timeline — no real shipment.`;
  }
  if (order?.message) return order.message;

  if (bundle?.items?.length) {
    const lines = bundle.items.map((i) => `• ${i.name} — ${i.priceLabel}`).join("\n");
    return [
      `I built a setup that stays ${bundle.withinBudget ? "inside" : "as close as possible to"} your budget.`,
      "",
      lines,
      "",
      `**Bundle total:** ${formatInr(bundle.total ?? 0)} (includes ₹1,200 accessory bundle saving).`,
      bundle.leftover ? `You still have ${formatInr(bundle.leftover)} of headroom.` : "",
      "",
      "Say **add this setup to my cart** and I'll add the items after you confirm.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (cart?.ok || cart?.cart) {
    const view = cart.cart ?? cart;
    const names = view.items?.map((i) => i.name).join(", ");
    return `Done. I've updated your cart${names ? ` (${names})` : ""}. Running total is ${formatInr(view.total ?? 0)}.`;
  }

  const winner = best?.product ?? search?.products?.[0];
  if (winner) {
    const reasons = (best?.whyBest ?? winner.reasons ?? []).map((r) => `✓ ${r}`).join("\n");
    const alts = (search?.products ?? []).slice(0, 3);
    const altLine =
      alts.length > 1
        ? `\nI also shortlisted ${alts
            .slice(1)
            .map((p) => p.name)
            .join(" and ")} so you can compare.`
        : "";
    return [
      `Recommended: **${winner.name}** at **${winner.priceLabel}**.`,
      "",
      "Recommended because:",
      reasons || "✓ Strong match for the constraints you gave",
      altLine,
      "",
      "Ask me to **compare the best three**, **add the best one to my cart**, or tighten a constraint.",
    ].join("\n");
  }

  return `I understood “${userText}”. Tell me a category and budget — for example, a coding laptop under ₹70,000 — and I'll search the live catalog.`;
}

export async function runAgent(input: {
  userId: string;
  role: "customer" | "merchant";
  message: string;
  conversationId?: string;
  mode?: "shopping" | "growth";
  confirmActionId?: string;
}): Promise<AgentChatResult> {
  const mode = input.mode ?? (input.role === "merchant" && /growth|sales|conversion/.test(input.message) ? "growth" : "shopping");
  const provider = getAIProvider();
  const mockMode = provider.mock || isMockAI();

  let convo: Conversation | null = input.conversationId
    ? await conversations.findById(input.conversationId)
    : null;
  if (convo && convo.userId !== input.userId) convo = null;
  if (!convo) {
    const createdAt = nowIso();
    convo = {
      id: createId("convo"),
      userId: input.userId,
      title: input.message.slice(0, 72),
      mode,
      messages: [],
      createdAt,
      updatedAt: createdAt,
    };
  }

  const userMsg: ChatMessage = {
    id: createId("msg"),
    role: "user",
    content: input.message,
    createdAt: nowIso(),
  };
  convo.messages.push(userMsg);

  const lastIds = collectLastIds(convo);
  const pending = convo.messages
    .slice()
    .reverse()
    .find((m) => m.pendingAction)?.pendingAction;

  const steps: AgentStep[] = [step("Understanding requirements")];
  const toolLog: { name: string; result: unknown }[] = [];
  let pendingAction: PendingAction | undefined;
  let lastProductIds = lastIds;

  const ctx: ToolContext = {
    userId: input.userId,
    role: input.role,
    lastProductIds: lastIds,
    confirmed: Boolean(input.confirmActionId && pending && input.confirmActionId === pending.id),
  };

  if (mockMode) {
    const plan = planMockTools(input.message, { lastProductIds: lastIds, pending, mode });
    pendingAction = plan.pending;
    if (plan.pending) {
      steps.push(step("Waiting for confirmation"));
    }
    for (const call of plan.toolCalls) {
      steps.push(step(labelForTool(call.name), call.name));
      const result = await executeTool(call.name, call.arguments, { ...ctx, confirmed: plan.confirm || ctx.confirmed });
      toolLog.push({ name: call.name, result });
      const ids: string[] = [];
      collectIds(result, ids);
      if (ids.length) lastProductIds = ids;
    }
  } else {
    const history: ProviderMessage[] = [
      { role: "system", content: mode === "growth" ? GROWTH_SYSTEM : SHOP_SYSTEM },
      ...convo.messages.slice(-12).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];
    let loops = 0;
    while (loops < 6) {
      loops += 1;
      const reply = await provider.complete(history);
      if (!reply.toolCalls.length) {
        const assistantMsg = finish({
          convo,
          content: reply.content,
          steps,
          lastProductIds,
          toolLog,
          pendingAction,
          mockMode,
        });
        await persist(convo, assistantMsg);
        await trackEvent({ userId: input.userId, eventType: "ai_conversation", metadata: { mode } });
        return assistantMsg;
      }
      history.push({
        role: "assistant",
        content: reply.content,
        toolCalls: reply.toolCalls,
      });
      for (const call of reply.toolCalls) {
        steps.push(step(labelForTool(call.name), call.name));
        if (call.name === "clearCart" && !ctx.confirmed) {
          pendingAction = {
            id: createId("act"),
            type: "clearCart",
            summary: "Clear every item from your cart",
            payload: call.arguments,
          };
          history.push({
            role: "tool",
            toolCallId: call.id,
            content: JSON.stringify({ needsConfirmation: true }),
          });
          continue;
        }
        const result = await executeTool(call.name, call.arguments, ctx);
        toolLog.push({ name: call.name, result });
        const ids: string[] = [];
        collectIds(result, ids);
        if (ids.length) lastProductIds = ids;
        history.push({
          role: "tool",
          toolCallId: call.id,
          content: JSON.stringify(result),
        });
      }
    }
    const fallback = mockNarrative(input.message, toolLog, mode);
    const assistantMsg = finish({ convo, content: fallback, steps, lastProductIds, toolLog, pendingAction, mockMode });
    await persist(convo, assistantMsg);
    return assistantMsg;
  }

  const content = pendingAction
    ? `I can ${pendingAction.summary.toLowerCase()}. Do you want me to proceed? I will not do this until you confirm.`
    : mockNarrative(input.message, toolLog, mode);

  const assistantMsg = finish({ convo, content, steps, lastProductIds, toolLog, pendingAction, mockMode });
  await persist(convo, assistantMsg);
  await trackEvent({ userId: input.userId, eventType: "ai_conversation", metadata: { mode } });
  return assistantMsg;
}

function collectLastIds(convo: Conversation): string[] {
  for (const m of [...convo.messages].reverse()) {
    if (m.products?.length) return m.products.map((p) => p.id);
    if (m.comparison?.length) return m.comparison.map((p) => p.id);
  }
  return [];
}

function labelForTool(name: string): string {
  const map: Record<string, string> = {
    searchProducts: "Searching products",
    getProductDetails: "Reading product details",
    compareProducts: "Comparing products",
    getRecommendations: "Ranking recommendations",
    findBestProductForBudget: "Selecting best match",
    addToCart: "Adding product to cart",
    removeFromCart: "Removing from cart",
    updateCart: "Updating cart",
    getCart: "Reading cart",
    calculateCartTotal: "Calculating total",
    clearCart: "Clearing cart",
    getOrderStatus: "Checking order status",
    getUserPreferences: "Loading preferences",
    saveUserPreference: "Saving preference",
    getProductReviews: "Reading reviews",
    generateProductSummary: "Writing product summary",
    recommendBundle: "Building a bundle",
    getSalesAnalytics: "Reading sales analytics",
    getConversionAnalytics: "Analysing conversion",
    getTopProducts: "Ranking product performance",
    getAbandonedCartAnalytics: "Inspecting abandoned carts",
    analyzeSales: "Analysing sales",
    identifyGrowthOpportunities: "Finding growth opportunities",
    recommendOffer: "Drafting an offer",
  };
  return map[name] ?? name;
}

function finish(input: {
  convo: Conversation;
  content: string;
  steps: AgentStep[];
  lastProductIds: string[];
  toolLog: { name: string; result: unknown }[];
  pendingAction?: PendingAction;
  mockMode: boolean;
}): AgentChatResult {
  const map = new Map<string, Record<string, unknown>>();
  input.toolLog.forEach((t) => collectProducts(t.result, map));
  const compareCall = input.toolLog.some((t) => t.name === "compareProducts" || t.name === "searchProducts");
  return {
    conversationId: input.convo.id,
    message: {
      id: createId("msg"),
      role: "assistant",
      content: input.content,
      createdAt: nowIso(),
      steps: input.steps,
      pendingAction: input.pendingAction,
    },
    steps: input.steps,
    products: [],
    comparison: [],
    pendingAction: input.pendingAction,
    mockMode: input.mockMode,
    _ids: input.lastProductIds,
    _compare: compareCall,
  } as AgentChatResult & { _ids: string[]; _compare: boolean };
}

async function persist(
  convo: Conversation,
  result: AgentChatResult & { _ids?: string[]; _compare?: boolean },
) {
  const products = await hydrateProducts(result._ids ?? []);
  const isCompare =
    result._compare &&
    products.length >= 2 &&
    /compar/i.test(convo.messages[convo.messages.length - 1]?.content ?? "");
  result.products = isCompare ? [] : products.slice(0, 4);
  result.comparison = isCompare ? products.slice(0, 3) : products.length >= 3 && /compar/i.test(result.message.content) ? products.slice(0, 3) : [];
  if (!result.comparison.length && /compar/i.test(result.message.content)) {
    result.comparison = products.slice(0, 3);
    result.products = [];
  }
  result.message.products = result.products;
  result.message.comparison = result.comparison;
  convo.messages.push(result.message);
  convo.updatedAt = nowIso();
  await conversations.upsert(convo);
}

export async function listConversations(userId: string, mode?: "shopping" | "growth") {
  return conversations.byUser(userId, mode);
}

export async function getConversation(userId: string, id: string) {
  const convo = await conversations.findById(id);
  if (!convo || convo.userId !== userId) return null;
  return convo;
}

