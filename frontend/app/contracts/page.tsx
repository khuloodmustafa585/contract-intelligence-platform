export default function ContractsPage() {
  return (
    <main className="min-h-screen bg-[#0b1326] text-[#dae2fd] px-10 py-10">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold">Contract Management</h2>

            <p className="text-[#c4c5d9] mt-2">
              Intelligent monitoring of 1,284 active legal documents.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 transition-all px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-500/30">
            <span className="material-symbols-outlined">add</span>
            Upload Contract
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: "Total Contracts",
              value: "1,284",
              extra: "+4%",
            },
            {
              title: "High-Risk Contracts",
              value: "12",
              extra: "+2",
            },
            {
              title: "Expiring Soon",
              value: "28",
              extra: "3 days",
            },
            {
              title: "Pending Review",
              value: "45",
              extra: "6 urgent",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex justify-between mb-4">
                <span className="text-sm text-[#c4c5d9]">
                  {card.extra}
                </span>
              </div>

              <p className="text-xs uppercase tracking-widest text-[#8e90a2] mb-2">
                {card.title}
              </p>

              <h3 className="text-4xl font-bold">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Contracts Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Filter
              </button>

              <div className="px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Status: Active
              </div>
            </div>

            <div className="flex gap-2">
              {["All", "MSA", "SOW", "NDA"].map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  {[
                    "Contract Name",
                    "Counterparty",
                    "Upload Date",
                    "Status",
                    "Risk Level",
                    "Expiration",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-xs uppercase tracking-widest text-[#8e90a2]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {[
                  {
                    name: "MSA - Cloud Nexus 2024",
                    party: "Cloud Nexus Inc.",
                    date: "Jan 12, 2024",
                    status: "Executed",
                    risk: "Low",
                    expiration: "Dec 31, 2025",
                  },
                  {
                    name: "SOW - Project Horizon",
                    party: "SkyView Logistics",
                    date: "Mar 02, 2024",
                    status: "Under Review",
                    risk: "Medium",
                    expiration: "Jun 15, 2024",
                  },
                  {
                    name: "Lease Agreement - London HQ",
                    party: "Global Properties",
                    date: "Dec 15, 2023",
                    status: "Executed",
                    risk: "High",
                    expiration: "Apr 30, 2024",
                  },
                ].map((contract, index) => (
                  <tr
                    key={index}
                    className="hover:bg-white/5 transition-all"
                  >
                    <td className="px-6 py-5 font-medium">
                      {contract.name}
                    </td>

                    <td className="px-6 py-5 text-[#c4c5d9]">
                      {contract.party}
                    </td>

                    <td className="px-6 py-5 text-[#c4c5d9]">
                      {contract.date}
                    </td>

                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs uppercase tracking-widest">
                        {contract.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs uppercase tracking-widest ${
                          contract.risk === "High"
                            ? "bg-red-500/10 text-red-400"
                            : contract.risk === "Medium"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {contract.risk}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-[#c4c5d9]">
                      {contract.expiration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-[#c4c5d9]">
              Showing 1–4 of 1,284 contracts
            </p>

            <div className="flex gap-2">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    page === 1
                      ? "bg-indigo-500 text-white"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-indigo-400">
                auto_awesome
              </span>

              <h4 className="text-2xl font-semibold">
                AI Intelligence Digest
              </h4>
            </div>

            <p className="text-[#c4c5d9] leading-relaxed mb-6">
              We detected a systemic liability shift in 3 recent MSAs.
              The indemnification clauses are 15% more restrictive than
              your standard playbooks.
            </p>

            <button className="text-indigo-400 hover:underline">
              View Full Analysis
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h4 className="text-sm uppercase tracking-widest text-[#8e90a2] mb-6">
              Risk Distribution
            </h4>

            <div className="space-y-5">
              {[
                {
                  label: "Compliance",
                  value: "85%",
                  width: "85%",
                },
                {
                  label: "Liability",
                  value: "42%",
                  width: "42%",
                },
                {
                  label: "Renewals",
                  value: "12%",
                  width: "12%",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>

                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: item.width }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}