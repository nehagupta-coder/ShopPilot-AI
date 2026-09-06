import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Compass, MessageSquare, Search, Sparkles, Workflow } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { SkeletonGrid } from "../components/ui";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const demos = [
  "Find me the best laptop under ₹70,000 for coding.",
  "Build a work-from-home setup under ₹80,000.",
  "Compare the best 3 smartphones under ₹30,000.",
];

export function HomePage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const featured = useQuery({ queryKey: ["featured"], queryFn: () => api.products({ sort: "popularity", limit: 4 }) });
  const trending = useQuery({ queryKey: ["trending"], queryFn: () => api.products({ sort: "rating", limit: 4 }) });
  const recs = useQuery({ queryKey: ["recs"], queryFn: api.recommendations, enabled: Boolean(user) });
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.productMeta });

  async function add(id: string) {
    if (!user) return nav("/login");
    await api.addToCart(id);
    toast.success("Added to cart");
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-fadeUp">
          <p className="text-xs uppercase tracking-[0.22em] text-copper-600">Agentic commerce</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.15] md:text-6xl">
            Tell ShopPilot what you need. It shops with you.
          </h1>
          <p className="mt-5 max-w-xl text-ink-500">
            Not a chatbot bolted onto a catalog. An agent that understands constraints, searches the store,
            compares options, explains the why, and takes actions you approve.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/agent" className="btn-primary">
              Ask ShopPilot AI <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/products" className="btn-ghost">
              Browse catalog
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {demos.map((d) => (
              <button
                key={d}
                type="button"
                className="chip text-left hover:border-copper-400"
                onClick={() => nav("/agent", { state: { prompt: d } })}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="card relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-copper-100 blur-2xl dark:bg-copper-900/40" />
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Live agent path</p>
          <ol className="relative mt-5 space-y-4">
            {[
              "Understand: laptop · ≤ ₹70,000 · 16GB · battery · light",
              "Search catalog with those filters",
              "Rank 8 matches, explain trade-offs",
              "Recommend ASUS Vivobook 15 · ₹64,990",
              "On request: addToCart(productId)",
            ].map((line, i) => (
              <li key={line} className="flex gap-3 text-sm">
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-[11px] text-white dark:bg-copper-500 dark:text-ink-950">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <Search className="h-5 w-5 text-ink-400" />
          <h2 className="mt-3 font-serif text-2xl">Traditional shopping</h2>
          <p className="mt-2 text-sm text-ink-500">Search → Filter → Compare → Decide → Buy</p>
          <p className="mt-4 text-sm">You do the work of translating a need into facets and tabs.</p>
        </div>
        <div className="card border-copper-200 p-6 dark:border-copper-800">
          <Sparkles className="h-5 w-5 text-copper-500" />
          <h2 className="mt-3 font-serif text-2xl">Agentic commerce</h2>
          <p className="mt-2 text-sm text-ink-500">Tell AI → Understand → Search → Compare → Recommend → Act</p>
          <p className="mt-4 text-sm">The agent selects tools, reads the real catalog, and only then answers.</p>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Featured</p>
            <h2 className="font-serif text-3xl">High-signal picks</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-copper-600">
            View all
          </Link>
        </div>
        {featured.isLoading ? <SkeletonGrid n={4} /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.data?.items.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={add} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Trending</p>
          <h2 className="font-serif text-3xl">What shoppers rate highest</h2>
        </div>
        {trending.isLoading ? <SkeletonGrid n={4} /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trending.data?.items.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={add} />
            ))}
          </div>
        )}
      </section>

      {recs.data?.items.length ? (
        <section>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">For you</p>
            <h2 className="font-serif text-3xl">AI recommendations from your preferences</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recs.data.items.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onAdd={add} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 font-serif text-3xl">Shop by category</h2>
        <div className="flex flex-wrap gap-2">
          {meta.data?.categories.map((c) => (
            <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`} className="chip hover:border-copper-400">
              {c.name} · {c.count}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { icon: MessageSquare, t: "Speak naturally", d: "Budget, RAM, battery, weight — extracted into structured filters." },
          { icon: Workflow, t: "Real tool calls", d: "searchProducts, compare, addToCart, growth analytics — not scripted UI." },
          { icon: Compass, t: "Explainable picks", d: "Every recommendation states the constraints it satisfied." },
        ].map((x) => (
          <div key={x.t} className="card p-6">
            <x.icon className="h-5 w-5 text-copper-500" />
            <h3 className="mt-3 font-medium">{x.t}</h3>
            <p className="mt-2 text-sm text-ink-500">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
