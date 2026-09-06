import { Link, useNavigate } from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import { api } from "../services/api";

import { useAuth } from "../context/AuthContext";

import {
  EmptyState,
  Modal,
} from "../components/ui";

import { ProductCard } from "../components/ProductCard";

import { inr } from "../utils/format";

import { toast } from "sonner";

import { useState } from "react";


export function CartPage() {
  const { user } = useAuth();

  const nav = useNavigate();

  const qc = useQueryClient();

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: api.cart,
    enabled: Boolean(user),
  });

  const [clearOpen, setClearOpen] =
    useState(false);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to use the cart"
        body="Demo login takes one click."
        action={
          <Link
            to="/login"
            className="btn-primary"
          >
            Sign in
          </Link>
        }
      />
    );
  }

  const data = cart.data;

  if (cart.isLoading) {
    return (
      <div className="skeleton h-64" />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Ask the agent to build a setup, or browse the catalog."
        action={
          <Link
            to="/agent"
            className="btn-primary"
          >
            Ask ShopPilot
          </Link>
        }
      />
    );
  }


  async function qty(
    id: string,
    quantity: number,
  ) {
    try {
      await api.updateCart(
        id,
        quantity,
      );

      qc.invalidateQueries({
        queryKey: ["cart"],
      });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Unable to update cart",
      );
    }
  }


  async function checkout() {
    try {
      /*
       * Step 1:
       * Ask backend to create Razorpay order.
       */
      const paymentOrder =
        await api.createPaymentOrder();


      /*
       * Step 2:
       * Check Razorpay script.
       */
      if (
        !window.Razorpay
      ) {
        toast.error(
          "Razorpay failed to load. Please refresh the page.",
        );

        return;
      }


      /*
       * Step 3:
       * Open Razorpay Checkout.
       */
      const options: RazorpayOptions = {
        key:
          paymentOrder.keyId,

        amount:
          paymentOrder.amount,

        currency:
          paymentOrder.currency,

        name:
          "ShopPilot AI",

        description:
          "ShopPilot AI Order",

        order_id:
          paymentOrder.orderId,

        prefill: {
          name:
            user.name,

          email:
            user.email,
        },

        theme: {
          color:
            "#c26a2e",
        },


        /*
         * Step 4:
         * Razorpay payment successful.
         */
        handler:
          async (response) => {
            try {
              /*
               * Step 5:
               * Send payment details to backend.
               */
              const result =
                await api.verifyPayment({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                });


              /*
               * Payment verified.
               */
              toast.success(
                result.notice,
              );


              /*
               * Refresh cart and orders.
               */
              await qc.invalidateQueries({
                queryKey: ["cart"],
              });

              await qc.invalidateQueries({
                queryKey: ["orders"],
              });


              /*
               * Go to orders.
               */
              nav("/orders");

            } catch (e) {
              toast.error(
                e instanceof Error
                  ? e.message
                  : "Payment verification failed",
              );
            }
          },


        modal: {
          ondismiss:
            () => {
              toast.info(
                "Payment cancelled",
              );
            },
        },
      };


      const razorpay =
        new window.Razorpay(
          options,
        );

      razorpay.open();

    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Unable to start payment",
      );
    }
  }


  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <h1 className="font-serif text-4xl">
            Cart
          </h1>

          <button
            className="text-sm text-ink-400"
            type="button"
            onClick={() =>
              setClearOpen(true)
            }
          >
            Clear
          </button>

        </div>


        {data.items.map(
          (line) => (
            <article
              key={
                line.product.id
              }
              className="card flex gap-4 p-4"
            >

              <img
                src={
                  line.product
                    .images[0]
                }
                alt=""
                className="h-24 w-28 rounded-xl object-cover"
              />

              <div className="flex-1">

                <Link
                  to={`/products/${line.product.id}`}
                  className="font-medium hover:text-copper-600"
                >
                  {
                    line.product.name
                  }
                </Link>

                <p className="mt-1 text-sm text-ink-500">
                  {
                    inr(
                      line.product
                        .price,
                    )
                  }
                </p>


                <div className="mt-3 flex items-center gap-2">

                  <button
                    className="btn-ghost px-2"
                    type="button"
                    onClick={() =>
                      qty(
                        line.product.id,
                        line.quantity - 1,
                      )
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </button>


                  <span className="w-6 text-center text-sm">
                    {
                      line.quantity
                    }
                  </span>


                  <button
                    className="btn-ghost px-2"
                    type="button"
                    onClick={() =>
                      qty(
                        line.product.id,
                        line.quantity + 1,
                      )
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </button>


                  <button
                    className="ml-2 text-ink-400"
                    type="button"
                    onClick={() =>
                      qty(
                        line.product.id,
                        0,
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                </div>

              </div>


              <p className="font-medium">
                {
                  inr(
                    line.lineTotal,
                  )
                }
              </p>

            </article>
          ),
        )}


        {data.upsells.length > 0 && (
          <section>

            <h2 className="mb-3 font-serif text-2xl">
              Complete the setup
            </h2>

            <p className="mb-4 text-sm text-ink-500">
              Laptop + accessories unlock the ₹1,200 bundle saving.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">

              {data.upsells.map(
                (p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={async (
                      id,
                    ) => {
                      await api.addToCart(
                        id,
                      );

                      qc.invalidateQueries(
                        {
                          queryKey: [
                            "cart",
                          ],
                        },
                      );
                    }}
                  />
                ),
              )}

            </div>

          </section>
        )}

      </div>


      <aside className="card h-fit space-y-3 p-5">

        <h2 className="font-medium">
          Summary
        </h2>


        <div className="flex justify-between text-sm">
          <span>
            Subtotal
          </span>

          <span>
            {inr(data.subtotal)}
          </span>
        </div>


        <div className="flex justify-between text-sm">
          <span>
            Discount
          </span>

          <span>
            {inr(data.discount)}
          </span>
        </div>


        <div className="flex justify-between font-semibold">
          <span>
            Total
          </span>

          <span>
            {inr(data.total)}
          </span>
        </div>


        {data.insights.map(
          (i) => (
            <p
              key={i}
              className="rounded-lg bg-ink-50 p-3 text-xs text-ink-600 dark:bg-ink-950"
            >
              {i}
            </p>
          ),
        )}


        <button
          className="btn-primary w-full"
          type="button"
          onClick={checkout}
        >
          Pay securely with Razorpay
        </button>


        <button
          className="btn-ghost w-full"
          type="button"
          onClick={() =>
            nav("/agent", {
              state: {
                prompt:
                  "Optimize my cart for the best value.",
              },
            })
          }
        >
          Ask AI to optimize
        </button>


        <p className="text-[11px] text-ink-400">
          Test Mode · No real money is charged.
        </p>

      </aside>


      <Modal
        open={clearOpen}
        title="Clear the cart?"
        body="This removes every item. The shopping agent also asks before clearing."
        confirmLabel="Clear cart"
        onClose={() =>
          setClearOpen(false)
        }
        onConfirm={async () => {
          try {
            await api.clearCart();

            qc.invalidateQueries({
              queryKey: ["cart"],
            });

            setClearOpen(false);

          } catch (e) {
            toast.error(
              e instanceof Error
                ? e.message
                : "Unable to clear cart",
            );
          }
        }}
      />

    </div>
  );
}