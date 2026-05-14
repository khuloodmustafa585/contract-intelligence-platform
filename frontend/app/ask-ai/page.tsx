"use client";

import { useEffect, useState } from "react";
import { Bot, Send } from "lucide-react";
import { api, Contract } from "@/services/api";

export default function AskAIPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.contracts().then((items) => {
      setContracts(items);
      if (items[0]) setContractId(String(items[0].id));
    }).catch((err) => setError(err.message));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!contractId) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.ask(contractId, question);
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100 md:px-10">
      <form onSubmit={submit} className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="flex items-center gap-2 text-3xl font-semibold"><Bot className="text-sky-400" /> Ask AI</h1>
        <p className="mt-2 text-slate-400">Ask grounded questions against indexed contract clauses.</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
        <select className="mt-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={contractId} onChange={(e) => setContractId(e.target.value)}>
          {contracts.length === 0 && <option>No contracts available</option>}
          {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.title}</option>)}
        </select>
        <div className="mt-4 flex gap-2">
          <input className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-sky-500" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000} placeholder="What are the renewal obligations?" required />
          <button className="rounded-lg bg-sky-500 p-2 text-slate-950 disabled:opacity-60" disabled={loading || !contractId}><Send /></button>
        </div>
        {answer && <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4 text-slate-300">{answer}</div>}
      </form>
    </main>
  );
}
