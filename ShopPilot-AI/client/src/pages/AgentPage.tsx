import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Compass, Loader2, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { ChatMessage, Conversation } from "../types";
import { Markdownish } from "../components/Markdownish";
import { ProductCard } from "../components/ProductCard";
import { inr } from "../utils/format";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SUGGESTIONS = [
  "Find me the best laptop under ₹70,000 for coding.",
  "Build a work-from-home setup under ₹80,000.",
  "Compare the best 3 smartphones under ₹30,000.",
  "Optimize my cart for the best value.",
  "Find the best phone under ₹30,000.",
  "What's the best value product?",
];

export function AgentPage() {
  const { user, mockAI, demo } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { prompt?: string; about?: string } };
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.conversations("shopping").then((r) => setHistory(r.conversations));
    }
  }, [user]);

  useEffect(() => {
    const prompt = loc.state?.prompt ?? (loc.state?.about ? `Tell me about this product and whether I should buy it: ${loc.state.about}` : "");
    if (prompt) {
      setInput(prompt);
    }
  }, [loc.state]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function ensureUser() {
    if (user) return user;
    const u = await demo("customer");
    toast.message("Signed in as demo customer so the agent can act on a cart");
    return u;
  }

  async function send(text: string, confirmActionId?: string) {
    const clean = text.trim();
    if (!clean && !confirmActionId) return;
    await ensureUser();
    const optimistic: ChatMessage | null = clean
      ? { id: `local-${Date.now()}`, role: "user", content: clean, createdAt: new Date().toISOString() }
      : null;
    if (optimistic) setMessages((m) => [...m, optimistic]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.chat({
        message: clean || "Yes, proceed.",
        conversationId,
        mode: "shopping",
        confirmActionId,
      });
      setConversationId(res.conversationId);
      setMessages((m) => [...m, res.message]);
      qc.invalidateQueries({ queryKey: ["cart"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadConvo(id: string) {
    const res = await api.conversation(id);
    setConversationId(res.conversation.id);
    setMessages(res.conversation.messages);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="card hidden h-fit p-4 lg:block">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Sessions</p>
        <button
          className="btn-ghost mt-3 w-full"
          type="button"
          onClick={() => {
            setConversationId(undefined);
            setMessages([]);
          }}
        >
          New chat
        </button>
        <ul className="mt-4 space-y-2">
          {history.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
                onClick={() => loadConvo(c.id)}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="card flex min-h-[72vh] flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-copper-500" />
            <div>
              <p className="font-medium">Shopping agent</p>
              <p className="text-xs text-ink-400">
                {mockAI ? "Mock AI mode · real tools, deterministic planner" : "Live model · function calling"}
              </p>
            </div>
          </div>
          {mockAI && <span className="chip">MOCK MODE</span>}
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="mx-auto max-w-xl py-8 text-center">
              <h1 className="font-serif text-3xl">What should we find?</h1>
              <p className="mt-2 text-sm text-ink-500">
                I’ll extract constraints, call catalog tools, and only then recommend.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip hover:border-copper-400" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <article key={m.id} className={m.role === "user" ? "ml-auto max-w-[80%]" : "max-w-[92%]"}>
              {m.role === "user" ? (
                <div className="rounded-2xl bg-ink-900 px-4 py-3 text-sm text-white dark:bg-copper-600 dark:text-ink-950">
                  {m.content}
                </div>
              ) : (
                <div className="space-y-4">
                  {m.steps?.length ? (
                    <ol className="space-y-1.5 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-950">
                      {m.steps.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                          <Check className="h-3.5 w-3.5 text-forest-500" />
                          {s.label}
                          {s.tool && <span className="text-[11px] text-ink-400">{s.tool}</span>}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  <Markdownish text={m.content} />
                  {m.products?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {m.products.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onAdd={async (id) => {
                            await api.addToCart(id);
                            toast.success("Added to cart");
                            qc.invalidateQueries({ queryKey: ["cart"] });
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                  {m.comparison?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="text-ink-400">
                            <th className="py-2">Product</th>
                            <th>Price</th>
                            <th>Rating</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.comparison.map((p) => (
                            <tr key={p.id} className="border-t border-ink-100 dark:border-ink-800">
                              <td className="py-2 font-medium">{p.name}</td>
                              <td>{inr(p.price)}</td>
                              <td>{p.rating}★</td>
                              <td>
                                <button className="text-copper-600" type="button" onClick={() => nav(`/products/${p.id}`)}>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {m.pendingAction && (
                    <div className="rounded-xl border border-copper-200 bg-copper-50 p-4 text-sm dark:border-copper-800 dark:bg-copper-950/30">
                      <p className="font-medium">Confirmation needed</p>
                      <p className="mt-1 text-ink-500">{m.pendingAction.summary}</p>
                      <button
                        className="btn-primary mt-3"
                        type="button"
                        onClick={() => send("Yes, proceed.", m.pendingAction!.id)}
                      >
                        Confirm action
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking — selecting tools…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-ink-100 p-4 dark:border-ink-800">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-full border border-ink-200 bg-white px-4 py-3 text-sm outline-none focus:border-copper-400 dark:border-ink-700 dark:bg-ink-950"
              placeholder="Ask ShopPilot to find, compare, bundle, or add to cart…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-primary px-4" type="submit" disabled={busy}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
