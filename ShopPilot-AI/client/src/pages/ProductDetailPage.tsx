import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitCompare, MessageSquare, ShoppingBag } from "lucide-react";
import { api } from "../services/api";
import { inr } from "../utils/format";
import { Rating, SkeletonGrid } from "../components/ui";
import { ProductCard } from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCompare } from "../context/CompareContext";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const compare = useCompare();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => api.product(id), enabled: Boolean(id) });

  if (q.isLoading) return <SkeletonGrid n={1} />;
  if (q.isError || !q.data) {
    return (
      <div className="card p-10 text-center">
        <h1 className="font-serif text-3xl">Product not found</h1>
        <Link to="/products" className="btn-primary mt-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  const { product, related, reviews, summary } = q.data;

  async function add() {
    if (!user) return nav("/login");
    await api.addToCart(product.id);
    toast.success("Added to cart");
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <img src={product.images[0]} alt={product.name} className="aspect-[4/3] w-full object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">
            {product.brand} · {product.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl">{product.name}</h1>
          <div className="mt-3">
            <Rating value={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{inr(product.price)}</span>
            <span className="text-ink-400 line-through">{inr(product.originalPrice)}</span>
            <span className="chip">{product.discount}% off</span>
          </div>
          <p className="mt-4 text-ink-500">{product.description}</p>
          <p className="mt-2 text-sm">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={add}>
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
            <button className="btn-ghost" type="button" onClick={() => compare.toggle(product.id)}>
              <GitCompare className="h-4 w-4" /> Compare
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => nav("/agent", { state: { about: product.name } })}
            >
              <MessageSquare className="h-4 w-4" /> Ask AI about this
            </button>
          </div>
        </div>
      </div>

      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-copper-600">AI-generated summary</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">{summary.summary}</p>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Specifications</h2>
        <dl className="card divide-y divide-ink-100 dark:divide-ink-800">
          {product.specifications.map((s) => (
            <div key={s.key} className="grid grid-cols-2 px-5 py-3 text-sm">
              <dt className="text-ink-500">{s.key}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Reviews</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <Rating value={r.rating} />
              <h3 className="mt-2 font-medium">{r.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{r.body}</p>
              <p className="mt-2 text-xs text-ink-400">{r.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Related</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={async (pid) => {
                if (!user) return nav("/login");
                await api.addToCart(pid);
                toast.success("Added to cart");
                qc.invalidateQueries({ queryKey: ["cart"] });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
