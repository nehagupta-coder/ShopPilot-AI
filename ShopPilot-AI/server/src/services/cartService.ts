import { carts, products as productStore } from "../data/store.js";
import { bundleDiscount, complementaryMap } from "../seed/catalog.js";
import { badRequest, notFound } from "../utils/errors.js";
import { createId, nowIso } from "../utils/id.js";
import type { Cart, Product } from "../types/index.js";

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

function emptyCart(userId: string): Cart {
  return { id: createId("cart"), userId, items: [], updatedAt: nowIso() };
}

export async function getOrCreateCart(userId: string): Promise<Cart> {
  return (await carts.findByUser(userId)) ?? emptyCart(userId);
}

export async function viewCart(userId: string): Promise<CartView> {
  const cart = await getOrCreateCart(userId);
  const catalog = await productStore.all();
  const lines: CartLine[] = [];
  for (const item of cart.items) {
    const product = catalog.find((p) => p.id === item.productId);
    if (!product) continue;
    lines.push({ product, quantity: item.quantity, lineTotal: product.price * item.quantity });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const categories = new Set(lines.map((l) => l.product.category));
  const hasLaptop = categories.has("Laptops");
  const accessoryCount = lines.filter((l) =>
    ["Mice", "Keyboards", "Accessories", "Headphones"].includes(l.product.category),
  ).length;
  const discount = hasLaptop && accessoryCount >= 2 ? bundleDiscount : 0;
  const insights: string[] = [];
  if (hasLaptop && accessoryCount < 2) {
    insights.push(`Add a stand and a mouse to unlock a ${formatBundle()} bundle saving.`);
  }
  if (discount) {
    insights.push(`Bundle discount of ₹${bundleDiscount.toLocaleString("en-IN")} applied.`);
  }
  const remainingForBundle = Math.max(0, 50000 - (subtotal - discount));
  if (subtotal > 0 && remainingForBundle > 0 && subtotal < 50000) {
    insights.push(`You're ₹${remainingForBundle.toLocaleString("en-IN")} away from a ₹50,000 cart milestone.`);
  }
  if (!lines.length) insights.push("Your cart is empty. Ask ShopPilot to build a setup for you.");

  const upsellIds = new Set<string>();
  for (const line of lines) {
    (complementaryMap[line.product.category] ?? []).forEach((id) => upsellIds.add(id));
  }
  const inCart = new Set(lines.map((l) => l.product.id));
  const upsells = catalog.filter((p) => upsellIds.has(p.id) && !inCart.has(p.id)).slice(0, 4);

  return {
    id: cart.id,
    userId,
    items: lines,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    insights,
    upsells,
  };
}

function formatBundle() {
  return `₹${bundleDiscount.toLocaleString("en-IN")}`;
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const product = await productStore.findById(productId);
  if (!product) throw notFound("Product");
  if (quantity < 1) throw badRequest("Quantity must be at least 1");
  if (product.stock < quantity) throw badRequest("Not enough stock");
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ productId, quantity });
  cart.updatedAt = nowIso();
  await carts.upsert(cart);
  return viewCart(userId);
}

export async function updateCart(userId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
  } else {
    const existing = cart.items.find((i) => i.productId === productId);
    if (!existing) throw notFound("Cart item");
    existing.quantity = quantity;
  }
  cart.updatedAt = nowIso();
  await carts.upsert(cart);
  return viewCart(userId);
}

export async function removeFromCart(userId: string, productId: string) {
  return updateCart(userId, productId, 0);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.updatedAt = nowIso();
  await carts.upsert(cart);
  return viewCart(userId);
}

export async function calculateCartTotal(userId: string) {
  const view = await viewCart(userId);
  return { subtotal: view.subtotal, discount: view.discount, total: view.total, itemCount: view.itemCount };
}
