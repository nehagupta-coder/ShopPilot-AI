import type { NextFunction, Request, Response } from "express";
import { getUser, verifyToken } from "../services/authService.js";
import { forbidden, unauthorized } from "../utils/errors.js";
import type { UserRecord } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyToken(header.slice(7));
    req.user = await getUser(payload.sub);
  } catch {
    /* ignore invalid optional tokens */
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized());
  try {
    const payload = verifyToken(header.slice(7));
    req.user = await getUser(payload.sub);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireMerchant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== "merchant") return next(forbidden("Merchant access required"));
  next();
}
