"use client";

import { useState, Dispatch, SetStateAction } from "react";
import {
  Bell,
  Brain,
  ShieldCheck,
  GitBranch,
  Puzzle,
  Palette,
  Save,
  RotateCcw,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  Key,
  Lock,
  Database,
  BookOpen,
  Activity,
  Cpu,
  HardDrive,
  Cloud,
  Hash,
  Video,
  FileEdit,
  Zap,
  ExternalLink,
  Check,
  ChevronRight,
  Sliders,
  Globe,
  Users,
  UserCheck,
  FileText,
  Eye,
  BarChart2,
  Layers,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import GlassCard from "@/components/ui/GlassCard";

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: "42px",
        height: "24px",
        borderRadius: "12px",
        background: checked
          ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
          : "rgba(255,255,255,0.07)",
        border: `1px solid ${checked ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.1)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
        boxShadow: checked ? "0 0 14px rgba(99,102,241,0.35)" : "none",
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#ffffff",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

// ─── Select ────────────────────────────────────────────────────────────────────

function SettingSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "rgba(10,20,40,0.85)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: "10px",
        color: "#94a3b8",
        fontSize: "0.8rem",
        padding: "7px 28px 7px 12px",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        minWidth: "162px",
        transition: "border-color 0.15s",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0f172a", color: "#94a3b8" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Setting Row ───────────────────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  description,
  children,
  last = false,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-4"
      style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: iconBg, border: `1px solid ${iconColor}33` }}
        >
          <Icon size={14} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: "#dae2fd" }}>
            {label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconColor,
  label,
  description,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  label: string;
  description: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-5"
      style={{ borderBottom: "1px solid rgba(99,102,241,0.10)" }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
        style={{
          background: `${iconColor}18`,
          border: `1px solid ${iconColor}30`,
          boxShadow: `0 0 18px ${iconColor}12`,
        }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Integration Card ──────────────────────────────────────────────────────────

function IntegrationCard({
  icon: Icon,
  iconColor,
  iconBg,
  name,
  description,
  connected,
  onToggle,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
  connected: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: hovered ? "rgba(26,35,64,0.75)" : "rgba(15,22,40,0.6)",
        border: `1px solid ${connected ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: connected ? "0 0 20px rgba(99,102,241,0.07)" : "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: iconBg, border: `1px solid ${iconColor}30` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#dae2fd" }}>
            {name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#64748b", lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: connected ? "#34d399" : "#475569" }}>
          <span
            className="h-1.5 w-1.5 rounded-full inline-block flex-shrink-0"
            style={{ background: connected ? "#10b981" : "#475569" }}
          />
          {connected ? "Connected" : "Not connected"}
        </span>
        <button
          onClick={onToggle}
          className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150"
          style={
            connected
              ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171", cursor: "pointer" }
              : { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: "#818cf8", cursor: "pointer" }
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = connected
              ? "rgba(239,68,68,0.16)"
              : "rgba(99,102,241,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = connected
              ? "rgba(239,68,68,0.08)"
              : "rgba(99,102,241,0.1)";
          }}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}

// ─── Advanced Card ─────────────────────────────────────────────────────────────

function AdvancedCard({
  icon: Icon,
  iconColor,
  title,
  description,
  badge,
  action,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  description: string;
  badge?: string;
  action: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 cursor-pointer"
      style={{
        background: hovered ? "rgba(26,35,64,0.8)" : "rgba(12,20,38,0.6)",
        border: "1px solid rgba(99,102,241,0.12)",
        boxShadow: hovered ? "0 0 24px rgba(99,102,241,0.1)" : "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
          style={{
            background: `${iconColor}15`,
            border: `1px solid ${iconColor}28`,
            boxShadow: hovered ? `0 0 16px ${iconColor}20` : "none",
            transition: "box-shadow 0.2s ease",
          }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        {badge && (
          <span
            className="rounded-lg px-2 py-0.5 text-xs font-medium"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: "#dae2fd" }}>
        {title}
      </p>
      <p className="text-xs mb-4" style={{ color: "#64748b", lineHeight: 1.5 }}>
        {description}
      </p>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: hovered ? "#818cf8" : "#6366f1",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: "0.75rem",
          fontWeight: 500,
          transition: "color 0.15s",
        }}
      >
        {action}
        <ChevronRight size={11} />
      </button>
    </div>
  );
}

// ─── Accent Color Dots ─────────────────────────────────────────────────────────

const ACCENT_OPTIONS = [
  { key: "indigo",  color: "#6366f1" },
  { key: "blue",    color: "#3b82f6" },
  { key: "cyan",    color: "#22d3ee" },
  { key: "violet",  color: "#7c3aed" },
  { key: "emerald", color: "#10b981" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // ── Notifications ──────────────────────────────────────────────
  const [emailAlerts,         setEmailAlerts]         = useState(true);
  const [highRiskAlerts,      setHighRiskAlerts]      = useState(true);
  const [renewalReminders,    setRenewalReminders]    = useState(true);
  const [obligationReminders, setObligationReminders] = useState(false);
  const [weeklySummary,       setWeeklySummary]       = useState(true);
  const [slackNotifs,         setSlackNotifs]         = useState(false);

  // ── AI Preferences ─────────────────────────────────────────────
  const [aiLanguage,            setAiLanguage]            = useState("english");
  const [riskSensitivity,       setRiskSensitivity]       = useState("balanced");
  const [autoSummaries,         setAutoSummaries]         = useState(true);
  const [clauseRecommendations, setClauseRecommendations] = useState(true);
  const [reviewMode,            setReviewMode]            = useState("comprehensive");
  const [confidenceThreshold,   setConfidenceThreshold]   = useState(75);

  // ── Security ───────────────────────────────────────────────────
  const [twoFactor,      setTwoFactor]      = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("8h");
  const [loginAlerts,    setLoginAlerts]    = useState(true);

  // ── Workflow ───────────────────────────────────────────────────
  const [defaultWorkflow,    setDefaultWorkflow]    = useState("standard");
  const [autoAssign,         setAutoAssign]         = useState(false);
  const [approvalRouting,    setApprovalRouting]    = useState("sequential");
  const [renewalEscalation,  setRenewalEscalation]  = useState(true);

  // ── Integrations ───────────────────────────────────────────────
  const [integrations, setIntegrations] = useState({
    googledrive: true,
    onedrive:    false,
    slack:       true,
    teams:       false,
    docusign:    true,
    salesforce:  false,
  });

  // ── Appearance ─────────────────────────────────────────────────
  const [compactMode,       setCompactMode]       = useState(false);
  const [accentColor,       setAccentColor]       = useState("indigo");
  const [dashboardDensity,  setDashboardDensity]  = useState("comfortable");

  const [unsaved, setUnsaved] = useState(false);

  function mark<T>(setter: Dispatch<SetStateAction<T>>) {
    return (v: T) => { setter(v); setUnsaved(true); };
  }

  function toggleIntegration(key: keyof typeof integrations) {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }));
    setUnsaved(true);
  }

  function handleSave() { setUnsaved(false); }

  function handleReset() {
    setEmailAlerts(true);   setHighRiskAlerts(true);  setRenewalReminders(true);
    setObligationReminders(false);  setWeeklySummary(true);  setSlackNotifs(false);
    setAiLanguage("english");  setRiskSensitivity("balanced");  setAutoSummaries(true);
    setClauseRecommendations(true);  setReviewMode("comprehensive");  setConfidenceThreshold(75);
    setTwoFactor(true);  setSessionTimeout("8h");  setLoginAlerts(true);
    setDefaultWorkflow("standard");  setAutoAssign(false);
    setApprovalRouting("sequential");  setRenewalEscalation(true);
    setCompactMode(false);  setAccentColor("indigo");  setDashboardDensity("comfortable");
    setUnsaved(false);
  }

  const sliderPct = ((confidenceThreshold - 30) / 69) * 100;

  return (
    <AppShell>
      <div className="px-8 pt-12 pb-16 max-w-6xl mx-auto">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)" }} />
            <span className="font-mono-label" style={{ color: "#6366f1", fontSize: "0.65rem" }}>
              Settings
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#dae2fd" }}>
            Workspace Settings
          </h1>
          <div className="h-2" />
          <p className="text-sm" style={{ color: "#64748b" }}>
            Manage platform preferences, notifications, integrations, security, and AI behavior.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── A. Notifications ──────────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={Bell}
              iconColor="#6366f1"
              label="Notifications"
              description="Control how and when you receive contract alerts and digest emails"
            />
            <div className="px-6 pb-2">
              <SettingRow
                icon={Mail}
                iconColor="#6366f1"
                iconBg="rgba(99,102,241,0.1)"
                label="Email alerts"
                description="Receive renewal, overdue, and contract status notices by email"
              >
                <Toggle checked={emailAlerts} onChange={mark(setEmailAlerts)} />
              </SettingRow>
              <SettingRow
                icon={AlertTriangle}
                iconColor="#ef4444"
                iconBg="rgba(239,68,68,0.1)"
                label="High-risk contract alerts"
                description="Instant notifications when AI detects high-risk clauses or anomalies"
              >
                <Toggle checked={highRiskAlerts} onChange={mark(setHighRiskAlerts)} />
              </SettingRow>
              <SettingRow
                icon={Clock}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.1)"
                label="Renewal reminders"
                description="Automated alerts 30, 14, and 7 days before a contract expires"
              >
                <Toggle checked={renewalReminders} onChange={mark(setRenewalReminders)} />
              </SettingRow>
              <SettingRow
                icon={Activity}
                iconColor="#22d3ee"
                iconBg="rgba(34,211,238,0.1)"
                label="Obligation reminders"
                description="Timely reminders for upcoming contractual obligations and deadlines"
              >
                <Toggle checked={obligationReminders} onChange={mark(setObligationReminders)} />
              </SettingRow>
              <SettingRow
                icon={BarChart2}
                iconColor="#10b981"
                iconBg="rgba(16,185,129,0.1)"
                label="Weekly summary emails"
                description="A curated digest of contract activity, risk changes, and team updates"
              >
                <Toggle checked={weeklySummary} onChange={mark(setWeeklySummary)} />
              </SettingRow>
              <SettingRow
                icon={Hash}
                iconColor="#818cf8"
                iconBg="rgba(129,140,248,0.1)"
                label="Slack / Teams notifications"
                description="Push alerts directly to your connected workspace channels"
                last
              >
                <Toggle checked={slackNotifs} onChange={mark(setSlackNotifs)} />
              </SettingRow>
            </div>
          </GlassCard>

          {/* ── B. AI Preferences ─────────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={Brain}
              iconColor="#7c3aed"
              label="AI Preferences"
              description="Configure how the AI engine analyzes, summarizes, and reviews your contracts"
            />
            <div className="px-6 pb-2">
              <SettingRow
                icon={Globe}
                iconColor="#3b82f6"
                iconBg="rgba(59,130,246,0.1)"
                label="Analysis language"
                description="Primary language used for AI extraction, summaries, and clause matching"
              >
                <SettingSelect
                  value={aiLanguage}
                  onChange={mark(setAiLanguage)}
                  options={[
                    { value: "english",  label: "English"  },
                    { value: "spanish",  label: "Spanish"  },
                    { value: "french",   label: "French"   },
                    { value: "german",   label: "German"   },
                    { value: "mandarin", label: "Mandarin" },
                    { value: "arabic",   label: "Arabic"   },
                  ]}
                />
              </SettingRow>
              <SettingRow
                icon={Sliders}
                iconColor="#7c3aed"
                iconBg="rgba(124,58,237,0.1)"
                label="Risk sensitivity level"
                description="How aggressively the AI flags potential contract risks and red flags"
              >
                <SettingSelect
                  value={riskSensitivity}
                  onChange={mark(setRiskSensitivity)}
                  options={[
                    { value: "conservative", label: "Conservative" },
                    { value: "balanced",     label: "Balanced"     },
                    { value: "aggressive",   label: "Aggressive"   },
                  ]}
                />
              </SettingRow>
              <SettingRow
                icon={FileText}
                iconColor="#22d3ee"
                iconBg="rgba(34,211,238,0.1)"
                label="Auto-generate summaries"
                description="Create AI executive summaries automatically after each contract upload"
              >
                <Toggle checked={autoSummaries} onChange={mark(setAutoSummaries)} />
              </SettingRow>
              <SettingRow
                icon={BookOpen}
                iconColor="#6366f1"
                iconBg="rgba(99,102,241,0.1)"
                label="Clause recommendations"
                description="Suggest playbook-compliant clause alternatives during review"
              >
                <Toggle checked={clauseRecommendations} onChange={mark(setClauseRecommendations)} />
              </SettingRow>
              <SettingRow
                icon={Eye}
                iconColor="#10b981"
                iconBg="rgba(16,185,129,0.1)"
                label="Preferred review mode"
                description="Default depth of AI analysis applied to newly uploaded contracts"
              >
                <SettingSelect
                  value={reviewMode}
                  onChange={mark(setReviewMode)}
                  options={[
                    { value: "quick",         label: "Quick Scan"    },
                    { value: "standard",      label: "Standard"      },
                    { value: "comprehensive", label: "Comprehensive" },
                    { value: "deep",          label: "Deep Dive"     },
                  ]}
                />
              </SettingRow>

              {/* Confidence Threshold Slider */}
              <div className="py-4">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)" }}
                  >
                    <Cpu size={14} style={{ color: "#818cf8" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium" style={{ color: "#dae2fd" }}>
                        Confidence threshold
                      </p>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontFamily: "var(--font-mono, monospace)",
                          color: "#818cf8",
                          background: "rgba(99,102,241,0.12)",
                          border: "1px solid rgba(99,102,241,0.22)",
                          borderRadius: "6px",
                          padding: "1px 7px",
                        }}
                      >
                        {confidenceThreshold}%
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      Minimum AI confidence score required to surface a finding or clause match
                    </p>
                    <div className="mt-3">
                      <input
                        type="range"
                        min={30}
                        max={99}
                        step={1}
                        value={confidenceThreshold}
                        onChange={(e) => {
                          setConfidenceThreshold(Number(e.target.value));
                          setUnsaved(true);
                        }}
                        style={{
                          width: "100%",
                          appearance: "none",
                          WebkitAppearance: "none",
                          height: "5px",
                          borderRadius: "3px",
                          background: `linear-gradient(to right, #6366f1 ${sliderPct}%, rgba(99,102,241,0.15) ${sliderPct}%)`,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span style={{ fontSize: "0.68rem", color: "#3a4560" }}>30% — Lenient</span>
                        <span style={{ fontSize: "0.68rem", color: "#3a4560" }}>99% — Strict</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── C. Security & Access ──────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={ShieldCheck}
              iconColor="#10b981"
              label="Security & Access"
              description="Protect your workspace with authentication controls and access management"
            />
            <div className="px-6 pb-2">
              <SettingRow
                icon={Lock}
                iconColor="#10b981"
                iconBg="rgba(16,185,129,0.1)"
                label="Two-factor authentication"
                description="Require 2FA for all workspace members via TOTP authenticator or SMS"
              >
                <Toggle checked={twoFactor} onChange={mark(setTwoFactor)} />
              </SettingRow>
              <SettingRow
                icon={Clock}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.1)"
                label="Session timeout"
                description="Automatically sign out inactive sessions after the selected period"
              >
                <SettingSelect
                  value={sessionTimeout}
                  onChange={mark(setSessionTimeout)}
                  options={[
                    { value: "1h",    label: "1 hour"   },
                    { value: "4h",    label: "4 hours"  },
                    { value: "8h",    label: "8 hours"  },
                    { value: "24h",   label: "24 hours" },
                    { value: "never", label: "Never"    },
                  ]}
                />
              </SettingRow>
              <SettingRow
                icon={Bell}
                iconColor="#ef4444"
                iconBg="rgba(239,68,68,0.1)"
                label="Login alerts"
                description="Email notification when a sign-in occurs from a new device or location"
              >
                <Toggle checked={loginAlerts} onChange={mark(setLoginAlerts)} />
              </SettingRow>

              {/* API Token Row */}
              <div
                className="flex items-center justify-between gap-4 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.22)" }}
                  >
                    <Key size={14} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#dae2fd" }}>API token management</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      3 active tokens &middot; last used 2 hours ago
                    </p>
                  </div>
                </div>
                <button
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#818cf8",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.16)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.08)"; }}
                >
                  Manage tokens <ExternalLink size={10} />
                </button>
              </div>

              {/* Role Permissions Row */}
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.22)" }}
                  >
                    <UserCheck size={14} style={{ color: "#22d3ee" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#dae2fd" }}>Role permissions</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      Current role:{" "}
                      <span style={{ color: "#818cf8" }}>Admin</span>
                      {" "}· 4 members in workspace
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {["Admin", "Editor", "Viewer"].map((r) => (
                    <span
                      key={r}
                      className="rounded-lg px-2.5 py-1 text-xs"
                      style={{
                        background: r === "Admin" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${r === "Admin" ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.07)"}`,
                        color: r === "Admin" ? "#818cf8" : "#3a4560",
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── D. Workflow Settings ──────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={GitBranch}
              iconColor="#f59e0b"
              label="Workflow Settings"
              description="Automate contract routing, approval flows, and escalation rules"
            />
            <div className="px-6 pb-2">
              <SettingRow
                icon={GitBranch}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.1)"
                label="Default review workflow"
                description="Template automatically applied to all newly uploaded contracts"
              >
                <SettingSelect
                  value={defaultWorkflow}
                  onChange={mark(setDefaultWorkflow)}
                  options={[
                    { value: "standard",      label: "Standard Review"  },
                    { value: "fast-track",    label: "Fast Track"       },
                    { value: "legal-only",    label: "Legal Only"       },
                    { value: "full-approval", label: "Full Approval"    },
                  ]}
                />
              </SettingRow>
              <SettingRow
                icon={Users}
                iconColor="#3b82f6"
                iconBg="rgba(59,130,246,0.1)"
                label="Auto-assign contracts"
                description="Automatically assign new contracts to available team members"
              >
                <Toggle checked={autoAssign} onChange={mark(setAutoAssign)} />
              </SettingRow>
              <SettingRow
                icon={MessageSquare}
                iconColor="#7c3aed"
                iconBg="rgba(124,58,237,0.1)"
                label="Approval routing"
                description="How multi-step contract approvals are routed and processed"
              >
                <SettingSelect
                  value={approvalRouting}
                  onChange={mark(setApprovalRouting)}
                  options={[
                    { value: "sequential",   label: "Sequential"   },
                    { value: "parallel",     label: "Parallel"     },
                    { value: "any-approver", label: "Any Approver" },
                  ]}
                />
              </SettingRow>
              <SettingRow
                icon={AlertTriangle}
                iconColor="#ef4444"
                iconBg="rgba(239,68,68,0.1)"
                label="Renewal escalation rules"
                description="Escalate expiring high-value contracts to senior counsel automatically"
                last
              >
                <Toggle checked={renewalEscalation} onChange={mark(setRenewalEscalation)} />
              </SettingRow>
            </div>
          </GlassCard>

          {/* ── E. Integrations ───────────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={Puzzle}
              iconColor="#22d3ee"
              label="Integrations"
              description="Connect Contract Lens to your existing tools, storage, and communication platforms"
            />
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <IntegrationCard
                  icon={HardDrive}
                  iconColor="#34d399"
                  iconBg="rgba(52,211,153,0.1)"
                  name="Google Drive"
                  description="Sync contracts from Drive folders with automatic detection"
                  connected={integrations.googledrive}
                  onToggle={() => toggleIntegration("googledrive")}
                />
                <IntegrationCard
                  icon={Cloud}
                  iconColor="#3b82f6"
                  iconBg="rgba(59,130,246,0.1)"
                  name="Microsoft OneDrive"
                  description="Access SharePoint libraries and OneDrive contract repositories"
                  connected={integrations.onedrive}
                  onToggle={() => toggleIntegration("onedrive")}
                />
                <IntegrationCard
                  icon={Hash}
                  iconColor="#818cf8"
                  iconBg="rgba(129,140,248,0.1)"
                  name="Slack"
                  description="Send contract alerts and approval requests to Slack channels"
                  connected={integrations.slack}
                  onToggle={() => toggleIntegration("slack")}
                />
                <IntegrationCard
                  icon={Video}
                  iconColor="#60a5fa"
                  iconBg="rgba(96,165,250,0.1)"
                  name="Microsoft Teams"
                  description="Post contract updates and review notifications to Teams"
                  connected={integrations.teams}
                  onToggle={() => toggleIntegration("teams")}
                />
                <IntegrationCard
                  icon={FileEdit}
                  iconColor="#fbbf24"
                  iconBg="rgba(251,191,36,0.1)"
                  name="DocuSign"
                  description="Send finalized contracts for e-signature directly from the platform"
                  connected={integrations.docusign}
                  onToggle={() => toggleIntegration("docusign")}
                />
                <IntegrationCard
                  icon={Zap}
                  iconColor="#22d3ee"
                  iconBg="rgba(34,211,238,0.1)"
                  name="Salesforce"
                  description="Pull customer and opportunity data to enrich contract context"
                  connected={integrations.salesforce}
                  onToggle={() => toggleIntegration("salesforce")}
                />
              </div>
            </div>
          </GlassCard>

          {/* ── F. Appearance ─────────────────────────────────────── */}
          <GlassCard>
            <SectionHeader
              icon={Palette}
              iconColor="#818cf8"
              label="Appearance"
              description="Customize the visual style and layout density of your workspace"
            />
            <div className="px-6 pb-2">
              <SettingRow
                icon={Eye}
                iconColor="#818cf8"
                iconBg="rgba(129,140,248,0.1)"
                label="Dark mode"
                description="Always-on dark theme optimized for extended legal document review sessions"
              >
                <Toggle checked={true} onChange={() => {}} disabled />
              </SettingRow>
              <SettingRow
                icon={Layers}
                iconColor="#22d3ee"
                iconBg="rgba(34,211,238,0.1)"
                label="Compact table mode"
                description="Use denser row spacing across all contract list and grid views"
              >
                <Toggle checked={compactMode} onChange={mark(setCompactMode)} />
              </SettingRow>

              {/* Accent Color Picker */}
              <div
                className="flex items-center justify-between gap-4 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)" }}
                  >
                    <Palette size={14} style={{ color: "#818cf8" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#dae2fd" }}>
                      Accent color
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      Primary highlight color used across UI elements and badges
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ACCENT_OPTIONS.map(({ key, color }) => (
                    <button
                      key={key}
                      onClick={() => { setAccentColor(key); setUnsaved(true); }}
                      title={key}
                      className="h-6 w-6 rounded-full flex items-center justify-center transition-all duration-150"
                      style={{
                        background: color,
                        border: `2px solid ${accentColor === key ? "#ffffff" : "transparent"}`,
                        boxShadow: accentColor === key ? `0 0 10px ${color}70` : "none",
                        cursor: "pointer",
                        padding: 0,
                        outline: "none",
                      }}
                    >
                      {accentColor === key && (
                        <Check size={10} style={{ color: "#fff", strokeWidth: 3 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <SettingRow
                icon={BarChart2}
                iconColor="#3b82f6"
                iconBg="rgba(59,130,246,0.1)"
                label="Dashboard density"
                description="Controls how much information is displayed on the main dashboard"
                last
              >
                <SettingSelect
                  value={dashboardDensity}
                  onChange={mark(setDashboardDensity)}
                  options={[
                    { value: "spacious",     label: "Spacious"     },
                    { value: "comfortable",  label: "Comfortable"  },
                    { value: "compact",      label: "Compact"      },
                  ]}
                />
              </SettingRow>
            </div>
          </GlassCard>

          {/* ── Enterprise / Advanced ─────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #6366f1)" }} />
              <span className="font-mono-label" style={{ color: "#7c3aed", fontSize: "0.65rem" }}>
                Enterprise
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AdvancedCard
                icon={BookOpen}
                iconColor="#818cf8"
                title="Policy Playbooks"
                description="Define fallback positions and pre-approved clause deviations for your negotiation teams."
                badge="Active"
                action="Manage playbooks"
              />
              <AdvancedCard
                icon={ShieldCheck}
                iconColor="#10b981"
                title="Compliance Rules"
                description="Configure jurisdiction-specific checks for GDPR, SOX, HIPAA, CCPA, and more."
                badge="3 rules"
                action="Configure rules"
              />
              <AdvancedCard
                icon={Cpu}
                iconColor="#7c3aed"
                title="AI Governance"
                description="Set output guardrails, review AI model versions, and audit AI decision logs."
                action="View governance"
              />
              <AdvancedCard
                icon={Database}
                iconColor="#3b82f6"
                title="Data Retention"
                description="Define how long contract data, extracted text, and AI analyses are retained."
                badge="90 days"
                action="Set retention policy"
              />
              <AdvancedCard
                icon={Activity}
                iconColor="#f59e0b"
                title="Audit Logs"
                description="Full immutable audit trail of all user actions, document access, and AI processing events."
                action="View audit logs"
              />
              <AdvancedCard
                icon={Users}
                iconColor="#22d3ee"
                title="SSO & Directory Sync"
                description="Configure SAML 2.0 or OIDC single sign-on and sync users from your identity provider."
                badge="Enterprise"
                action="Configure SSO"
              />
            </div>
          </div>

          {/* ── Save Area ─────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-5"
            style={{
              background: "rgba(15,22,40,0.75)",
              border: `1px solid ${unsaved ? "rgba(99,102,241,0.32)" : "rgba(255,255,255,0.06)"}`,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: unsaved ? "0 0 28px rgba(99,102,241,0.12)" : "none",
              transition: "all 0.3s ease",
            }}
          >
            <div className="flex items-center gap-3">
              {unsaved ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: "#6366f1", boxShadow: "0 0 8px rgba(99,102,241,0.8)" }}
                  />
                  <p className="text-sm" style={{ color: "#94a3b8" }}>
                    You have unsaved changes
                  </p>
                </>
              ) : (
                <>
                  <Check size={14} style={{ color: "#10b981" }} />
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    All settings saved
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.08)";
                  el.style.color = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.04)";
                  el.style.color = "#64748b";
                }}
              >
                <RotateCcw size={13} />
                Reset to defaults
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{
                  background: unsaved
                    ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
                    : "rgba(99,102,241,0.25)",
                  border: `1px solid ${unsaved ? "rgba(99,102,241,0.55)" : "rgba(99,102,241,0.18)"}`,
                  color: unsaved ? "#ffffff" : "#818cf8",
                  boxShadow: unsaved ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (unsaved) (e.currentTarget as HTMLElement).style.opacity = "0.87";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                <Save size={13} />
                Save changes
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
