import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import type {
  AnalyticsEvent,
  Cart,
  Conversation,
  Order,
  Product,
  Review,
  UserRecord,
} from "../types/index.js";
import {
  AnalyticsEventModel,
  CartModel,
  ConversationModel,
  OrderModel,
  ProductModel,
  ReviewModel,
  UserModel,
} from "../models/schemas.js";

export type DbMode = "mongo" | "memory";

interface MemoryState {
  users: UserRecord[];
  products: Product[];
  reviews: Review[];
  carts: Cart[];
  orders: Order[];
  conversations: Conversation[];
  events: AnalyticsEvent[];
}

const emptyState = (): MemoryState => ({
  users: [],
  products: [],
  reviews: [],
  carts: [],
  orders: [],
  conversations: [],
  events: [],
});

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.resolve(here, "../../data/store.json");

class Database {
  mode: DbMode = "memory";
  memory: MemoryState = emptyState();

  async connect(): Promise<DbMode> {
    const uri = env.mongoUri;
    if (uri && uri !== "memory") {
      try {
        await mongoose.connect(uri);
        this.mode = "mongo";
        console.log("[db] Connected to MongoDB");
        return this.mode;
      } catch (error) {
        console.warn("[db] MongoDB connection failed, using in-memory store.", error);
      }
    }
    this.mode = "memory";
    this.loadFile();
    console.log("[db] Using in-memory store (set MONGO_URI to use MongoDB)");
    return this.mode;
  }

  loadFile() {
    try {
      if (fs.existsSync(dataFile)) {
        this.memory = { ...emptyState(), ...JSON.parse(fs.readFileSync(dataFile, "utf8")) };
      }
    } catch {
      this.memory = emptyState();
    }
  }

  persist() {
    if (this.mode !== "memory") return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(this.memory, null, 2));
  }

  async reset() {
    if (this.mode === "mongo") {
      await Promise.all([
        UserModel.deleteMany({}),
        ProductModel.deleteMany({}),
        ReviewModel.deleteMany({}),
        CartModel.deleteMany({}),
        OrderModel.deleteMany({}),
        ConversationModel.deleteMany({}),
        AnalyticsEventModel.deleteMany({}),
      ]);
    } else {
      this.memory = emptyState();
      this.persist();
    }
  }

  async seed(payload: Partial<MemoryState>) {
    if (this.mode === "mongo") {
      if (payload.users?.length) {
        await UserModel.insertMany(payload.users.map((u) => ({ ...u, _appId: u.id })));
      }
      if (payload.products?.length) {
        await ProductModel.insertMany(payload.products.map((p) => ({ ...p, _appId: p.id })));
      }
      if (payload.reviews?.length) {
        await ReviewModel.insertMany(payload.reviews.map((r) => ({ ...r, _appId: r.id })));
      }
      if (payload.carts?.length) {
        await CartModel.insertMany(payload.carts.map((c) => ({ ...c, _appId: c.id })));
      }
      if (payload.orders?.length) {
        await OrderModel.insertMany(payload.orders.map((o) => ({ ...o, _appId: o.id })));
      }
      if (payload.conversations?.length) {
        await ConversationModel.insertMany(
          payload.conversations.map((c) => ({ ...c, _appId: c.id })),
        );
      }
      if (payload.events?.length) {
        await AnalyticsEventModel.insertMany(payload.events.map((e) => ({ ...e, _appId: e.id })));
      }
      return;
    }
    this.memory = { ...emptyState(), ...payload } as MemoryState;
    this.persist();
  }
}

export const db = new Database();

function stripMongo<T extends { id?: string }>(doc: Record<string, unknown> | null): T | null {
  if (!doc) return null;
  const { _id, __v, _appId, ...rest } = doc;
  return { ...rest, id: (doc.id as string) ?? (_appId as string) } as T;
}

export const users = {
  async all(): Promise<UserRecord[]> {
    if (db.mode === "mongo") {
      const rows = await UserModel.find().lean();
      return rows.map((r) => stripMongo<UserRecord>(r as Record<string, unknown>)!);
    }
    return db.memory.users;
  },
  async findByEmail(email: string) {
    if (db.mode === "mongo") {
      const row = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      return stripMongo<UserRecord>(row as Record<string, unknown> | null);
    }
    return db.memory.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  async findById(id: string) {
    if (db.mode === "mongo") {
      const row = await UserModel.findOne({ _appId: id }).lean();
      return stripMongo<UserRecord>(row as Record<string, unknown> | null);
    }
    return db.memory.users.find((u) => u.id === id) ?? null;
  },
  async create(user: UserRecord) {
    if (db.mode === "mongo") {
      await UserModel.create({ ...user, _appId: user.id });
      return user;
    }
    db.memory.users.push(user);
    db.persist();
    return user;
  },
  async update(id: string, patch: Partial<UserRecord>) {
    if (db.mode === "mongo") {
      const row = await UserModel.findOneAndUpdate({ _appId: id }, { $set: patch }, { new: true }).lean();
      return stripMongo<UserRecord>(row as Record<string, unknown> | null);
    }
    const idx = db.memory.users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    db.memory.users[idx] = { ...db.memory.users[idx], ...patch };
    db.persist();
    return db.memory.users[idx];
  },
};

export const products = {
  async all(): Promise<Product[]> {
    if (db.mode === "mongo") {
      const rows = await ProductModel.find().lean();
      return rows.map((r) => stripMongo<Product>(r as Record<string, unknown>)!);
    }
    return db.memory.products;
  },
  async findById(id: string) {
    if (db.mode === "mongo") {
      const row = await ProductModel.findOne({
        $or: [{ _appId: id }, { slug: id }],
      }).lean();
      return stripMongo<Product>(row as Record<string, unknown> | null);
    }
    return db.memory.products.find((p) => p.id === id || p.slug === id) ?? null;
  },
  async replaceAll(items: Product[]) {
    if (db.mode === "mongo") {
      await ProductModel.deleteMany({});
      if (items.length) await ProductModel.insertMany(items.map((p) => ({ ...p, _appId: p.id })));
      return;
    }
    db.memory.products = items;
    db.persist();
  },
};

export const reviews = {
  async byProduct(productId: string) {
    if (db.mode === "mongo") {
      const rows = await ReviewModel.find({ productId }).lean();
      return rows.map((r) => stripMongo<Review>(r as Record<string, unknown>)!);
    }
    return db.memory.reviews.filter((r) => r.productId === productId);
  },
  async all() {
    if (db.mode === "mongo") {
      const rows = await ReviewModel.find().lean();
      return rows.map((r) => stripMongo<Review>(r as Record<string, unknown>)!);
    }
    return db.memory.reviews;
  },
};

export const carts = {
  async findByUser(userId: string) {
    if (db.mode === "mongo") {
      const row = await CartModel.findOne({ userId }).lean();
      return stripMongo<Cart>(row as Record<string, unknown> | null);
    }
    return db.memory.carts.find((c) => c.userId === userId) ?? null;
  },
  async upsert(cart: Cart) {
    if (db.mode === "mongo") {
      await CartModel.findOneAndUpdate(
        { userId: cart.userId },
        { ...cart, _appId: cart.id },
        { upsert: true, new: true },
      );
      return cart;
    }
    const idx = db.memory.carts.findIndex((c) => c.userId === cart.userId);
    if (idx >= 0) db.memory.carts[idx] = cart;
    else db.memory.carts.push(cart);
    db.persist();
    return cart;
  },
  async all() {
    if (db.mode === "mongo") {
      const rows = await CartModel.find().lean();
      return rows.map((r) => stripMongo<Cart>(r as Record<string, unknown>)!);
    }
    return db.memory.carts;
  },
};

export const orders = {
  async byUser(userId: string) {
    if (db.mode === "mongo") {
      const rows = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return rows.map((r) => stripMongo<Order>(r as Record<string, unknown>)!);
    }
    return db.memory.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async findById(id: string) {
    if (db.mode === "mongo") {
      const row = await OrderModel.findOne({ _appId: id }).lean();
      return stripMongo<Order>(row as Record<string, unknown> | null);
    }
    return db.memory.orders.find((o) => o.id === id) ?? null;
  },
  async create(order: Order) {
    if (db.mode === "mongo") {
      await OrderModel.create({ ...order, _appId: order.id });
      return order;
    }
    db.memory.orders.push(order);
    db.persist();
    return order;
  },
  async all() {
    if (db.mode === "mongo") {
      const rows = await OrderModel.find().lean();
      return rows.map((r) => stripMongo<Order>(r as Record<string, unknown>)!);
    }
    return db.memory.orders;
  },
};

export const conversations = {
  async findById(id: string) {
    if (db.mode === "mongo") {
      const row = await ConversationModel.findOne({ _appId: id }).lean();
      return stripMongo<Conversation>(row as Record<string, unknown> | null);
    }
    return db.memory.conversations.find((c) => c.id === id) ?? null;
  },
  async byUser(userId: string, mode?: "shopping" | "growth") {
    if (db.mode === "mongo") {
      const q: Record<string, unknown> = { userId };
      if (mode) q.mode = mode;
      const rows = await ConversationModel.find(q).sort({ updatedAt: -1 }).lean();
      return rows.map((r) => stripMongo<Conversation>(r as Record<string, unknown>)!);
    }
    return db.memory.conversations
      .filter((c) => c.userId === userId && (!mode || c.mode === mode))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async upsert(convo: Conversation) {
    if (db.mode === "mongo") {
      await ConversationModel.findOneAndUpdate(
        { _appId: convo.id },
        { ...convo, _appId: convo.id },
        { upsert: true },
      );
      return convo;
    }
    const idx = db.memory.conversations.findIndex((c) => c.id === convo.id);
    if (idx >= 0) db.memory.conversations[idx] = convo;
    else db.memory.conversations.push(convo);
    db.persist();
    return convo;
  },
};

export const events = {
  async create(event: AnalyticsEvent) {
    if (db.mode === "mongo") {
      await AnalyticsEventModel.create({ ...event, _appId: event.id });
      return event;
    }
    db.memory.events.push(event);
    db.persist();
    return event;
  },
  async all() {
    if (db.mode === "mongo") {
      const rows = await AnalyticsEventModel.find().lean();
      return rows.map((r) => stripMongo<AnalyticsEvent>(r as Record<string, unknown>)!);
    }
    return db.memory.events;
  },
};
