import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCompare } from "../context/CompareContext";
import { api } from "../services/api";
import { EmptyState } from "../components/ui";
import { inr } from "../utils/format";

export function ComparePage() {
  const { ids, clear } = useCompare();
  const nav = useNavigate();
  const q = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => api.compare(ids),
    enabled: ids.length >= 2,
  });

  if (ids.length < 2) {
    return (
      <EmptyState
        title="Compare two or three products"
        body="Use the compare icon on product cards, then return here."
        action={
          <Link to="/products" className="btn-primary">
            Browse products
          </Link>
        }
      />
    );
  }

  const products = q.data?.products ?? [];
  const keys = [...new Set(products.flatMap((p) => p.specifications.map((s) => s.key)))];

  const winner = [...products].sort((a, b) => b.rating / (a.price / 10000) - a.rating / (b.price / 10000))[0];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl">Compare</h1>
          <p className="mt-2 text-sm text-ink-500">
            Strengths, value, and a suggested winner based on rating-per-rupee in this catalog.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" type="button" onClick={clear}>
            Clear
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() =>
              nav("/agent", {
                state: { prompt: `Compare ${products.map((p) => p.name).join(" vs ")} and pick a winner.` },
              })
            }
          >
            Ask AI
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="py-3 text-left text-ink-400"> </th>
              {products.map((p) => (
                <th key={p.id} className="px-3 text-left">
                  <Link to={`/products/${p.id}`} className="font-medium hover:text-copper-600">
                    {p.name}
                  </Link>
                  <div className="mt-1 text-lg">{inr(p.price)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ink-100 dark:border-ink-800">
              <td className="py-3 text-ink-400">Rating</td>
              {products.map((p) => (
                <td key={p.id} className="px-3">
                  {p.rating}★
                </td>
              ))}
            </tr>
            {keys.map((k) => (
              <tr key={k} className="border-t border-ink-100 dark:border-ink-800">
                <td className="py-3 text-ink-400">{k}</td>
                {products.map((p) => (
                  <td key={p.id} className="px-3">
                    {p.specifications.find((s) => s.key === k)?.value ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {winner && (
        <div className="card p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-copper-600">Suggested winner</p>
          <h2 className="mt-2 font-serif text-2xl">{winner.name}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Best value among the shortlist: {winner.rating}★ at {inr(winner.price)} ({winner.discount}% off).
            Strength: {winner.tags.slice(0, 3).join(", ") || winner.category}. Weakness: confirm battery and weight
            against your actual commute if those matter more than raw specs.
          </p>
        </div>
      )}
    </div>
  );
}
