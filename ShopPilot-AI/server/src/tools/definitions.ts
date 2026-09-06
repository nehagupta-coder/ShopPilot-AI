import type { ToolDefinition } from "../types/index.js";

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "searchProducts",
    description: "Search the catalog with structured filters extracted from the user request.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string" },
        maxPrice: { type: "number" },
        minPrice: { type: "number" },
        minRamGb: { type: "number" },
        minRating: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "getProductDetails",
    description: "Get a single product by id including specs.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
  },
  {
    name: "compareProducts",
    description: "Compare 2-4 products by id.",
    parameters: {
      type: "object",
      properties: {
        productIds: { type: "array", items: { type: "string" } },
      },
      required: ["productIds"],
    },
  },
  {
    name: "getRecommendations",
    description: "Rank products for the current user and requirements.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        maxPrice: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "findBestProductForBudget",
    description: "Pick the single best product in a category for a budget and preferences.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        budget: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        minRamGb: { type: "number" },
      },
      required: ["category", "budget"],
    },
  },
  {
    name: "addToCart",
    description: "Add a product to the user's cart. Use after the user asks to add something.",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["productId"],
    },
  },
  {
    name: "removeFromCart",
    description: "Remove one product from the cart.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
  },
  {
    name: "updateCart",
    description: "Set quantity for a cart line. Quantity 0 removes it.",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["productId", "quantity"],
    },
  },
  {
    name: "getCart",
    description: "Read the current cart with totals and insights.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "calculateCartTotal",
    description: "Return subtotal, discount and total only.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "clearCart",
    description: "Remove every item. Requires prior user confirmation.",
    parameters: {
      type: "object",
      properties: { confirmed: { type: "boolean" } },
    },
  },
  {
    name: "getOrderStatus",
    description: "Look up an order. If orderId omitted, use the latest order.",
    parameters: {
      type: "object",
      properties: { orderId: { type: "string" } },
    },
  },
  {
    name: "getUserPreferences",
    description: "Read saved shopping preferences.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "saveUserPreference",
    description: "Persist a preference such as budget or favourite category.",
    parameters: {
      type: "object",
      properties: {
        budget: { type: "number" },
        categories: { type: "array", items: { type: "string" } },
        brands: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "getProductReviews",
    description: "Fetch reviews for a product.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
  },
  {
    name: "generateProductSummary",
    description: "AI-ready summary of a product from catalog + reviews.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
  },
  {
    name: "recommendBundle",
    description: "Build a multi-product bundle, optionally under a budget.",
    parameters: {
      type: "object",
      properties: {
        theme: { type: "string", description: "wfh | gaming | travel | phone" },
        budget: { type: "number" },
        productIds: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "getSalesAnalytics",
    description: "Merchant: revenue, orders, conversion, AOV for a period.",
    parameters: {
      type: "object",
      properties: { days: { type: "number" } },
    },
  },
  {
    name: "getConversionAnalytics",
    description: "Merchant: view-to-cart and category conversion.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getTopProducts",
    description: "Merchant: highest traffic products with conversion.",
    parameters: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "getAbandonedCartAnalytics",
    description: "Merchant: abandoned cart snapshot.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "analyzeSales",
    description: "Merchant: sales trend plus narrative-ready totals.",
    parameters: {
      type: "object",
      properties: { days: { type: "number" } },
    },
  },
  {
    name: "identifyGrowthOpportunities",
    description: "Merchant: actionable growth opportunities from demo analytics.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "recommendOffer",
    description: "Merchant: suggest an offer, optionally for a product.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
    },
  },
];

export function toOpenAITools() {
  return toolDefinitions.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
