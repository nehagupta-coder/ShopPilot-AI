import type { ProductFilters } from "./productService.js";

const CATEGORIES: Record<string, string> = {
  laptop: "Laptops",
  laptops: "Laptops",
  notebook: "Laptops",
  phone: "Smartphones",
  phones: "Smartphones",
  smartphone: "Smartphones",
  mobile: "Smartphones",
  headphone: "Headphones",
  headphones: "Headphones",
  earbuds: "Headphones",
  monitor: "Monitors",
  monitors: "Monitors",
  display: "Monitors",
  keyboard: "Keyboards",
  keyboards: "Keyboards",
  mouse: "Mice",
  mice: "Mice",
  accessory: "Accessories",
  accessories: "Accessories",
};

export interface ParsedIntent {
  filters: ProductFilters;
  kind:
    | "search"
    | "compare"
    | "bundle"
    | "cart_add"
    | "cart_remove"
    | "cart_clear"
    | "cart_view"
    | "cart_optimize"
    | "order"
    | "growth"
    | "recommend"
    | "details"
    | "unknown";
  budget?: number;
  confirm?: boolean;
  raw: string;
}

function parseBudget(text: string): number | undefined {
  const lakh = text.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  if (lakh) return Math.round(Number(lakh[1]) * 100000);
  const k = text.match(/(?:under|below|within|<=?|₹|rs\.?)\s*(\d+)\s*k\b/i);
  if (k) return Number(k[1]) * 1000;
  const inr = text.match(/₹\s*([\d,]+)/);
  if (inr) return Number(inr[1].replace(/,/g, ""));
  const under = text.match(/(?:under|below|within|less than|upto|up to)\s*([\d,]+)/i);
  if (under) {
    const n = Number(under[1].replace(/,/g, ""));
    if (n < 1000) return n * 1000;
    return n;
  }
  const bare = text.match(/\b(\d{4,6})\b/);
  if (bare && /budget|under|below|₹|rs/.test(text)) return Number(bare[1]);
  return undefined;
}

export function parseNaturalLanguage(input: string): ParsedIntent {
  const raw = input.trim();
  const text = raw.toLowerCase();
  const budget = parseBudget(text);
  const filters: ProductFilters = {};
  if (budget) filters.maxPrice = budget;

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (new RegExp(`\\b${key}\\b`).test(text)) {
      filters.category = cat;
      break;
    }
  }

  const ram = text.match(/(\d+)\s*gb\s*ram/);
  if (ram) filters.minRamGb = Number(ram[1]);
  else if (/16\s*gb/.test(text) && filters.category === "Laptops") filters.minRamGb = 16;
  else if (/coding|developer|programming/.test(text) && filters.category === "Laptops") filters.minRamGb = 16;

  const tags: string[] = [];
  if (/coding|developer|programming|vs code/.test(text)) tags.push("coding");
  if (/gaming|rtx|fps/.test(text)) tags.push("gaming");
  if (/light\s*weight|lightweight|travel|portable/.test(text)) tags.push("lightweight");
  if (/battery/.test(text)) tags.push("battery");
  if (/cheap|budget|value/.test(text)) tags.push("value");
  if (/wfh|work from home|work-from-home|setup/.test(text)) tags.push("wfh");
  if (tags.length) filters.tags = tags;
  filters.q = raw;

  const confirm = /\b(yes|yeah|yep|confirm|proceed|go ahead|do it|ok|okay|sure)\b/.test(text);

  let kind: ParsedIntent["kind"] = "search";
  if (/why.*(conversion|sales|drop)|growth|promote|bundle|aov|average order|abandoned|offer should|improve conversion/.test(text) &&
      /dashboard|merchant|sales|conversion|bundle|offer|aov|promote|growth/.test(text + " growth")) {
    // refined below
  }
  if (
    /conversion|sales this|promote|bought together|average order|abandoned|which products|offer should|growth/.test(text) &&
    !/add to cart|laptop|phone/.test(text)
  ) {
    kind = "growth";
  } else if (/compar/.test(text)) kind = "compare";
  else if (/setup|bundle|build me|work.from.home|gaming setup/.test(text)) kind = "bundle";
  else if (/clear.*cart|remove everything|empty.*cart/.test(text)) kind = "cart_clear";
  else if (/remove .*cart|remove it/.test(text)) kind = "cart_remove";
  else if (/add .*cart|add the best|add it/.test(text)) kind = "cart_add";
  else if (/optimiz.*cart|best value.*cart/.test(text)) kind = "cart_optimize";
  else if (/my cart|what's in my cart|show cart/.test(text)) kind = "cart_view";
  else if (/order status|my order|where is my/.test(text)) kind = "order";
  else if (/recommend|best value product|what's the best/.test(text)) kind = "recommend";
  else if (/details|tell me about|specs/.test(text)) kind = "details";

  return { filters, kind, budget, confirm, raw };
}
