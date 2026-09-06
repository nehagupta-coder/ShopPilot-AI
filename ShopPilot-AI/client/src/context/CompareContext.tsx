import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

const Ctx = createContext<{
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
} | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const value = useMemo(
    () => ({
      ids,
      has: (id: string) => ids.includes(id),
      clear: () => setIds([]),
      toggle: (id: string) => {
        setIds((prev) => {
          if (prev.includes(id)) return prev.filter((x) => x !== id);
          if (prev.length >= 3) {
            toast.message("Compare up to 3 products");
            return prev;
          }
          return [...prev, id];
        });
      },
    }),
    [ids],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompare outside provider");
  return ctx;
}
