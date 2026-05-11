export default function ClauseLibraryPage() {
  return (
    <main className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex">
      {/* Left Category Panel */}
      <aside className="w-72 border-r border-white/10 bg-[#131b2e]/40 p-6 space-y-8">
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-300 mb-4">
            Categories
          </h3>

          <div className="space-y-2">
            {[
              ["Termination", "12"],
              ["Liability", "08"],
              ["Confidentiality", "15"],
              ["Indemnity", "05"],
              ["Force Majeure", "03"],
              ["Governing Law", "09"],
            ].map(([name, count], index) => (
              <button
                key={name}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all ${
                  index === 0
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "hover:bg-white/5 text-[#c4c5d9]"
                }`}
              >
                <span>{name}</span>

                <span className="text-xs px-2 py-1 rounded bg-white/5">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Risk Filters */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-300 mb-4">
            Risk Filters
          </h3>

          <div className="space-y-4">
            {[
              ["High Risk", "border-red-400"],
              ["Moderate Risk", "border-cyan-400"],
              ["Standard / Safe", "border-indigo-300"],
            ].map(([label, border]) => (
              <label
                key={label}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border ${border}`}
                ></div>

                <span className="text-[#c4c5d9]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Repository */}
      <section className="flex-1 overflow-y-auto px-10 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">
                Clause Intelligence
              </h1>

              <p className="text-[#c4c5d9] mt-3 text-lg">
                Search across 1,240 vetted legal clauses optimized by AI.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="p-3 rounded-xl border border-white/10 hover:bg-white/5">
                <span className="material-symbols-outlined">
                  filter_list
                </span>
              </button>

              <button className="p-3 rounded-xl border border-white/10 hover:bg-white/5">
                <span className="material-symbols-outlined">
                  sort
                </span>
              </button>
            </div>
          </div>

          {/* Clause Cards */}
          <div className="space-y-5">
            {[
              {
                category: "TERMINATION",
                risk: "HIGH RISK",
                riskStyle: "bg-red-500/10 text-red-400",
                title: "Mutual Convenience Clause v2",
                description:
                  "Either party may terminate this Agreement at any time, with or without cause, upon providing thirty (30) days prior written notice.",
                insight:
                  "Suggests 60-day notice for vendor protection.",
              },
              {
                category: "LIABILITY",
                risk: "MODERATE",
                riskStyle: "bg-cyan-500/10 text-cyan-400",
                title: "Aggregate Liability Cap (1x Annual)",
                description:
                  "The total aggregate liability of either party shall not exceed the amount paid or payable under this agreement.",
                insight:
                  "Industry standard for SaaS agreements.",
              },
              {
                category: "CONFIDENTIALITY",
                risk: "STANDARD",
                riskStyle: "bg-indigo-500/10 text-indigo-300",
                title: "Definition of Confidential Information",
                description:
                  "Confidential Information means all non-public information disclosed by a party whether orally or in writing.",
                insight:
                  "Includes standard exclusions for public domain data.",
              },
            ].map((clause, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex gap-3">
                    <span className="px-3 py-1 rounded-lg bg-[#222a3d] text-xs tracking-widest">
                      {clause.category}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-lg text-xs tracking-widest ${clause.riskStyle}`}
                    >
                      {clause.risk}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#8e90a2]">
                    <span className="material-symbols-outlined text-base">
                      database
                    </span>

                    128 Sources
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-3">
                  {clause.title}
                </h3>

                <p className="text-[#c4c5d9] leading-relaxed">
                  {clause.description}
                </p>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm">
                    <span className="material-symbols-outlined text-base">
                      auto_awesome
                    </span>

                    {clause.insight}
                  </div>

                  <span className="material-symbols-outlined text-[#8e90a2]">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Panel */}
      <aside className="w-[430px] border-l border-white/10 bg-[#131b2e]/30 backdrop-blur-xl p-8 overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">
              Clause Preview
            </h2>

            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                <span className="material-symbols-outlined">
                  content_copy
                </span>
              </button>

              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Clause Body */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>

              <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Analyzing Variations
              </span>
            </div>

            <p className="leading-relaxed text-[#dae2fd]">
              The total aggregate liability of either party for all claims
              arising out of or related to this agreement shall not exceed
              the amount paid or payable during the twelve month period
              preceding the claim.
            </p>
          </div>

          {/* AI Recommendation */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-300 mb-4">
              AI Recommendation
            </h3>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
              <p className="italic text-[#dae2fd] leading-relaxed">
                We recommend introducing a minimum liability floor of
                $50,000 for enterprise agreements to maintain balanced
                negotiation leverage.
              </p>

              <button className="mt-5 flex items-center gap-2 text-indigo-300 hover:underline">
                Apply Suggestion

                <span className="material-symbols-outlined text-base">
                  bolt
                </span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="block text-xs uppercase tracking-widest text-[#8e90a2] mb-2">
                Market Frequency
              </span>

              <h3 className="text-3xl font-bold">82%</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <span className="block text-xs uppercase tracking-widest text-[#8e90a2] mb-2">
                Favorability
              </span>

              <h3 className="text-3xl font-bold text-cyan-300">
                Neutral
              </h3>
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-indigo-300 mb-4">
              Historical Context
            </h3>

            <div className="space-y-3">
              {[
                ["Used in Project Zenith", "Oct 2023 • No Litigation"],
                ["Modified in Global Ops MSA", "Jan 2024 • Negotiated"],
              ].map(([title, subtitle]) => (
                <div
                  key={title}
                  className="flex gap-3 bg-white/5 rounded-xl p-4"
                >
                  <span className="material-symbols-outlined text-[#8e90a2]">
                    history
                  </span>

                  <div>
                    <p>{title}</p>

                    <span className="text-sm text-[#8e90a2]">
                      {subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition-all font-semibold shadow-lg shadow-indigo-500/30">
            Add to Contract View
          </button>
        </div>
      </aside>
    </main>
  );
}