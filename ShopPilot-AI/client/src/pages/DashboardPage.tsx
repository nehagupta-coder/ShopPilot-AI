import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui";
import { inr } from "../utils/format";
import { Markdownish } from "../components/Markdownish";
import type { ChatMessage } from "../types";
import { toast } from "sonner";

const prompts = [
  "Why did conversion drop this week?",
  "Which products should I promote?",
  "Which products are frequently bought together?",
  "What offer should I create?",
  "How can I increase average order value?",
  "Analyze this month's sales and tell me how to improve conversion.",
];

export function DashboardPage() {
  const { user, mockAI } = useAuth();
  const dash = useQuery({ queryKey: ["dash"], queryFn: api.dashboard, enabled: user?.role === "merchant" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [cid, setCid] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <EmptyState
        title="Merchant sign-in required"
        body="Use the demo merchant to open the growth dashboard."
        action={
          <Link to="/login" className="btn-primary">
            Sign in
          </Link>
        }
      />
    );
  }
  if (user.role !== "merchant") {
    return (
      <EmptyState
        title="This space is for merchants"
        body="Sign in as merchant@shopilot.ai to view growth intelligence."
        action={
          <Link to="/login" className="btn-primary">
            Switch account
          </Link>
        }
      />
    );
  }

  const o = dash.data?.overview;
  const cards = o
    ? [
        { l: "Revenue", v: inr(o.revenue) },
        { l: "Orders", v: String(o.orders) },
        { l: "Conversion", v: `${o.conversionRate}%` },
        { l: "AOV", v: inr(o.averageOrderValue) },
        { l: "Abandoned carts", v: `${o.abandonedCarts} · ${o.abandonedCartRate}%` },
        { l: "Repeat customers", v: String(o.repeatCustomers) },
      ]
    : [];

  async function ask(text: string) {
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    try {
      const res = await api.advisor(text, cid);
      setCid(res.conversationId);
      setMessages((m) => [...m, res.message]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Advisor failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) void ask(input.trim());
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-copper-600">Growth intelligence</p>
        <h1 className="mt-1 font-serif text-4xl">Merchant dashboard</h1>
        <p className="mt-2 text-sm text-ink-500">
          Metrics come from seeded demo analytics, not invented market data. {mockAI ? "Advisor is in mock mode." : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.l} className="card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-400">{c.l}</p>
            <p className="mt-2 text-2xl font-semibold">{c.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-medium">Sales trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash.data?.trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e1da" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#C97B42" fill="#F5E4D4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-medium">Category conversion</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.data?.categories ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e1da" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="conversion" fill="#2F6B4F" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Product performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-ink-400">
              <tr>
                <th className="py-2">Product</th>
                <th>Views</th>
                <th>Add to cart</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {dash.data?.topProducts.map((r) => (
                <tr key={r.product.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="py-2">{r.product.name}</td>
                  <td>{r.views}</td>
                  <td>{r.addToCarts}</td>
                  <td>{r.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.16em] text-copper-600">AI-generated recommendations</p>
        <h2 className="mt-1 font-serif text-2xl">Growth opportunities</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {dash.data?.growth.opportunities.map((op) => (
            <article key={op.title} className="card p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-400">{op.type}</p>
              <h3 className="mt-1 font-medium">{op.title}</h3>
              <p className="mt-2 text-sm">{op.insight}</p>
              <p className="mt-3 text-sm text-forest-700 dark:text-forest-400">
                <strong>Recommendation.</strong> {op.recommendation}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                <strong>Expected impact.</strong> {op.expectedImpact}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-400">{dash.data?.growth.source}</p>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-serif text-2xl">AI Growth Advisor</h2>
          <p className="text-sm text-ink-500">Asks tools for analytics, then writes an action plan.</p>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {prompts.map((p) => (
            <button key={p} type="button" className="chip hover:border-copper-400" onClick={() => ask(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="min-h-40 space-y-4 px-5 pb-4">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-2xl bg-ink-900 px-4 py-2 text-sm text-white" : "max-w-[92%]"}>
              {m.role === "user" ? m.content : <Markdownish text={m.content} />}
            </div>
          ))}
          {busy && <p className="text-sm text-ink-400">Analysing demo analytics…</p>}
        </div>
        <form onSubmit={onSubmit} className="border-t border-ink-100 p-4 dark:border-ink-800">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-full border border-ink-200 bg-transparent px-4 py-2 text-sm dark:border-ink-700"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about conversion, bundles, offers…"
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              Ask
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
