"use client";

import { useState, useRef, useEffect } from "react";
import {
  BotMessageSquare,
  CreditCard,
  Gift,
  Loader2,
  Send,
  Sparkles,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string;
}

const SUGGESTIONS = [
  { label: "Find a travel card under ₹5K", icon: CreditCard },
  { label: "How should I redeem my HDFC points?", icon: TrendingUp },
  { label: "Show me the best card offers", icon: Tag },
  { label: "Review my card portfolio", icon: Sparkles },
];

const agentLabels: Record<string, { label: string; color: string }> = {
  card_discovery: { label: "Card Discovery", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  reward_optimization: { label: "Reward Optimizer", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  offer_discovery: { label: "Offer Discovery", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  portfolio_advisor: { label: "Portfolio Advisor", color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Chat failed");
      }

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.response,
        agent: data.agent,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: `Sorry, something went wrong. ${err instanceof Error ? err.message : "Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">AI Advisor</h1>
        <p className="text-muted-foreground">
          Ask about cards, rewards, offers, or your portfolio. The right specialist agent responds automatically.
        </p>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 shadow-sm">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <BotMessageSquare className="size-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">How can I help you?</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                I can help you discover cards, optimize rewards, find offers, and review your portfolio.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label)}
                  className="flex items-center gap-2.5 rounded-xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/5"
                >
                  <s.icon className="size-4 shrink-0 text-indigo-500" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                  <BotMessageSquare className="size-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-muted"}`}>
                {msg.agent && (
                  <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${agentLabels[msg.agent]?.color ?? "bg-muted"}`}>
                    {agentLabels[msg.agent]?.label ?? msg.agent}
                  </span>
                )}
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <BotMessageSquare className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Ask about cards, rewards, offers..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          disabled={loading}
          className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-500 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
