import { z } from "zod";
import type { Request, Response } from "express";

import {
  addToCart,
  removeFromCart,
  updateCart,
  viewCart,
  clearCart,
} from "../services/cartService.js";

import { checkout, getOrder, listOrders } from "../services/orderService.js";

import { trackEvent } from "../services/analyticsService.js";

import { users } from "../data/store.js";

import { listProducts } from "../services/productService.js";

import { badRequest } from "../utils/errors.js";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../services/paymentService.js";


// =========================
// CART
// =========================

export async function getCartHandler(req: Request, res: Response) {
  res.json(await viewCart(req.user!.id));
}


export async function addCartHandler(req: Request, res: Response) {
  const body = z
    .object({
      productId: z.string(),
      quantity: z.number().int().min(1).optional(),
    })
    .parse(req.body);

  const cart = await addToCart(
    req.user!.id,
    body.productId,
    body.quantity ?? 1,
  );

  await trackEvent({
    userId: req.user!.id,
    eventType: "add_to_cart",
    productId: body.productId,
  });

  res.json(cart);
}


export async function updateCartHandler(req: Request, res: Response) {
  const body = z
    .object({
      productId: z.string(),
      quantity: z.number().int(),
    })
    .parse(req.body);

  res.json(
    await updateCart(
      req.user!.id,
      body.productId,
      body.quantity,
    ),
  );
}


export async function removeCartHandler(req: Request, res: Response) {
  const cart = await removeFromCart(
    req.user!.id,
    req.params.productId,
  );

  await trackEvent({
    userId: req.user!.id,
    eventType: "remove_from_cart",
    productId: req.params.productId,
  });

  res.json(cart);
}


export async function clearCartHandler(req: Request, res: Response) {
  const body = z
    .object({
      confirm: z.literal(true),
    })
    .safeParse(req.body);

  if (!body.success) {
    throw badRequest("Confirmation required to clear the cart");
  }

  res.json(await clearCart(req.user!.id));
}


// =========================
// RAZORPAY PAYMENT
// =========================

export async function createPaymentOrderHandler(
  req: Request,
  res: Response,
) {
  const cart = await viewCart(req.user!.id);

  if (!cart.items.length) {
    throw badRequest("Your cart is empty");
  }

  await trackEvent({
    userId: req.user!.id,
    eventType: "checkout_started",
  });

  const paymentOrder = await createRazorpayOrder(
    cart.total,
    req.user!.id,
  );

  res.status(200).json({
    orderId: paymentOrder.id,
    amount: paymentOrder.amount,
    currency: paymentOrder.currency,
    keyId: paymentOrder.keyId,
  });
}


export async function verifyPaymentHandler(
  req: Request,
  res: Response,
) {
  const body = z
    .object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    })
    .parse(req.body);

  const cart = await viewCart(req.user!.id);

  if (!cart.items.length) {
    throw badRequest("Your cart is empty");
  }

  const payment = await verifyRazorpayPayment({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });

  /*
   * Razorpay amount is stored in paise.
   * Our cart total is stored in rupees.
   */
  const expectedAmount = Math.round(cart.total * 100);

  if (payment.amount !== expectedAmount) {
    throw badRequest("Payment amount does not match the cart total");
  }

  /*
   * Payment is verified successfully.
   * Now create our application order.
   */
  const order = await checkout(
    req.user!.id,
    body.razorpay_payment_id,
  );

  res.status(201).json({
    order,
    paymentId: body.razorpay_payment_id,
    notice: "Payment successful and order confirmed.",
  });
}


// =========================
// ORDERS
// =========================

export async function listOrdersHandler(
  req: Request,
  res: Response,
) {
  res.json({
    orders: await listOrders(req.user!.id),
  });
}


export async function getOrderHandler(
  req: Request,
  res: Response,
) {
  res.json({
    order: await getOrder(
      req.user!.id,
      req.params.id,
      req.user!.role,
    ),
  });
}


// =========================
// PREFERENCES
// =========================

export async function getPrefsHandler(
  req: Request,
  res: Response,
) {
  res.json({
    preferences: req.user!.preferences,
  });
}


export async function putPrefsHandler(
  req: Request,
  res: Response,
) {
  const body = z
    .object({
      budget: z.number().optional(),
      categories: z.array(z.string()).optional(),
      brands: z.array(z.string()).optional(),
      priorities: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const updated = await users.update(req.user!.id, {
    preferences: {
      ...req.user!.preferences,
      ...body,
    },
  });

  res.json({
    preferences: updated?.preferences,
  });
}


// =========================
// RECOMMENDATIONS
// =========================

export async function recommendationsHandler(
  req: Request,
  res: Response,
) {
  const prefs = req.user?.preferences;

  const result = await listProducts({
    category:
      typeof req.query.category === "string"
        ? req.query.category
        : prefs?.categories[0],

    maxPrice:
      req.query.budget
        ? Number(req.query.budget)
        : prefs?.budget,

    limit: 8,
  });

  res.json(result);
}