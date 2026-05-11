export default function ContractViewPage() {
  return (
    <main className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#c4c5d9] cursor-pointer hover:text-indigo-400 transition-colors">
              arrow_back
            </span>

            <div>
              <h2 className="text-lg font-bold">
                MSA_Alpha_Systems_v4.2.pdf
              </h2>

              <p className="text-xs text-[#8e90a2]">
                Modified 2 hours ago •{" "}
                <span className="text-red-400 font-semibold">
                  High Risk Detected
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
              <span className="material-symbols-outlined text-sm text-indigo-400 mr-2">
                security
              </span>

              <span className="text-xs uppercase tracking-wide">
                Risk Score: 78/100
              </span>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2"></div>

            {["share", "download"].map((icon) => (
              <button
                key={icon}
                className="bg-white/5 hover:bg-white/10 flex items-center justify-center p-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {icon}
                </span>
              </button>
            ))}

            <button className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-lg">
                auto_awesome
              </span>

              <span>Re-Analyze</span>
            </button>
          </div>
        </header>

        {/* Split View */}
        <section className="flex-1 flex overflow-hidden">
          {/* LEFT DOCUMENT VIEWER */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {/* Viewer Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1 bg-[#131b2e]/80 backdrop-blur-md rounded-xl border border-white/10 shadow-xl">
              {["zoom_out", "zoom_in"].map((icon) => (
                <button
                  key={icon}
                  className="p-2 hover:bg-white/10 rounded-lg text-[#c4c5d9]"
                >
                  <span className="material-symbols-outlined">
                    {icon}
                  </span>
                </button>
              ))}

              <span className="px-3 text-sm">100%</span>

              <div className="w-px h-6 bg-white/10"></div>

              {["search", "print"].map((icon) => (
                <button
                  key={icon}
                  className="p-2 hover:bg-white/10 rounded-lg text-[#c4c5d9]"
                >
                  <span className="material-symbols-outlined">
                    {icon}
                  </span>
                </button>
              ))}
            </div>

            {/* Document */}
            <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
              <div className="w-full max-w-[850px] bg-white rounded-sm shadow-2xl p-16 text-[#1a1a1a] font-serif leading-relaxed min-h-[1200px] relative">
                <h1 className="text-3xl font-bold mb-8">
                  MASTER SERVICES AGREEMENT
                </h1>

                <p className="mb-4">
                  This Master Services Agreement ("Agreement") is
                  entered into as of October 24, 2023 by and between
                  Alpha Systems Inc. and Omega Logistics Group.
                </p>

                {/* Liability Clause */}
                <div className="relative group my-6">
                  <div className="absolute -left-12 top-0 text-red-500">
                    <span className="material-symbols-outlined text-2xl">
                      warning
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-3">
                    4. LIMITATION OF LIABILITY
                  </h2>

                  <p className="bg-red-500/10 border-l-4 border-red-500 px-4 py-2">
                    IN NO EVENT SHALL ALPHA SYSTEMS BE LIABLE FOR ANY
                    CONSEQUENTIAL OR INDIRECT DAMAGES. TOTAL LIABILITY
                    SHALL NOT EXCEED THE FEES PAID IN THE THREE (3)
                    MONTHS PRECEDING THE CLAIM.
                  </p>
                </div>

                {/* IP Clause */}
                <h2 className="text-xl font-bold mb-3 mt-8">
                  5. INTELLECTUAL PROPERTY
                </h2>

                <p className="mb-4">
                  All Work Product developed by Alpha shall remain the
                  sole and exclusive property of Alpha Systems Inc.
                </p>

                {/* Termination Clause */}
                <div className="relative group my-6">
                  <div className="absolute -left-12 top-0 text-indigo-500">
                    <span className="material-symbols-outlined text-2xl">
                      info
                    </span>
                  </div>

                  <h2 className="text-xl font-bold mb-3">
                    6. TERMINATION FOR CONVENIENCE
                  </h2>

                  <p className="bg-indigo-500/10 border-l-4 border-indigo-500 px-4 py-2">
                    Either party may terminate this Agreement at any
                    time upon providing one hundred and eighty (180)
                    days written notice.
                  </p>
                </div>

                {/* Governing Law */}
                <h2 className="text-xl font-bold mb-3 mt-8">
                  7. GOVERNING LAW
                </h2>

                <p>
                  This Agreement shall be governed by the laws of the
                  State of Delaware.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT AI PANEL */}
          <aside className="w-[480px] h-full border-l border-white/10 bg-[#131b2e]/40 backdrop-blur-xl flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/10 px-2 pt-2 gap-1 overflow-x-auto">
              {[
                "Risks",
                "Clauses",
                "Obligations",
                "Summary",
              ].map((tab, index) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-sm whitespace-nowrap ${
                    index === 0
                      ? "font-semibold text-indigo-400 border-b-2 border-indigo-400"
                      : "font-medium text-[#8e90a2] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}

              <button className="px-4 py-3 text-sm font-medium text-[#8e90a2] hover:text-white whitespace-nowrap flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  auto_awesome
                </span>

                Ask AI
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Risk Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/[0.08]">
                <div className="p-4 flex items-start justify-between bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400">
                      error
                    </span>

                    <h3 className="font-bold text-sm">
                      Critical Liability Imbalance
                    </h3>
                  </div>

                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase">
                    High Severity
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 italic text-sm text-[#c4c5d9]">
                    "...liability shall not exceed fees paid in the
                    three months preceding the claim."
                  </div>

                  <p className="text-sm">
                    The 3-month liability cap is unusually restrictive
                    for enterprise agreements.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      "Counter Clause",
                      "Past Precedent",
                    ].map((action) => (
                      <button
                        key={action}
                        className="text-[10px] px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clause Categories */}
              <div className="pt-4">
                <h4 className="text-xs uppercase tracking-widest text-[#8e90a2] mb-4">
                  Categorized Clauses
                </h4>

                <div className="space-y-2">
                  {[
                    ["gavel", "Indemnification"],
                    ["description", "Intellectual Property"],
                    ["lock", "Confidentiality"],
                  ].map(([icon, label]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-400">
                          {icon}
                        </span>

                        <span className="text-sm font-medium">
                          {label}
                        </span>
                      </div>

                      <span className="material-symbols-outlined text-[#8e90a2]">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ask AI Footer */}
            <div className="p-6 border-t border-white/10 bg-[#131b2e]/60">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>

                <span className="text-xs uppercase text-[#8e90a2]">
                  Ask AI anything about this contract
                </span>
              </div>

              <div className="relative">
                <input
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g., Summarize the payment terms"
                  type="text"
                />

                <button className="absolute right-2 top-2 p-1.5 rounded-lg bg-indigo-500 text-white hover:scale-105 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined">
                    send
                  </span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Check IP ownership",
                  "List all deadlines",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[#c4c5d9]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}