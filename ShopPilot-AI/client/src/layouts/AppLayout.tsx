import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCompare } from "../context/CompareContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";


const customerLinks = [
  { to: "/", label: "Home" },
  { to: "/agent", label: "AI Agent" },
  { to: "/products", label: "Products" },
  { to: "/compare", label: "Compare" },
  { to: "/orders", label: "Orders" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const compare = useCompare();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: api.cart,
    enabled: Boolean(user),
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-ink-50/80 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-copper-300 dark:bg-copper-500 dark:text-ink-950">
              <Compass className="h-4 w-4" />
            </span>
            ShopPilot AI
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {customerLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  isActive ? "font-semibold text-copper-600" : "text-ink-500 hover:text-ink-900 dark:hover:text-white"
                }
              >
                {l.label}
                {l.to === "/compare" && compare.ids.length ? ` (${compare.ids.length})` : ""}
              </NavLink>
            ))}
            {user?.role === "merchant" && (
              <NavLink to="/dashboard" className="font-medium text-forest-600">
                Growth
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-3" type="button" onClick={toggle} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/cart" className="btn-ghost relative px-3">
              <ShoppingBag className="h-4 w-4" />
              {user && (cart.data?.itemCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-copper-500 px-1 text-[10px] text-white">
                  {cart.data?.itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <button
                className="btn-ghost hidden sm:inline-flex"
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                {user.name.split(" ")[0]}
              </button>
            ) : (
              <Link to="/login" className="btn-primary hidden sm:inline-flex">
                Sign in
              </Link>
            )}
            <button className="btn-ghost px-3 md:hidden" type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-ink-100 px-4 py-3 md:hidden dark:border-ink-800">
            <div className="flex flex-col gap-2 text-sm">
              {customerLinks.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-1.5">
                  {l.label}
                </NavLink>
              ))}
              {user?.role === "merchant" && (
                <NavLink to="/dashboard" onClick={() => setOpen(false)} className="py-1.5">
                  Growth
                </NavLink>
              )}
              <Link to="/login" onClick={() => setOpen(false)} className="py-1.5">
                {user ? "Account" : "Sign in"}
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-100 py-10 text-center text-xs text-ink-400 dark:border-ink-800">
        ShopPilot AI · Agentic Commerce & Growth  · Created  by Neha Gupta
      </footer>
    </div>
  );
}
