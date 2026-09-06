import { addDays, createId, nowIso } from "../utils/id.js";
import { badRequest, notFound } from "../utils/errors.js";
import { orders } from "../data/store.js";
import { clearCart, viewCart } from "./cartService.js";
import { trackEvent } from "./analyticsService.js";
import type { Order, OrderStatus } from "../types/index.js";

const FLOW: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export async function checkout(
  userId: string,
  paymentId?: string,
) {
  const cart = await viewCart(userId);

  if (!cart.items.length) {
    throw badRequest("Your cart is empty");
  }

  const createdAt = nowIso();

  const order: Order = {
    id: createId("ord"),
    userId,

    items: cart.items.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      price: l.product.price,
      quantity: l.quantity,
    })),

    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,

    status: "confirmed",

    createdAt,

    estimatedDelivery: addDays(createdAt, 5),

    timeline: [
      {
        status: "placed",
        at: createdAt,
        note: "Order placed",
      },
      {
        status: "confirmed",
        at: createdAt,
        note: paymentId
          ? `Payment confirmed via Razorpay (${paymentId})`
          : "Order confirmed",
      },
    ],
  };

  await orders.create(order);

  await clearCart(userId);

  await trackEvent({
    userId,
    eventType: "purchase",
    metadata: {
      orderId: order.id,
      total: order.total,
      paymentId: paymentId ?? null,
      paymentMethod: paymentId ? "razorpay" : "demo",
    },
  });

  return order;
}

export async function listOrders(userId: string) {
  return orders.byUser(userId);
}

export async function getOrder(
  userId: string,
  orderId: string,
  role?: string,
) {
  const order = await orders.findById(orderId);

  if (!order) {
    throw notFound("Order");
  }

  if (order.userId !== userId && role !== "merchant") {
    throw notFound("Order");
  }

  return decorateTimeline(order);
}

function decorateTimeline(order: Order): Order {
  const created = new Date(order.createdAt).getTime();

  const now = Date.now();

  const day = 24 * 60 * 60 * 1000;

  const elapsed = Math.floor(
    (now - created) / day,
  );

  const status =
    FLOW[Math.min(elapsed, FLOW.length - 1)];

  const timeline = FLOW.slice(
    0,
    FLOW.indexOf(status) + 1,
  ).map((s, i) => ({
    status: s,

    at: new Date(
      created + i * day * 0.4,
    ).toISOString(),

    note:
      order.timeline.find(
        (t) => t.status === s,
      )?.note ??
      s
        .replaceAll("_", " ")
        .replace(/^\w/, (c) => c.toUpperCase()),
  }));

  return {
    ...order,
    status,
    timeline,
  };
}

export async function getOrderStatus(
  userId: string,
  orderId: string,
) {
  const order = await getOrder(
    userId,
    orderId,
  );

  return {
    orderId: order.id,
    status: order.status,
    estimatedDelivery:
      order.estimatedDelivery,
    total: order.total,
    items: order.items,
    timeline: order.timeline,
  };
}