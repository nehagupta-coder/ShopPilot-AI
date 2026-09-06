import { parseNaturalLanguage } from "../services/nlSearch.js";
import type { PendingAction, ToolCall } from "../types/index.js";
import { createId } from "../utils/id.js";

export function planMockTools(
  message: string,
  ctx: { lastProductIds: string[]; pending?: PendingAction; mode: "shopping" | "growth" },
): { toolCalls: ToolCall[]; pending?: PendingAction; confirm?: boolean } {
  const parsed = parseNaturalLanguage(message);
  const calls: ToolCall[] = [];
  const add = (name: string, args: Record<string, unknown> = {}) =>
    calls.push({ id: createId("call"), name, arguments: args });

  if (ctx.pending && parsed.confirm) {
    add(ctx.pending.type, { ...ctx.pending.payload, confirmed: true });
    return { toolCalls: calls, confirm: true };
  }

  if (ctx.mode === "growth" || parsed.kind === "growth") {
    if (/bundle|bought together/.test(message.toLowerCase())) add("recommendBundle", { theme: "wfh" });
    else if (/offer|discount|promote/.test(message.toLowerCase())) {
      add("getTopProducts", { limit: 5 });
      add("recommendOffer", {});
    } else if (/conversion|why/.test(message.toLowerCase())) {
      add("getConversionAnalytics", {});
      add("identifyGrowthOpportunities", {});
    } else {
      add("analyzeSales", { days: 30 });
      add("identifyGrowthOpportunities", {});
    }
    return { toolCalls: calls };
  }

  switch (parsed.kind) {
    case "cart_add": {
      const id = ctx.lastProductIds[0];
      if (id) add("addToCart", { productId: id, quantity: 1 });
      else {
        add("findBestProductForBudget", {
          category: parsed.filters.category ?? "Laptops",
          budget: parsed.budget ?? 70000,
          tags: parsed.filters.tags,
          minRamGb: parsed.filters.minRamGb,
        });
      }
      break;
    }
    case "cart_remove":
      if (ctx.lastProductIds[0]) add("removeFromCart", { productId: ctx.lastProductIds[0] });
      else add("getCart", {});
      break;
    case "cart_clear":
      return {
        toolCalls: [],
        pending: {
          id: createId("act"),
          type: "clearCart",
          summary: "Clear every item from your cart",
          payload: {},
        },
      };
    case "cart_view":
    case "cart_optimize":
      add("getCart", {});
      if (parsed.kind === "cart_optimize") add("recommendBundle", { theme: "wfh", budget: parsed.budget ?? 80000 });
      break;
    case "compare":
      add("searchProducts", {
        query: parsed.raw,
        category: parsed.filters.category ?? "Smartphones",
        maxPrice: parsed.filters.maxPrice,
        tags: parsed.filters.tags,
        limit: 3,
      });
      break;
    case "bundle":
      add("recommendBundle", {
        theme: parsed.filters.tags?.includes("gaming") ? "gaming" : "wfh",
        budget: parsed.budget ?? 80000,
      });
      break;
    case "order":
      add("getOrderStatus", {});
      break;
    case "details":
      if (ctx.lastProductIds[0]) {
        add("getProductDetails", { productId: ctx.lastProductIds[0] });
        add("generateProductSummary", { productId: ctx.lastProductIds[0] });
      } else {
        add("searchProducts", { query: parsed.raw, limit: 3 });
      }
      break;
    case "recommend":
    case "search":
    default:
      if (parsed.filters.category || parsed.budget) {
        add("searchProducts", {
          query: parsed.raw,
          category: parsed.filters.category,
          maxPrice: parsed.filters.maxPrice,
          minRamGb: parsed.filters.minRamGb,
          tags: parsed.filters.tags,
          limit: 6,
        });
        if (parsed.filters.category && parsed.budget) {
          add("findBestProductForBudget", {
            category: parsed.filters.category,
            budget: parsed.budget,
            tags: parsed.filters.tags,
            minRamGb: parsed.filters.minRamGb,
          });
        }
      } else {
        add("getRecommendations", { limit: 4 });
      }
      break;
  }

  return { toolCalls: calls };
}
