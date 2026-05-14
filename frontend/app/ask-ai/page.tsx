"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, Zap } from "lucide-react";
import { api, AskAISource, Contract } from "@/services/api";
import AppShell from "@/components/layout/AppShell";

type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: AskAISource[];
};

const EXAMPLE_QUESTIONS = [
  "Does this contract auto-renew?",
  "Who carries liability in case of breach?",
  "What are the payment terms?",
  "Can either party terminate early?",
  "What are the confidentiality obligations?",
  "What happens if there is a force majeure event?",
];

export default function AskAIPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.contracts().then((items) => {
      const completed = items.filter((c) => c.status === "completed");
      setContracts(completed.length > 0 ? completed : items);
      if (items[0]) setContractId(String(items[0].id));
    }).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(q?: string) {
    const text = (q ?? question).trim();
    if (!text || !contractId || loading) return;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    setError("");
    try {
      const result = await api.ask(contractId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const selectedContract = contracts.find((c) => String(c.id) === contractId);

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Bot size={15} className="text-indigo-400" />
              <span className="text-xs font-medium uppercase tracking-widest text-indigo-400/70">
                Grounded AI
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Ask AI</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Grounded Q&A using clause retrieval and semantic search.
            </p>
          </div>

          {/* Contract selector */}
          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-[rgba(99,131,200,0.2)] bg-[#0d1528] py-2.5 pl-4 pr-10 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 cursor-pointer"
              value={contractId}
              onChange={(e) => {
                setContractId(e.target.value);
                setMessages([]);
              }}
            >
              {contracts.length === 0 && <option>No contracts available</option>}
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528]">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20">
                  <Sparkles size={28} className="text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-300">
                  {selectedContract ? `Ask anything about "${selectedContract.title}"` : "Select a contract to begin"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Answers are grounded in the actual contract clauses.
                </p>

                {/* Example questions */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      disabled={!contractId || loading}
                      className="rounded-lg border border-[rgba(99,131,200,0.12)] bg-[rgba(99,131,200,0.04)] px-3 py-1.5 text-xs text-slate-400 transition hover:border-blue-500/30 hover:text-slate-200 disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {msg.role === "user" ? (
                    <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-indigo-700 px-4 py-3 text-sm text-white shadow-lg shadow-blue-500/20">
                      {msg.text}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20">
                          <Bot size={14} className="text-indigo-400" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-[rgba(99,131,200,0.15)] bg-[rgba(13,21,40,0.8)] px-4 py-3 text-sm text-slate-300 leading-relaxed">
                          {msg.text}
                        </div>
                      </div>

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="ml-9 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 px-1">
                            Source Clauses
                          </p>
                          {msg.sources.slice(0, 3).map((src, j) => (
                            <div
                              key={j}
                              className="rounded-lg border border-[rgba(99,131,200,0.1)] bg-[rgba(99,131,200,0.03)] px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] text-slate-600">Clause #{src.clause_id}</span>
                                <span className="text-[10px] text-slate-600">
                                  {Math.round(src.score * 100)}% relevant
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{src.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20">
                    <Bot size={14} className="text-indigo-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[rgba(99,131,200,0.15)] bg-[rgba(13,21,40,0.8)] px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-indigo-400 ai-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[rgba(99,131,200,0.1)] p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  className="w-full rounded-xl border border-[rgba(99,131,200,0.15)] bg-[rgba(13,21,40,0.8)] py-3 pl-4 pr-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-blue-500/50"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
                  placeholder={contractId ? "Ask a question about this contract…" : "Select a contract first"}
                  maxLength={1000}
                  disabled={!contractId || loading}
                />
              </div>
              <button
                onClick={() => submit()}
                disabled={loading || !question.trim() || !contractId}
                className="flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-3 text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-700">
              <Zap size={9} className="inline mr-1" />
              Answers grounded in retrieved contract clauses — not general knowledge.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
