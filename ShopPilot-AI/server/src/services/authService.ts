import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { users } from "../data/store.js";
import { badRequest, unauthorized } from "../utils/errors.js";
import { createId, nowIso } from "../utils/id.js";
import type { UserRecord, UserRole } from "../types/index.js";

export const DEMO_CUSTOMER = {
  email: "demo@shopilot.ai",
  password: "Demo@123",
  name: "Aarav Mehta",
  role: "customer" as UserRole,
};

export const DEMO_MERCHANT = {
  email: "merchant@shopilot.ai",
  password: "Merchant@123",
  name: "Priya Shah",
  role: "merchant" as UserRole,
};

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

export function signToken(user: UserRecord) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } as jwt.SignOptions,
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, env.jwtSecret) as { sub: string; role: UserRole };
  } catch {
    throw unauthorized("Invalid or expired session");
  }
}

export async function register(input: { name: string; email: string; password: string; role?: UserRole }) {
  const existing = await users.findByEmail(input.email);
  if (existing) throw badRequest("An account with this email already exists");
  if (input.password.length < 6) throw badRequest("Password must be at least 6 characters");
  const user: UserRecord = {
    id: createId("usr"),
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(input.password, 10),
    role: input.role ?? "customer",
    preferences: { categories: [], brands: [], priorities: [] },
    createdAt: nowIso(),
  };
  await users.create(user);
  return { user: publicUser(user), token: signToken(user) };
}

export async function login(email: string, password: string) {
  const user = await users.findByEmail(email);
  if (!user) throw unauthorized("Invalid email or password");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized("Invalid email or password");
  return { user: publicUser(user), token: signToken(user) };
}

export async function loginDemo(kind: "customer" | "merchant" = "customer") {
  const creds = kind === "merchant" ? DEMO_MERCHANT : DEMO_CUSTOMER;
  return login(creds.email, creds.password);
}

export async function getUser(id: string) {
  const user = await users.findById(id);
  if (!user) throw unauthorized();
  return user;
}
