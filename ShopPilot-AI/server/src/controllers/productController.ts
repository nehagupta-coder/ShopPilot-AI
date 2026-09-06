import { z } from "zod";
import type { Request, Response } from "express";
import {
  compareProducts,
  generateProductSummary,
  getBrands,
  getCategories,
  getProduct,
  getRelated,
  getReviews,
  listProducts,
} from "../services/productService.js";
import { parseNaturalLanguage } from "../services/nlSearch.js";
import { trackEvent } from "../services/analyticsService.js";

export async function listHandler(req: Request, res: Response) {
  const q = z
    .object({
      q: z.string().optional(),
      category: z.string().optional(),
      brand: z.string().optional(),
      minPrice: z.coerce.number().optional(),
      maxPrice: z.coerce.number().optional(),
      minRating: z.coerce.number().optional(),
      sort: z.enum(["price_asc", "price_desc", "rating", "popularity", "discount"]).optional(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    })
    .parse(req.query);
  const result = await listProducts(q);
  res.json(result);
}

export async function searchHandler(req: Request, res: Response) {
  const q = z.object({ q: z.string().min(1) }).parse(req.query);
  const parsed = parseNaturalLanguage(q.q);
  const result = await listProducts({ ...parsed.filters, limit: 12 });
  await trackEvent({
    userId: req.user?.id,
    eventType: "search",
    metadata: { q: q.q, filters: parsed.filters },
  });
  res.json({ ...result, parsed: parsed.filters });
}

export async function detailHandler(req: Request, res: Response) {
  const product = await getProduct(req.params.id);
  await trackEvent({
    userId: req.user?.id,
    eventType: "product_view",
    productId: product.id,
  });
  const [related, reviews, summary] = await Promise.all([
    getRelated(product.id),
    getReviews(product.id),
    generateProductSummary(product.id),
  ]);
  res.json({ product, related, reviews, summary });
}

export async function compareHandler(req: Request, res: Response) {
  const body = z.object({ productIds: z.array(z.string()).min(2).max(4) }).parse(req.body);
  const items = await compareProducts(body.productIds);
  await trackEvent({ userId: req.user?.id, eventType: "compare", metadata: { productIds: body.productIds } });
  res.json({ products: items });
}

export async function metaHandler(_req: Request, res: Response) {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  res.json({ categories, brands });
}
