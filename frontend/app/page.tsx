import Link from "next/link";
import { ArrowRight, Bot, FileText, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080d1a] text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-96 w-96 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Zap size={17} className="text-white" />
          </div>
          <span className="text-base font-bold text-white">Contract Lens</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm flex items-center gap-1.5">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-[rgba(59,130,246,0.08)] px-4 py-1.5 text-xs font-medium text-blue-300">
          <Zap size={11} /> AI-Powered Contract Intelligence
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white">
          Transform Contracts into{" "}
          <span className="text-gradient">Actionable Intelligence</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg text-slate-400">
          Upload contracts in any format. Contract Lens extracts clauses, detects risks,
          tracks obligations, and answers your legal questions — instantly.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
            Start for free <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="btn-ghost flex items-center gap-2 px-6 py-3 text-base">
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText,    title: "Smart Parsing",      desc: "PDF, DOCX, scanned documents — OCR included." },
            { icon: ShieldCheck, title: "Risk Detection",     desc: "AI-identified legal and business risks with severity ratings." },
            { icon: Bot,         title: "Ask AI",             desc: "Ask grounded questions against extracted contract clauses." },
            { icon: Zap,         title: "Obligation Tracker", desc: "Never miss a deadline with automated extraction and alerts." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-[rgba(99,131,200,0.1)] bg-[#0d1528] p-5 text-left"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/15">
                <Icon size={16} className="text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200">{title}</p>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative py-6 text-center text-xs text-slate-700">
        © {new Date().getFullYear()} Contract Lens — AI Contract Intelligence Platform
      </footer>
    </div>
  );
}
