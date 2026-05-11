export default function UploadPage() {
  return (
    <main className="min-h-screen bg-[#0b1326] text-[#dae2fd] relative overflow-hidden">
      {/* Content Canvas */}
      <div className="pt-24 px-10 pb-12 max-w-[1440px] mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h2 className="text-5xl font-bold mb-2">Upload Center</h2>
          <p className="text-[#c4c5d9] text-lg">
            Securely ingest and analyze contracts with advanced neural extraction.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              icon: 'inventory_2',
              title: 'Total Analyzed',
              value: '1,482',
              extra: '+12%',
            },
            {
              icon: 'verified',
              title: 'OCR Accuracy',
              value: 'High Precision',
              extra: '98.4%',
            },
            {
              icon: 'bolt',
              title: 'Processing Speed',
              value: 'Sub-Second',
              extra: '2.4s avg',
            },
            {
              icon: 'report_problem',
              title: 'Risk Exposure',
              value: 'Low Margin',
              extra: '3 High',
            },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-indigo-400">
                  {card.icon}
                </span>
                <span className="text-sm text-[#c4c5d9]">{card.extra}</span>
              </div>

              <p className="text-xs uppercase tracking-widest text-[#8e90a2] mb-1">
                {card.title}
              </p>

              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Upload Area */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white/5 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center relative overflow-hidden h-[480px]">
              <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-20"></div>

                <span className="material-symbols-outlined text-indigo-400 text-5xl">
                  upload_file
                </span>
              </div>

              <h3 className="text-3xl font-semibold mb-3">
                Drop files here to analyze
              </h3>

              <p className="text-[#c4c5d9] max-w-md mx-auto mb-8">
                Select multiple PDF, DOCX, or scanned images. Our AI will
                automatically perform OCR and extract key clauses.
              </p>

              <div className="flex items-center gap-4 mb-10 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#222a3d] rounded-lg text-sm">
                  PDF
                </span>

                <span className="px-3 py-1 bg-[#222a3d] rounded-lg text-sm">
                  DOCX
                </span>

                <span className="px-3 py-1 bg-[#222a3d] rounded-lg text-sm">
                  Scanned Images
                </span>
              </div>

              <button className="bg-indigo-500 hover:bg-indigo-400 transition-all px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30">
                Select Files
              </button>
            </div>

            {/* Active Processing */}
            <div className="mt-6">
              <h4 className="text-2xl font-semibold mb-4">
                Active Processing
              </h4>

              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                    <span className="material-symbols-outlined">
                      description
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">
                        SaaS_Service_Agreement_v4.pdf
                      </p>

                      <span className="text-cyan-400 text-sm">
                        AI Analysis... 84%
                      </span>
                    </div>

                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[84%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h4 className="text-2xl font-semibold">AI Insights Panel</h4>
                <p className="text-sm text-[#8e90a2] mt-1">
                  Real-time analysis stream
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="font-semibold mb-1">Clause Extracted</p>
                  <p className="text-[#c4c5d9] text-sm leading-relaxed">
                    Detected “Termination for Convenience” with a 90-day notice
                    period.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Risk Flag Raised</p>
                  <p className="text-[#c4c5d9] text-sm leading-relaxed">
                    Unusual liability cap found exceeding company policy.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Multilingual Sync</p>
                  <p className="text-[#c4c5d9] text-sm leading-relaxed">
                    Japanese agreement auto-translated and indexed.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold">Tier Usage</p>

                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded uppercase">
                  Enterprise
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8e90a2]">
                      Pages Processed
                    </span>

                    <span>1,240 / 5,000</span>
                  </div>

                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[25%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="col-span-12">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h4 className="text-2xl font-semibold">Recent Analysis</h4>

                <button className="text-indigo-400 text-sm">
                  Filter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-sm text-[#8e90a2] uppercase">
                        Document Name
                      </th>

                      <th className="px-6 py-4 text-sm text-[#8e90a2] uppercase">
                        Type
                      </th>

                      <th className="px-6 py-4 text-sm text-[#8e90a2] uppercase">
                        Status
                      </th>

                      <th className="px-6 py-4 text-sm text-[#8e90a2] uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        NDA_Global_Partners_2024.pdf
                      </td>

                      <td className="px-6 py-4">Confidentiality</td>

                      <td className="px-6 py-4 text-green-400">
                        Completed
                      </td>

                      <td className="px-6 py-4 text-[#c4c5d9]">
                        Oct 24, 2023
                      </td>
                    </tr>

                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        Employment_Contract_H1.docx
                      </td>

                      <td className="px-6 py-4">HR</td>

                      <td className="px-6 py-4 text-green-400">
                        Completed
                      </td>

                      <td className="px-6 py-4 text-[#c4c5d9]">
                        Oct 23, 2023
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </main>
  );
}