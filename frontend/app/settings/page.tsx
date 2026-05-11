export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0b1326] text-[#dae2fd] px-10 py-10">
      <div className="max-w-[1440px] mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            Settings
          </h1>

          <p className="text-[#c4c5d9] text-lg">
            Manage your enterprise environment and personal preferences.
          </p>
        </div>

        <div className="flex gap-10">
          {/* Left Navigation */}
          <aside className="w-64 space-y-2 flex-shrink-0">
            {[
              "Profile",
              "Account",
              "Security",
              "Notifications",
              "Theme",
              "Language",
              "API Integrations",
              "Workspace",
            ].map((item, index) => (
              <button
                key={item}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  index === 0
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/5 hover:bg-white/10 text-[#c4c5d9]"
                }`}
              >
                <span className="material-symbols-outlined">
                  {index === 0
                    ? "account_circle"
                    : index === 1
                    ? "manage_accounts"
                    : index === 2
                    ? "security"
                    : index === 3
                    ? "notifications_active"
                    : index === 4
                    ? "palette"
                    : index === 5
                    ? "language"
                    : index === 6
                    ? "integration_instructions"
                    : "corporate_fare"}
                </span>

                {item}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <section className="flex-1 space-y-8">
            {/* Profile Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp9n5TcpfnouB9jwnrylE-MpwrDPIOxL9Tb6Q5AejaEnlFUi-T5g-HEBFy6r2Sytk7b5O1J4u2DWyflbTfx8JdBBEhaukr93-nkmnzOkyZQNSO7v9YDP_QY2AXvJuBOitneZjNuJqokS8Byn32efNaYSn_V542p8v48n-G9PQMekM13pCwJnrYqsox-AIKSXItCTjWBBMfoCyw73-84sWndPISmROhZerADErIa944pMiDEUfoY0SBSvAPOBa9w7ZPz77I3gib7R0J"
                    alt="Profile"
                    className="w-24 h-24 rounded-3xl object-cover border border-indigo-500/20"
                  />

                  <div>
                    <h2 className="text-3xl font-semibold mb-1">
                      Marcus Thorne
                    </h2>

                    <p className="text-[#c4c5d9] mb-4">
                      m.thorne@globallex.com
                    </p>

                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs tracking-widest">
                        ADMIN
                      </span>

                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs tracking-widest">
                        LEGAL TEAM
                      </span>
                    </div>
                  </div>
                </div>

                <button className="bg-indigo-500 hover:bg-indigo-400 transition-all px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-500/30">
                  Save Changes
                </button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#8e90a2]">
                    Full Name
                  </label>

                  <input
                    type="text"
                    defaultValue="Marcus Thorne"
                    className="w-full bg-[#131b2e] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#8e90a2]">
                    Job Title
                  </label>

                  <input
                    type="text"
                    defaultValue="General Counsel"
                    className="w-full bg-[#131b2e] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#8e90a2]">
                    Bio / Note
                  </label>

                  <textarea
                    rows={4}
                    defaultValue="Overseeing contract architecture and AI governance for the EMEA region."
                    className="w-full bg-[#131b2e] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-6">
              {/* Interface Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-indigo-300">
                    visibility
                  </span>

                  <h3 className="text-2xl font-semibold">
                    Interface
                  </h3>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Dark Mode</p>

                      <p className="text-sm text-[#8e90a2]">
                        Optimized for low-light precision.
                      </p>
                    </div>

                    <div className="w-14 h-7 bg-indigo-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white"></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        System Language
                      </p>

                      <p className="text-sm text-[#8e90a2]">
                        Bilingual AI analysis support.
                      </p>
                    </div>

                    <select className="bg-[#131b2e] border border-white/10 rounded-xl px-4 py-2">
                      <option>English (US)</option>
                      <option>French (CA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-cyan-300">
                    notifications
                  </span>

                  <h3 className="text-2xl font-semibold">
                    Notifications
                  </h3>
                </div>

                <div className="space-y-5">
                  {[
                    ["Risk Alerts", false],
                    ["AI Summary", true],
                    ["Comment Mentions", true],
                    ].map((item, index) => {
                    const [label, active] = item as [string, boolean];
                    return (
                    <div
                      key={label}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={`w-12 h-6 rounded-full relative ${
                          active
                            ? "bg-indigo-500"
                            : "bg-[#2d3449]"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white ${
                            active ? "right-1" : "left-1"
                          }`}
                        ></div>
                      </div>

                      <span>{label}</span>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-semibold mb-2">
                    API Integrations
                  </h3>

                  <p className="text-[#c4c5d9]">
                    Connect your existing legal stack and document
                    storage.
                  </p>
                </div>

                <button className="flex items-center gap-2 text-indigo-300 hover:underline">
                  <span className="material-symbols-outlined">
                    add
                  </span>

                  Connect New Service
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[
                  ["DocuSign", "Connected"],
                  ["Dropbox", "Connected"],
                  ["Salesforce", "Not Linked"],
                ].map(([name, status], index) => (
                  <div
                    key={name}
                    className="bg-[#131b2e]/50 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined">
                          {index === 0
                            ? "cloud"
                            : index === 1
                            ? "folder_shared"
                            : "token"}
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold">{name}</p>

                        <span
                          className={`text-xs uppercase tracking-widest ${
                            status === "Connected"
                              ? "text-green-400"
                              : "text-[#8e90a2]"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl transition-all ${
                        status === "Connected"
                          ? "border border-white/10 hover:bg-white/5"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                      }`}
                    >
                      {status === "Connected"
                        ? "Manage"
                        : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-semibold text-red-400 mb-2">
                    Danger Zone
                  </h3>

                  <p className="text-[#c4c5d9]">
                    Permanently delete your account and all
                    contract data.
                  </p>
                </div>

                <button className="px-6 py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating AI Status */}
      <div className="fixed bottom-6 right-6 bg-white/5 backdrop-blur-xl border border-indigo-500/20 rounded-full px-5 py-3 flex items-center gap-3 shadow-lg shadow-black/30">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>

        <span className="text-xs uppercase tracking-[0.2em] text-[#dae2fd]">
          AI Engine Active
        </span>
      </div>
    </main>
  );
}