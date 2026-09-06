import { z } from "zod";
import type { Request, Response } from "express";
import { getConversation, listConversations, runAgent } from "../agents/shopAgent.js";
import { notFound } from "../utils/errors.js";
import { isMockAI } from "../config/env.js";

export async function chatHandler(req: Request, res: Response) {
  const body = z
    .object({
      message: z.string().min(1).max(2000),
      conversationId: z.string().optional(),
      mode: z.enum(["shopping", "growth"]).optional(),
      confirmActionId: z.string().optional(),
    })
    .parse(req.body);

  if (body.mode === "growth" && req.user!.role !== "merchant") {
    body.mode = "shopping";
  }

  const result = await runAgent({
    userId: req.user!.id,
    role: req.user!.role,
    message: body.message,
    conversationId: body.conversationId,
    mode: body.mode,
    confirmActionId: body.confirmActionId,
  });
  res.json(result);
}

export async function conversationsHandler(req: Request, res: Response) {
  const mode = req.query.mode === "growth" ? "growth" : req.query.mode === "shopping" ? "shopping" : undefined;
  res.json({ conversations: await listConversations(req.user!.id, mode) });
}

export async function conversationHandler(req: Request, res: Response) {
  const convo = await getConversation(req.user!.id, req.params.id);
  if (!convo) throw notFound("Conversation");
  res.json({ conversation: convo, mockMode: isMockAI() });
}
