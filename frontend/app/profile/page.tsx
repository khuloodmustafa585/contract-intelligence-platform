"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Building2,
  MapPin,
  BadgeCheck,
  Shield,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Hash,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useUser, getInitials } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";

/* ─── Shared card style ─────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "var(--th-card-bg)",
  border: "1px solid var(--th-card-border)",
  boxShadow: "var(--th-card-shadow)",
  borderRadius: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
};

/* ─── Fade-up animation ─────────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section card header ────────────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "18px 24px",
        borderBottom: "1px solid var(--th-divider)",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          background: iconBg,
          border: `1px solid ${iconBg.replace("0.1)", "0.2)")}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <div>
        <p
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--th-text-1)",
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", marginTop: "1px" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─── Toast notification ─────────────────────────────────────────────── */
function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "0.8rem",
        background: type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        border:
          type === "success"
            ? "1px solid rgba(16,185,129,0.2)"
            : "1px solid rgba(239,68,68,0.2)",
        color: type === "success" ? "#34d399" : "#f87171",
      }}
    >
      {type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {message}
    </motion.div>
  );
}

/* ─── Status pill ────────────────────────────────────────────────────── */
function StatusPill({
  label,
  color,
  dotColor,
  bg,
  border,
}: {
  label: string;
  color: string;
  dotColor: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: bg,
        border: `1px solid ${border}`,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}88`,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/* ─── Read-only info row ─────────────────────────────────────────────── */
function InfoRow({
  icon: Icon,
  iconColor,
  label,
  value,
  last = false,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: "12px",
        background: "var(--th-inner-hover)",
        border: "1px solid var(--th-tag-border)",
        marginBottom: last ? 0 : "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "8px",
            background: `${iconColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={12} style={{ color: iconColor }} />
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--th-text-3)" }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: 500,
          color: value ? "var(--th-text-1)" : "var(--th-text-3)",
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
          maxWidth: "55%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/* ─── Editable input field ───────────────────────────────────────────── */
function EditField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 100,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "var(--th-text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        maxLength={maxLength}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "10px",
          background: "var(--th-input-bg)",
          border: "1px solid var(--th-input-border)",
          color: "var(--th-text-1)",
          fontSize: "0.88rem",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.07)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--th-input-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

/* ─── Name helpers ───────────────────────────────────────────────────── */
function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function joinFullName(first: string, last: string) {
  const f = first.trim();
  const l = last.trim();
  return l ? `${f} ${l}` : f;
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, updateUser, loading } = useUser();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    firstName:  "",
    lastName:   "",
    jobTitle:   "",
    department: "",
    company:    "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleEditStart = () => {
    if (!user) return;
    // Prefer stored first/last; fall back to parsing full_name for legacy accounts
    const stored_first = user.first_name ?? "";
    const stored_last  = user.last_name  ?? "";
    const fallback     = parseFullName(user.full_name);
    setDraft({
      firstName:  stored_first || fallback.firstName,
      lastName:   stored_last  || fallback.lastName,
      jobTitle:   user.job_title  ?? "",
      department: user.department ?? "",
      company:    user.company    ?? "",
    });
    setEditing(true);
    setToast(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setToast(null);
  };

  const handleSave = async () => {
    if (!user || !draft.firstName.trim()) return;
    const computedFullName = joinFullName(draft.firstName, draft.lastName);
    setSaving(true);
    setToast(null);
    try {
      await api.updateMe({
        first_name: draft.firstName.trim() || undefined,
        last_name:  draft.lastName.trim()  || null,
        job_title:  draft.jobTitle.trim()  || null,
        department: draft.department.trim() || null,
        company:    draft.company.trim()    || null,
      });
      updateUser({
        full_name:  computedFullName,
        first_name: draft.firstName.trim() || null,
        last_name:  draft.lastName.trim()  || null,
        job_title:  draft.jobTitle.trim()  || null,
        department: draft.department.trim() || null,
        company:    draft.company.trim()    || null,
      });
      setEditing(false);
      setToast({ type: "success", message: "Profile updated successfully" });
      setTimeout(() => setToast(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !user) return null;

  /* Live values — reflect draft during editing for instant hero preview */
  const displayName = editing
    ? joinFullName(draft.firstName, draft.lastName) || (user?.full_name ?? "")
    : (user?.full_name ?? "");
  const displayDepartment = editing ? draft.department : (user?.department ?? "");
  const displayCompany    = editing ? draft.company    : (user?.company    ?? "");

  const initials = getInitials(displayName || "U");
  const isVerified = user?.is_verified ?? false;
  const isLegalTeam = displayDepartment.toLowerCase().includes("legal");

  return (
    <AppShell>
      {/* Ambient glow — mirrors settings/dashboard */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 80% -10%, rgba(59,130,246,0.055) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          padding: "48px 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Page header ─────────────────────────────────────────── */}
        <FadeUp>
          <div style={{ marginBottom: "36px" }}>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                marginBottom: "6px",
                ...(theme === "dark"
                  ? {
                      background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : { color: "var(--th-text-1)" }),
              }}
            >
              Profile
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--th-text-3)" }}>
              Manage your personal information and workspace identity
            </p>
          </div>
        </FadeUp>

        {/* ── Loading skeleton ─────────────────────────────────────── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[180, 260].map((h) => (
              <div key={h} style={{ ...CARD, height: `${h}px` }}>
                <div
                  className="skeleton"
                  style={{ width: "100%", height: "100%", borderRadius: "20px" }}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && user && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ── Hero card ────────────────────────────────────────── */}
            <FadeUp delay={0.05}>
              <div style={CARD}>
                <div style={{ padding: "28px 32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "28px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left: avatar + status badges */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <div
                          style={{
                            width: "84px",
                            height: "84px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.6rem",
                            fontWeight: 700,
                            color: "#ffffff",
                            letterSpacing: "0.04em",
                            boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
                            border: "3px solid rgba(255,255,255,0.07)",
                            userSelect: "none",
                          }}
                        >
                          {initials}
                        </div>
                      </div>

                      {/* Active / Pending */}
                      <StatusPill
                        label={isVerified ? "Active" : "Pending"}
                        color={isVerified ? "#34d399" : "#fbbf24"}
                        dotColor={isVerified ? "#10b981" : "#f59e0b"}
                        bg={
                          isVerified
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(245,158,11,0.12)"
                        }
                        border={
                          isVerified
                            ? "rgba(16,185,129,0.25)"
                            : "rgba(245,158,11,0.25)"
                        }
                      />

                      {/* Job title pill — shown when user has set a title */}
                      {user?.job_title && (
                        <StatusPill
                          label={user.job_title}
                          color="#60a5fa"
                          dotColor="#3b82f6"
                          bg="rgba(59,130,246,0.12)"
                          border="rgba(59,130,246,0.25)"
                        />
                      )}

                      {/* Legal Team — derived from department */}
                      {isLegalTeam && (
                        <StatusPill
                          label="Legal Team"
                          color="#a78bfa"
                          dotColor="#8b5cf6"
                          bg="rgba(139,92,246,0.12)"
                          border="rgba(139,92,246,0.25)"
                        />
                      )}
                    </div>

                    {/* Right: name, department, company, edit button */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <h2
                        style={{
                          fontSize: "1.45rem",
                          fontWeight: 700,
                          color: "var(--th-text-1)",
                          lineHeight: 1.2,
                          marginBottom: "6px",
                        }}
                      >
                        {displayName || "—"}
                      </h2>

                      {/* Department · Company */}
                      {(displayDepartment || displayCompany) && (
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--th-text-2)",
                            marginBottom: "4px",
                          }}
                        >
                          {[displayDepartment, displayCompany]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      {/* Email */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        <Mail
                          size={12}
                          style={{ color: "var(--th-text-3)", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--th-text-3)" }}>
                          {user.email}
                        </span>
                        {isVerified && (
                          <BadgeCheck
                            size={13}
                            style={{ color: "#34d399", flexShrink: 0 }}
                          />
                        )}
                      </div>

                      {/* Edit Profile button */}
                      {!editing && (
                        <button
                          onClick={handleEditStart}
                          style={{
                            marginTop: "18px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            padding: "9px 18px",
                            borderRadius: "11px",
                            background:
                              "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08))",
                            border: "1px solid rgba(59,130,246,0.3)",
                            color: "#60a5fa",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background =
                              "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.12))";
                            el.style.borderColor = "rgba(59,130,246,0.5)";
                            el.style.boxShadow = "0 0 16px rgba(59,130,246,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background =
                              "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08))";
                            el.style.borderColor = "rgba(59,130,246,0.3)";
                            el.style.boxShadow = "none";
                          }}
                        >
                          <Pencil size={13} />
                          Edit Profile
                        </button>
                      )}

                      {/* Editing indicator */}
                      {editing && (
                        <div
                          style={{
                            marginTop: "14px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "9px",
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#3b82f6",
                              boxShadow: "0 0 8px rgba(59,130,246,0.8)",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: "0.72rem", color: "#60a5fa" }}>
                            Editing profile
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* ── 2-column grid ────────────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* ── Personal info card ─────────────────────────────── */}
              <FadeUp delay={0.1}>
                <div style={CARD}>
                  <SectionHeader
                    icon={User}
                    iconBg="rgba(59,130,246,0.1)"
                    iconColor="#60a5fa"
                    title="Personal Information"
                    subtitle="Your name, department, and company details"
                  />

                  <div style={{ padding: "20px 24px" }}>
                    <AnimatePresence mode="wait">
                      {editing ? (
                        /* ── Edit mode ── */
                        <motion.div
                          key="edit"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "0 14px",
                            }}
                          >
                            <EditField
                              label="First Name"
                              value={draft.firstName}
                              onChange={(v) =>
                                setDraft((d) => ({ ...d, firstName: v }))
                              }
                              placeholder="First name"
                              maxLength={100}
                            />
                            <EditField
                              label="Last Name"
                              value={draft.lastName}
                              onChange={(v) =>
                                setDraft((d) => ({ ...d, lastName: v }))
                              }
                              placeholder="Last name"
                              maxLength={100}
                            />
                          </div>
                          <EditField
                            label="Job Title"
                            value={draft.jobTitle}
                            onChange={(v) =>
                              setDraft((d) => ({ ...d, jobTitle: v }))
                            }
                            placeholder="e.g. Legal Counsel"
                            maxLength={255}
                          />
                          <EditField
                            label="Department"
                            value={draft.department}
                            onChange={(v) =>
                              setDraft((d) => ({ ...d, department: v }))
                            }
                            placeholder="e.g. Legal"
                            maxLength={255}
                          />
                          <EditField
                            label="Company"
                            value={draft.company}
                            onChange={(v) =>
                              setDraft((d) => ({ ...d, company: v }))
                            }
                            placeholder="e.g. Acme Corporation"
                            maxLength={255}
                          />

                          {/* Save / Cancel */}
                          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                            <button
                              onClick={handleSave}
                              disabled={saving || !draft.firstName.trim()}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "10px 16px",
                                borderRadius: "11px",
                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                border: "none",
                                color: "#ffffff",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                cursor:
                                  saving || !draft.firstName.trim()
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  saving || !draft.firstName.trim() ? 0.6 : 1,
                                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                                transition: "opacity 0.15s",
                              }}
                            >
                              <Save size={13} />
                              {saving ? "Saving…" : "Save Changes"}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={saving}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "10px 16px",
                                borderRadius: "11px",
                                background: "var(--th-subtle-bg)",
                                border: "1px solid var(--th-tag-border)",
                                color: "var(--th-text-3)",
                                fontSize: "0.82rem",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.color = "var(--th-text-2)";
                                el.style.borderColor = "rgba(255,255,255,0.14)";
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.color = "var(--th-text-3)";
                                el.style.borderColor = "var(--th-tag-border)";
                              }}
                            >
                              <X size={13} />
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        /* ── View mode ── */
                        <motion.div
                          key="view"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {(() => {
                            // Prefer stored first/last; fall back to parsing full_name
                            const fallback  = parseFullName(user.full_name);
                            const firstName = user.first_name ?? fallback.firstName;
                            const lastName  = user.last_name  ?? fallback.lastName;
                            return (
                              <>
                                <InfoRow
                                  icon={User}
                                  iconColor="#60a5fa"
                                  label="First Name"
                                  value={firstName}
                                />
                                <InfoRow
                                  icon={User}
                                  iconColor="#60a5fa"
                                  label="Last Name"
                                  value={lastName}
                                />
                                <InfoRow
                                  icon={MapPin}
                                  iconColor="#a78bfa"
                                  label="Job Title"
                                  value={user.job_title ?? ""}
                                />
                                <InfoRow
                                  icon={MapPin}
                                  iconColor="#22d3ee"
                                  label="Department"
                                  value={user.department ?? ""}
                                />
                                <InfoRow
                                  icon={Building2}
                                  iconColor="#fbbf24"
                                  label="Company"
                                  value={user.company ?? ""}
                                  last
                                />
                              </>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Toast */}
                    <AnimatePresence>
                      {toast && (
                        <div style={{ marginTop: "12px" }}>
                          <Toast type={toast.type} message={toast.message} />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </FadeUp>

              {/* ── Account card ───────────────────────────────────── */}
              <FadeUp delay={0.15}>
                <div style={CARD}>
                  <SectionHeader
                    icon={Shield}
                    iconBg="rgba(167,139,250,0.1)"
                    iconColor="#a78bfa"
                    title="Account"
                    subtitle="Your account details and verification status"
                  />

                  <div style={{ padding: "20px 24px" }}>
                    <InfoRow
                      icon={Mail}
                      iconColor="#60a5fa"
                      label="Email Address"
                      value={user.email}
                    />
                    <InfoRow
                      icon={BadgeCheck}
                      iconColor={isVerified ? "#34d399" : "#fbbf24"}
                      label="Account Status"
                      value={isVerified ? "Verified" : "Pending Verification"}
                    />
                    <InfoRow
                      icon={Hash}
                      iconColor="#a78bfa"
                      label="User ID"
                      value={`#${user.id}`}
                      last
                    />
                  </div>

                  {!isVerified && (
                    <div
                      style={{
                        margin: "0 24px 20px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.18)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <AlertCircle
                        size={13}
                        style={{ color: "#fbbf24", flexShrink: 0, marginTop: "1px" }}
                      />
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--th-text-3)",
                          lineHeight: 1.5,
                        }}
                      >
                        Your email address has not been verified. Check your inbox for a
                        verification link.
                      </p>
                    </div>
                  )}
                </div>
              </FadeUp>
            </div>

            {/* ── Footer — mirrors settings/dashboard ──────────────── */}
            <FadeUp delay={0.2}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "32px",
                  marginTop: "4px",
                  borderTop: "1px solid var(--th-divider)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  {["SOC 2 Type II", "ISO 27001", "AES-256", "GDPR"].map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--th-text-4)",
                        letterSpacing: "0.07em",
                        fontWeight: 500,
                        textTransform: "uppercase",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--th-text-5)" }}>
                  Contract Lens · {new Date().getFullYear()}
                </span>
              </div>
            </FadeUp>
          </div>
        )}
      </div>
    </AppShell>
  );
}
