import crypto from "node:crypto";
import { badRequest } from "../utils/errors.js";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export async function createRazorpayOrder(amountInRupees: number, userId: string) {
  const { keyId, keySecret } = getCredentials();

  const amount = Math.round(amountInRupees * 100);

  if (amount <= 0) {
    throw badRequest("Invalid payment amount");
  }

  const response = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `shopilot_${userId}_${Date.now()}`,
      notes: {
        userId,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.description || "Unable to create Razorpay order");
  }

  return {
    id: data.id as string,
    amount: data.amount as number,
    currency: data.currency as string,
    keyId,
  };
}

export async function verifyRazorpayPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keyId, keySecret } = getCredentials();

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(input.signature),
  );

  if (!isValid) {
    throw badRequest("Invalid payment signature");
  }

  const orderResponse = await fetch(`${RAZORPAY_API}/orders/${input.orderId}`, {
    headers: {
      Authorization: authHeader(keyId, keySecret),
    },
  });

  const razorpayOrder = await orderResponse.json();

  if (!orderResponse.ok) {
    throw new Error(
      razorpayOrder?.error?.description || "Unable to verify Razorpay order",
    );
  }

  return {
    verified: true,
    orderId: input.orderId,
    paymentId: input.paymentId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
}