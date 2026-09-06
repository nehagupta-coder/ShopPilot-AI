import { Star } from "lucide-react";
import { cn } from "../utils/format";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < Math.round(value) ? "fill-copper-500 text-copper-500" : "text-ink-300",
            )}
          />
        ))}
      </div>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count != null && <span className="text-ink-500">({count.toLocaleString("en-IN")})</span>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card px-8 py-16 text-center">
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ n = 8 }: { n?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton h-80" />
      ))}
    </div>
  );
}

export function Modal({
  open,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="font-serif text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-ink-500">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
