import { products as productStore, reviews as reviewStore } from "../data/store.js";
import { complementaryMap } from "../seed/catalog.js";
import { notFound } from "../utils/errors.js";
import { formatInr } from "../utils/id.js";
import type { Product } from "../types/index.js";

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string[];
  minRamGb?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "popularity" | "discount";
  page?: number;
  limit?: number;
}

export function specValue(product: Product, key: string): string | undefined {
  const hit = product.specifications.find((s) => s.key.toLowerCase() === key.toLowerCase());
  return hit?.value;
}

export function ramGb(product: Product): number {
  const raw = specValue(product, "RAM") ?? "";
  const match = raw.match(/(\d+)\s*GB/i);
  return match ? Number(match[1]) : 0;
}

export function scoreProduct(product: Product, filters: ProductFilters): number {
  let score = product.rating * 12 + product.popularity * 0.4 + product.discount * 0.3;
  if (filters.maxPrice && product.price <= filters.maxPrice) {
    const headroom = (filters.maxPrice - product.price) / filters.maxPrice;
    score += (1 - Math.min(headroom, 0.45)) * 8;
  }
  if (filters.minRamGb && ramGb(product) >= filters.minRamGb) score += 10;
  if (filters.tags?.length) {
    const hits = filters.tags.filter((t) => product.tags.includes(t) || product.description.toLowerCase().includes(t));
    score += hits.length * 6;
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    if (product.name.toLowerCase().includes(q)) score += 8;
    if (product.tags.some((t) => q.includes(t))) score += 5;
  }
  if (product.batteryLifeHours && product.batteryLifeHours >= 8) score += 4;
  if (product.weightGrams && product.weightGrams <= 1650) score += 4;
  return score;
}

export function applyFilters(list: Product[], filters: ProductFilters): Product[] {
  return list.filter((p) => {
    if (filters.category && p.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.brand && p.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
    if (filters.minPrice != null && p.price < filters.minPrice) return false;
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.minRating != null && p.rating < filters.minRating) return false;
    if (filters.minRamGb != null && ramGb(p) < filters.minRamGb) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const blob = `${p.name} ${p.brand} ${p.category} ${p.description} ${p.tags.join(" ")} ${p.specifications.map((s) => s.value).join(" ")}`.toLowerCase();
      if (!blob.includes(q) && !q.split(/\s+/).every((w) => blob.includes(w))) {
        const words = q.split(/\s+/).filter((w) => w.length > 2);
        if (words.length && !words.some((w) => blob.includes(w))) return false;
      }
    }
    return true;
  });
}

export function sortProducts(list: Product[], sort: ProductFilters["sort"], filters: ProductFilters): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "discount":
      return copy.sort((a, b) => b.discount - a.discount);
    case "popularity":
      return copy.sort((a, b) => b.popularity - a.popularity);
    default:
      return copy.sort((a, b) => scoreProduct(b, filters) - scoreProduct(a, filters));
  }
}

export async function listProducts(filters: ProductFilters) {
  const all = await productStore.all();
  const filtered = applyFilters(all, filters);
  const sorted = sortProducts(filtered, filters.sort, filters);
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const start = (page - 1) * limit;
  return {
    items: sorted.slice(start, start + limit),
    total: sorted.length,
    page,
    pages: Math.max(1, Math.ceil(sorted.length / limit)),
  };
}

export async function getProduct(id: string): Promise<Product> {
  const product = await productStore.findById(id);
  if (!product) throw notFound("Product");
  return product;
}

export async function getRelated(id: string) {
  const product = await getProduct(id);
  const all = await productStore.all();
  const related = product.relatedProducts
    .map((rid) => all.find((p) => p.id === rid))
    .filter(Boolean) as Product[];
  const extras = all
    .filter((p) => p.id !== product.id && p.category === product.category && !related.some((r) => r.id === p.id))
    .slice(0, 4);
  return [...related, ...extras].slice(0, 6);
}

export async function compareProducts(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, 4);
  const items = await Promise.all(unique.map((id) => getProduct(id)));
  return items;
}

export function explainMatch(product: Product, filters: ProductFilters): string[] {
  const reasons: string[] = [];
  if (filters.maxPrice != null && product.price <= filters.maxPrice) {
    reasons.push(`Within your ${formatInr(filters.maxPrice)} budget (${formatInr(product.price)})`);
  }
  if (filters.minRamGb && ramGb(product) >= filters.minRamGb) {
    reasons.push(`${ramGb(product)}GB RAM meets your ${filters.minRamGb}GB requirement`);
  }
  const storage = specValue(product, "Storage");
  if (storage) reasons.push(`${storage} storage`);
  if (product.batteryLifeHours && (filters.tags?.includes("battery") || (product.batteryLifeHours ?? 0) >= 8)) {
    reasons.push(`${product.batteryLifeHours}h battery life`);
  }
  if (product.weightGrams && product.weightGrams <= 1650 && (filters.tags?.includes("lightweight") || true)) {
    if (filters.tags?.includes("lightweight") || product.weightGrams <= 1500) {
      reasons.push(`Lightweight at ${(product.weightGrams / 1000).toFixed(2)} kg`);
    }
  }
  reasons.push(`${product.rating}★ from ${product.reviewCount.toLocaleString("en-IN")} reviews`);
  if (product.discount >= 10) reasons.push(`${product.discount}% off the original price`);
  return reasons.slice(0, 6);
}

export async function generateProductSummary(id: string) {
  const product = await getProduct(id);
  const reviews = await reviewStore.byProduct(id);
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;
  const highlights = product.specifications.slice(0, 4).map((s) => `${s.key}: ${s.value}`);
  const text = `${product.name} is a ${product.category.toLowerCase().replace(/s$/, "")} from ${product.brand} priced at ${formatInr(product.price)} (${product.discount}% off). Reviewers rate it ${product.rating}★. Key specs — ${highlights.join(", ")}. ${product.description}`;
  return { summary: text, rating: avg, highlights };
}

export async function getCategories() {
  const all = await productStore.all();
  const map = new Map<string, number>();
  all.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}

export async function getBrands() {
  const all = await productStore.all();
  return [...new Set(all.map((p) => p.brand))].sort();
}

export async function complementaryProducts(product: Product) {
  const all = await productStore.all();
  const ids = complementaryMap[product.category] ?? [];
  return ids
    .map((id) => all.find((item) => item.id === id))
    .filter((item): item is Product => !!item && item.id !== product.id);
}

export async function getReviews(productId: string) {
  await getProduct(productId);
  return reviewStore.byProduct(productId);
}
