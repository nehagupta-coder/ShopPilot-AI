import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { EmptyState, SkeletonGrid } from "../components/ui";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      brand: params.get("brand") ?? undefined,
      minPrice: params.get("minPrice") ?? undefined,
      maxPrice: params.get("maxPrice") ?? undefined,
      minRating: params.get("minRating") ?? undefined,
      sort: params.get("sort") ?? "popularity",
      page: params.get("page") ?? "1",
      limit: 12,
    }),
    [params],
  );

  const list = useQuery({ queryKey: ["products", query], queryFn: () => api.products(query) });
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.productMeta });

  function patch(next: Record<string, string | undefined>) {
    const n = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) n.delete(k);
      else n.set(k, v);
    });
    if (!("page" in next)) n.set("page", "1");
    setParams(n);
  }

  async function add(id: string) {
    if (!user) return nav("/login");
    await api.addToCart(id);
    toast.success("Added to cart");
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="card h-fit space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-400">Category</p>
          <select
            className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            value={query.category ?? ""}
            onChange={(e) => patch({ category: e.target.value || undefined })}
          >
            <option value="">All</option>
            {meta.data?.categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-400">Brand</p>
          <select
            className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            value={query.brand ?? ""}
            onChange={(e) => patch({ brand: e.target.value || undefined })}
          >
            <option value="">All</option>
            {meta.data?.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-400">Max price</p>
          <input
            type="number"
            className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            placeholder="70000"
            defaultValue={query.maxPrice}
            onBlur={(e) => patch({ maxPrice: e.target.value || undefined })}
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-400">Min rating</p>
          <select
            className="w-full rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            value={query.minRating ?? ""}
            onChange={(e) => patch({ minRating: e.target.value || undefined })}
          >
            <option value="">Any</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>
      </aside>

      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              patch({ q: q || undefined });
            }}
          >
            <input
              className="flex-1 rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-900"
              placeholder="Natural language: cheap laptop for coding"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn-primary" type="submit">
              Search
            </button>
          </form>
          <select
            className="rounded-full border border-ink-200 bg-transparent px-3 py-2 text-sm dark:border-ink-700"
            value={query.sort}
            onChange={(e) => patch({ sort: e.target.value })}
          >
            <option value="popularity">Popular</option>
            <option value="price_asc">Price: low</option>
            <option value="price_desc">Price: high</option>
            <option value="rating">Rating</option>
            <option value="discount">Discount</option>
          </select>
        </div>

        {list.isLoading ? (
          <SkeletonGrid />
        ) : list.data?.items.length ? (
          <>
            <p className="mb-4 text-sm text-ink-500">{list.data.total} products</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.data.items.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={add} />
              ))}
            </div>
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: list.data.pages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`h-9 w-9 rounded-full text-sm ${Number(query.page) === i + 1 ? "bg-ink-900 text-white dark:bg-copper-500 dark:text-ink-950" : "btn-ghost"}`}
                  onClick={() => patch({ page: String(i + 1) })}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState title="No matches" body="Try a broader query or ask the shopping agent." />
        )}
      </div>
    </div>
  );
}
