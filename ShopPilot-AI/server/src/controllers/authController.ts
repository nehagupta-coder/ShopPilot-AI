import { z } from "zod";
import type { Request, Response } from "express";
import { getUser, login, loginDemo, publicUser, register } from "../services/authService.js";
import { isMockAI } from "../config/env.js";
import { db } from "../data/store.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerHandler(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const result = await register(body);
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const result = await login(body.email, body.password);
  res.json(result);
}

export async function demoHandler(req: Request, res: Response) {
  const kind = req.body?.kind === "merchant" ? "merchant" : "customer";
  const result = await loginDemo(kind);
  res.json(result);
}

export async function meHandler(req: Request, res: Response) {
  const user = await getUser(req.user!.id);
  res.json({
    user: publicUser(user),
    dbMode: db.mode,
    ai: { mock: isMockAI(), provider: isMockAI() ? "mock" : process.env.AI_PROVIDER },
  });
}
