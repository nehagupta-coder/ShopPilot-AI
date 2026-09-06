import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui";
import { dateLabel, inr } from "../utils/format";

export function OrdersPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["orders"], queryFn: api.orders, enabled: Boolean(user) });

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see orders"
        body="The demo customer already has a sample order."
        action={
          <Link to="/login" className="btn-primary">
            Sign in
          </Link>
        }
      />
    );
  }

  const orders = q.data?.orders ?? [];
  if (q.isLoading) return <div className="skeleton h-48" />;
  if (!orders.length) {
    return <EmptyState title="No orders yet" body="Complete a mock checkout from the cart." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Orders</h1>
      {orders.map((o) => (
        <article key={o.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-ink-400">{o.id}</p>
              <p className="mt-1 font-medium capitalize">{o.status.replaceAll("_", " ")}</p>
              <p className="text-sm text-ink-500">
                Placed {dateLabel(o.createdAt)} · Arrives {dateLabel(o.estimatedDelivery)}
              </p>
            </div>
            <p className="text-lg font-semibold">{inr(o.total)}</p>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {o.items.map((i) => (
              <li key={i.productId}>
                {i.name} × {i.quantity} — {inr(i.price)}
              </li>
            ))}
          </ul>
          <ol className="mt-5 flex flex-wrap gap-2">
            {o.timeline.map((t) => (
              <li key={t.status} className="chip capitalize">
                {t.status.replaceAll("_", " ")}
              </li>
            ))}
          </ol>
          <button
            className="btn-ghost mt-4"
            type="button"
            onClick={() => nav("/agent", { state: { prompt: `What's the status of my order ${o.id}?` } })}
          >
            Ask AI about this order
          </button>
        </article>
      ))}
    </div>
  );
}
