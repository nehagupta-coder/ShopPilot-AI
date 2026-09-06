import type { Request, Response } from "express";
import { z } from "zod";
import {
  categoryPerformance,
  getOverview,
  identifyGrowthOpportunities,
  salesTrends,
  topProducts,
  trackEvent,
} from "../services/analyticsService.js";
import { runAgent } from "../agents/shopAgent.js";

export async function overviewHandler(req: Request, res: Response) {
  const days = req.query.days ? Number(req.query.days) : 30;
  const [overview, trends, top, categories, growth] = await Promise.all([
    getOverview(days),
    salesTrends(days),
    topProducts(8),
    categoryPerformance(),
    identifyGrowthOpportunities(),
  ]);
  res.json({ overview, trends, topProducts: top, categories, growth });
}

export async function trackHandler(req: Request, res: Response) {
  const body = z
    .object({
      eventType: z.enum([
        "product_view",
        "search",
        "add_to_cart",
        "remove_from_cart",
        "checkout_started",
        "purchase",
        "recommendation_clicked",
        "ai_conversation",
        "compare",
      ]),
      productId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
    .parse(req.body);
  await trackEvent({ ...body, userId: req.user?.id });
  res.json({ ok: true });
}

export async function advisorHandler(req: Request, res: Response) {
  const body = z
    .object({
      message: z.string().min(1),
      conversationId: z.string().optional(),
    })
    .parse(req.body);
  const result = await runAgent({
    userId: req.user!.id,
    role: req.user!.role,
    message: body.message,
    conversationId: body.conversationId,
    mode: "growth",
  });
  res.json(result);
}
