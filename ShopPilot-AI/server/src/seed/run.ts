import bcrypt from "bcryptjs";
import { db } from "../data/store.js";
import { catalog, reviewTemplates } from "./catalog.js";
import { createId } from "../utils/id.js";
import type { AnalyticsEvent, Order, Review, UserRecord } from "../types/index.js";
import { DEMO_CUSTOMER, DEMO_MERCHANT } from "../services/authService.js";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), n % 60, 0, 0);
  return d.toISOString();
}

async function main() {
  await db.connect();
  await db.reset();

  const passwordHashCustomer = await bcrypt.hash(DEMO_CUSTOMER.password, 10);
  const passwordHashMerchant = await bcrypt.hash(DEMO_MERCHANT.password, 10);

  const extraUsers: UserRecord[] = Array.from({ length: 8 }, (_, i) => ({
    id: createId("usr"),
    name: ["Kabir", "Ishita", "Neel", "Sara", "Arjun", "Diya", "Vikram", "Naina"][i],
    email: `user${i + 1}@demo.shopilot.ai`,
    passwordHash: passwordHashCustomer,
    role: "customer",
    preferences: { categories: ["Laptops"], brands: [], priorities: ["value"] },
    createdAt: daysAgo(40 - i),
  }));

  const demoUser: UserRecord = {
    id: "usr_demo_customer",
    name: DEMO_CUSTOMER.name,
    email: DEMO_CUSTOMER.email,
    passwordHash: passwordHashCustomer,
    role: "customer",
    preferences: {
      budget: 70000,
      categories: ["Laptops"],
      brands: ["ASUS", "Lenovo"],
      priorities: ["coding", "lightweight"],
      notes: "Prefers 16GB RAM",
    },
    createdAt: daysAgo(20),
  };

  const merchant: UserRecord = {
    id: "usr_demo_merchant",
    name: DEMO_MERCHANT.name,
    email: DEMO_MERCHANT.email,
    passwordHash: passwordHashMerchant,
    role: "merchant",
    preferences: { categories: [], brands: [], priorities: [] },
    createdAt: daysAgo(60),
  };

  const users = [demoUser, merchant, ...extraUsers];

  const reviews: Review[] = catalog.flatMap((p, pi) =>
    reviewTemplates.map((t, i) => ({
      ...t,
      id: createId("rev"),
      productId: p.id,
      createdAt: daysAgo((pi + i) % 25),
      rating: Math.min(5, Math.max(3, t.rating - (i === 3 ? 1 : 0))),
    })),
  );

  const evts: AnalyticsEvent[] = [];
  catalog.forEach((p, i) => {
    const views = 30 + ((i * 17) % 80);
    for (let v = 0; v < views; v++) {
      evts.push({
        id: createId("evt"),
        userId: users[(i + v) % users.length].id,
        eventType: "product_view",
        productId: p.id,
        createdAt: daysAgo((v + i) % 28),
      });
    }
    const carts = Math.round(views * (p.category === "Laptops" && p.tags.includes("gaming") ? 0.08 : 0.18));
    for (let c = 0; c < carts; c++) {
      evts.push({
        id: createId("evt"),
        userId: users[(i + c) % users.length].id,
        eventType: "add_to_cart",
        productId: p.id,
        createdAt: daysAgo((c + i) % 27),
      });
    }
  });

  for (let i = 0; i < 40; i++) {
    evts.push({
      id: createId("evt"),
      userId: users[i % users.length].id,
      eventType: "search",
      metadata: { q: ["laptop under 70000", "best phone under 30000", "wfh setup", "gaming laptop"][i % 4] },
      createdAt: daysAgo(i % 28),
    });
    evts.push({
      id: createId("evt"),
      userId: users[i % users.length].id,
      eventType: "ai_conversation",
      createdAt: daysAgo(i % 20),
    });
    if (i % 3 === 0) {
      evts.push({
        id: createId("evt"),
        userId: users[i % users.length].id,
        eventType: "recommendation_clicked",
        productId: catalog[i % catalog.length].id,
        createdAt: daysAgo(i % 18),
      });
    }
  }

  const seededOrders: Order[] = extraUsers.slice(0, 6).map((u, i) => {
    const item = catalog[(i * 3) % catalog.length];
    const extra = catalog[(i * 3 + 5) % catalog.length];
    const createdAt = daysAgo(2 + i * 3);
    const total = item.price + extra.price;
    evts.push({
      id: createId("evt"),
      userId: u.id,
      eventType: "purchase",
      metadata: { productIds: [item.id, extra.id], total },
      createdAt,
    });
    evts.push({
      id: createId("evt"),
      userId: u.id,
      eventType: "checkout_started",
      createdAt,
    });
    return {
      id: createId("ord"),
      userId: u.id,
      items: [
        { productId: item.id, name: item.name, price: item.price, quantity: 1 },
        { productId: extra.id, name: extra.name, price: extra.price, quantity: 1 },
      ],
      subtotal: total,
      discount: 0,
      total,
      status: i % 2 === 0 ? "shipped" : "delivered",
      createdAt,
      estimatedDelivery: daysAgo(i - 2),
      timeline: [
        { status: "placed", at: createdAt, note: "Order placed" },
        { status: "confirmed", at: createdAt, note: "Confirmed (demo)" },
      ],
    };
  });

  const demoOrder: Order = {
    id: "ord_demo_aarav",
    userId: demoUser.id,
    items: [
      {
        productId: "p_logi_m331",
        name: "Logitech M331 Silent Mouse",
        price: 1095,
        quantity: 1,
      },
    ],
    subtotal: 1095,
    discount: 0,
    total: 1095,
    status: "shipped",
    createdAt: daysAgo(3),
    estimatedDelivery: daysAgo(-2),
    timeline: [
      { status: "placed", at: daysAgo(3), note: "Order placed" },
      { status: "confirmed", at: daysAgo(3), note: "Demo payment authorised" },
    ],
  };

  await db.seed({
    users,
    products: catalog,
    reviews,
    carts: [
      {
        id: "cart_demo",
        userId: demoUser.id,
        items: [],
        updatedAt: daysAgo(1),
      },
    ],
    orders: [...seededOrders, demoOrder],
    conversations: [],
    events: evts,
  });

  console.log(`Seeded ${catalog.length} products, ${users.length} users, ${reviews.length} reviews, ${evts.length} events, ${seededOrders.length + 1} orders.`);
  console.log(`DB mode: ${db.mode}`);
  console.log("Demo customer: demo@shopilot.ai / Demo@123");
  console.log("Demo merchant: merchant@shopilot.ai / Merchant@123");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

