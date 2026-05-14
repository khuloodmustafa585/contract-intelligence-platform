"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Bot, RefreshCw, Send } from "lucide-react";
import { api, Clause, ContractDetail, Risk } from "@/services/api";

export default function ContractViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.contract(id);
    setContract(data);
  }, [id]);

  useEffect(() => {
    let active = true;
    api.contract(id).then((data) => {
      if (active) setContract(data);
    }).catch((err) => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    const timer = setInterval(() => load().catch(() => undefined), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, load]);

  const highlightedClauseId = selectedRisk?.clause_id;
  const clauses = useMemo(() => contract?.clauses || [], [contract]);

  async function ask() {
    if (!question.trim()) return;
    const result = await api.ask(id, question);
    setAnswer(result.answer);
  }

  if (loading) return <main className="min-h-screen bg-slate-950 p-10 pt-24 text-slate-400">Loading contract...</main>;

  return (
    <main className="min-h-screen bg-slate-950 pt-16 text-slate-100">
      {error && <div className="mx-6 mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      {!contract ? <div className="p-10">Contract not found.</div> : (
        <section className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-y-auto p-6 lg:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{contract.title}</h1>
                <p className="mt-1 text-sm text-slate-400">Status: {contract.status} · Embeddings: {contract.embedding_status}</p>
              </div>
              <button onClick={() => api.analyze(contract.id).then(load)} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"><RefreshCw size={16} /> Re-analyze</button>
            </div>
            <article className="mx-auto max-w-4xl rounded-sm bg-white p-8 font-serif leading-7 text-slate-950 shadow-2xl">
              {clauses.length === 0 && <p>{contract.cleaned_text || contract.extracted_text || "No extracted text is available yet."}</p>}
              {clauses.map((clause: Clause) => (
                <section key={clause.id} className={`mb-5 border-l-4 pl-4 ${highlightedClauseId === clause.id ? "border-red-500 bg-red-50" : "border-transparent"}`}>
                  {clause.heading && <h2 className="mb-2 font-bold">{clause.heading}</h2>}
                  <p>{clause.text}</p>
                </section>
              ))}
            </article>
          </div>
          <aside className="border-l border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold">Analysis</h2>
            <div className="mt-4 space-y-5">
              <Panel title="Summary">
                <p className="text-sm text-slate-300">{contract.summaries[0]?.summary_text || "Summary will appear when analysis completes."}</p>
              </Panel>
              <Panel title="Risks">
                {contract.risks.length === 0 && <p className="text-sm text-slate-400">No risks found yet.</p>}
                {contract.risks.map((risk) => (
                  <button key={risk.id} onClick={() => setSelectedRisk(risk)} className="mb-2 w-full rounded-lg border border-slate-800 p-3 text-left hover:border-sky-500">
                    <div className="flex justify-between gap-3"><span className="font-medium">{risk.title}</span><span className="text-xs uppercase text-red-300">{risk.severity}</span></div>
                    <p className="mt-2 text-xs text-slate-400">{risk.explanation}</p>
                  </button>
                ))}
              </Panel>
              <Panel title="Obligations">
                {contract.obligations.slice(0, 6).map((item) => <p key={item.id} className="mb-2 text-sm text-slate-300">{item.title} {item.due_date ? `· ${item.due_date}` : ""}</p>)}
                {contract.obligations.length === 0 && <p className="text-sm text-slate-400">No obligations extracted yet.</p>}
              </Panel>
              <Panel title="Alerts">
                {contract.alerts.slice(0, 5).map((item) => <p key={item.id} className="mb-2 text-sm text-slate-300">{item.title}</p>)}
                {contract.alerts.length === 0 && <p className="text-sm text-slate-400">No alerts generated yet.</p>}
              </Panel>
              <Panel title="Ask AI">
                <div className="flex gap-2">
                  <input className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about this contract" />
                  <button onClick={ask} className="rounded-lg bg-sky-500 p-2 text-slate-950"><Send size={18} /></button>
                </div>
                {answer && <p className="mt-3 rounded-lg bg-slate-950 p-3 text-sm text-slate-300"><Bot className="mb-2 inline" size={16} /> {answer}</p>}
              </Panel>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>{children}</section>;
}
