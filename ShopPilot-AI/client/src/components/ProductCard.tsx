import { Link } from "react-router-dom";
import { GitCompare, ShoppingBag } from "lucide-react";
import type { Product } from "../types";
import { inr } from "../utils/format";
import { Rating } from "./ui";
import { useCompare } from "../context/CompareContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80";

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (id: string) => void;
}) {
  const compare = useCompare();
  const selected = compare.has(product.id);

  return (
    <article className="card group overflow-hidden">
      <Link
        to={`/products/${product.id}`}
        className="block overflow-hidden"
      >
        <div className="relative aspect-[4/3] bg-ink-100 dark:bg-ink-800">
          <img
            src={product.images?.[0] || FALLBACK_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          {product.discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white">
              {product.discount}% off
            </span>
          )}
        </div>
      </Link>

      <div className="space-y-2 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          {product.brand}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="block font-medium leading-snug hover:text-copper-600"
        >
          {product.name}
        </Link>

        <Rating
          value={product.rating}
          count={product.reviewCount}
        />

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {inr(product.price)}
          </span>

          {product.originalPrice > product.price && (
            <span className="text-sm text-ink-400 line-through">
              {inr(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            className="btn-primary flex-1 text-xs"
            type="button"
            onClick={() => onAdd?.(product.id)}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </button>

          <button
            className={`btn-ghost ${
              selected
                ? "border-copper-400 text-copper-600"
                : ""
            }`}
            type="button"
            onClick={() => compare.toggle(product.id)}
            aria-label="Compare"
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}