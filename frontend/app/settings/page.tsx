"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Moon,
  Sun,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Building2,
  Mail,
  BadgeCheck,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useUser, getInitials } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";

/* ─── Shared card style — uses CSS vars so it reacts to theme ─────── */
const CARD: React.CSSProperties = {
  background: "var(--th-card-bg)",
  border: "1px solid var(--th-card-border)",
  boxShadow: "var(--th-card-shadow)",
  borderRadius: "20px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
};

/* ─── Fade-up animation (mirrors dashboard) ──────────────────────── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

/* ─── Section card header ─────────────────────────────────────────── */
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
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--th-text-1)", lineHeight: 1.3 }}>
          {title}
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", marginTop: "1px" }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Animated toggle switch ──────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: "46px",
        height: "26px",
        borderRadius: "13px",
        background: checked
          ? "linear-gradient(135deg, #3b82f6, #2563eb)"
          : "var(--th-tag-bg)",
        border: checked ? "1px solid rgba(59,130,246,0.5)" : "1px solid var(--th-tag-border)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        boxShadow: checked ? "0 0 14px rgba(59,130,246,0.3)" : "none",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "calc(100% - 22px)" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
          transition: "left 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </button>
  );
}

/* ─── Theme pill button ───────────────────────────────────────────── */
function ThemePill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 18px",
        borderRadius: "11px",
        fontSize: "0.82rem",
        fontWeight: active ? 600 : 400,
        background: active
          ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))"
          : "var(--th-subtle-bg)",
        border: active ? "1px solid rgba(59,130,246,0.35)" : "1px solid var(--th-tag-border)",
        color: active ? "#93c5fd" : "var(--th-text-3)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: active ? "0 0 16px rgba(59,130,246,0.1)" : "none",
      }}
    >
      <Icon size={14} style={{ color: active ? "#60a5fa" : "var(--th-text-3)" }} />
      {label}
    </button>
  );
}

/* ─── Inline notification ─────────────────────────────────────────── */
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
        background:
          type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
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

/* ─── Workspace / Profile section ────────────────────────────────── */
function WorkspaceSection() {
  const { user, updateUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.full_name ?? "Legal Team";
  const initials = getInitials(displayName);

  const handleEdit = () => {
    setNameValue(displayName);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleCancel = () => {
    setEditing(false);
    setNameValue(displayName);
    setToast(null);
  };

  const handleSave = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === displayName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setToast(null);
    try {
      await api.updateMe({ full_name: trimmed });
      updateUser({ full_name: trimmed });
      setEditing(false);
      setToast({ type: "success", message: "Workspace name updated" });
      setTimeout(() => setToast(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={CARD}>
      <SectionHeader
        icon={Building2}
        iconBg="rgba(59,130,246,0.1)"
        iconColor="#60a5fa"
        title="Workspace"
        subtitle="Your displayed workspace identity across the platform"
      />

      <div style={{ padding: "24px" }}>
        {/* Avatar + name row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              letterSpacing: "0.04em",
            }}
          >
            {initials}
          </div>
          <div>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--th-text-1)" }}>{displayName}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", marginTop: "2px" }}>
              Enterprise · {user?.email ?? "—"}
            </p>
          </div>
        </div>

        {/* Name field */}
        <div style={{ marginBottom: toast ? "14px" : "0" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--th-text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            Workspace Name
          </label>

          {editing ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                ref={inputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                maxLength={80}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "var(--th-input-bg)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  color: "var(--th-text-1)",
                  fontSize: "0.88rem",
                  outline: "none",
                  boxShadow: "0 0 0 3px rgba(59,130,246,0.07)",
                  transition: "border-color 0.15s",
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving || !nameValue.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving || !nameValue.trim() ? 0.6 : 1,
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                  transition: "opacity 0.15s",
                  flexShrink: 0,
                }}
              >
                <Save size={13} />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-tag-border)",
                  color: "var(--th-text-3)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--th-inner-hover)",
                border: "1px solid var(--th-tag-border)",
              }}
            >
              <span style={{ fontSize: "0.88rem", color: "var(--th-text-1)" }}>{displayName}</span>
              <button
                onClick={handleEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  background: "var(--th-subtle-bg)",
                  border: "1px solid var(--th-tag-border)",
                  color: "var(--th-text-3)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(59,130,246,0.1)";
                  el.style.color = "#60a5fa";
                  el.style.borderColor = "rgba(59,130,246,0.25)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "var(--th-subtle-bg)";
                  el.style.color = "var(--th-text-3)";
                  el.style.borderColor = "var(--th-tag-border)";
                }}
              >
                <Pencil size={11} />
                Edit
              </button>
            </div>
          )}
        </div>

        {toast && (
          <div style={{ marginTop: "12px" }}>
            <Toast type={toast.type} message={toast.message} />
          </div>
        )}

        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--th-text-4)",
            marginTop: "10px",
            lineHeight: 1.6,
          }}
        >
          This name appears in the dashboard greeting, sidebar profile card, and all workspace
          displays across the platform.
        </p>
      </div>
    </div>
  );
}

/* ─── Account info section ────────────────────────────────────────── */
function AccountSection() {
  const { user } = useUser();

  const fields = [
    {
      label: "Email Address",
      value: user?.email ?? "—",
      icon: Mail,
      color: "#60a5fa",
    },
    {
      label: "Account Status",
      value: user?.is_verified ? "Verified" : "Pending Verification",
      icon: BadgeCheck,
      color: user?.is_verified ? "#34d399" : "#fbbf24",
    },
    {
      label: "User ID",
      value: user ? `#${user.id}` : "—",
      icon: Shield,
      color: "#a78bfa",
    },
  ];

  return (
    <div style={CARD}>
      <SectionHeader
        icon={User}
        iconBg="rgba(167,139,250,0.1)"
        iconColor="#a78bfa"
        title="Account"
        subtitle="Your account details and verification status"
      />

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "var(--th-inner-hover)",
                border: "1px solid var(--th-tag-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={12} style={{ color }} />
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--th-text-3)" }}>{label}</span>
              </div>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "var(--th-text-1)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications section ───────────────────────────────────────── */
function NotificationsSection() {
  const { user, updateUser } = useUser();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const enabled = user?.email_notifications_enabled ?? true;

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    setToast(null);
    // Optimistic update
    updateUser({ email_notifications_enabled: value });
    try {
      await api.updateMe({ email_notifications_enabled: value });
      setToast({
        type: "success",
        message: value ? "Alert notifications enabled" : "Alert notifications disabled",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      // Revert optimistic update
      updateUser({ email_notifications_enabled: !value });
      const msg = err instanceof Error ? err.message : "Update failed";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={CARD}>
      <SectionHeader
        icon={Bell}
        iconBg="rgba(245,158,11,0.1)"
        iconColor="#fbbf24"
        title="Notifications"
        subtitle="Control how and when you receive contract alerts"
      />

      <div style={{ padding: "20px 24px" }}>
        {/* Main toggle row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderRadius: "14px",
            background: enabled
              ? "rgba(59,130,246,0.04)"
              : "var(--th-inner-hover)",
            border: enabled
              ? "1px solid rgba(59,130,246,0.12)"
              : "1px solid var(--th-tag-border)",
            transition: "background 0.25s, border-color 0.25s",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                background: enabled ? "rgba(59,130,246,0.12)" : "var(--th-subtle-bg)",
                border: enabled
                  ? "1px solid rgba(59,130,246,0.2)"
                  : "1px solid var(--th-tag-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.25s, border-color 0.25s",
              }}
            >
              <Bell
                size={15}
                style={{
                  color: enabled ? "#60a5fa" : "var(--th-text-3)",
                  transition: "color 0.25s",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: enabled ? "var(--th-text-1)" : "var(--th-text-3)",
                  marginBottom: "3px",
                  transition: "color 0.25s",
                }}
              >
                Alert Notifications
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--th-text-3)", lineHeight: 1.5 }}>
                Receive real-time alerts for contract events
              </p>
            </div>
          </div>
          <Toggle checked={enabled} onChange={handleToggle} disabled={saving} />
        </div>

        {/* Notification types (visual only, inherit from main toggle) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            opacity: enabled ? 1 : 0.4,
            transition: "opacity 0.25s",
          }}
        >
          {[
            { label: "High-risk contracts",  color: "#f87171" },
            { label: "Renewal reminders",    color: "#fbbf24" },
            { label: "Overdue obligations",  color: "#f87171" },
            { label: "Expiring contracts",   color: "#fbbf24" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "10px",
                background: "var(--th-inner-hover)",
                border: "1px solid var(--th-tag-border)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 6px ${color}88`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--th-text-3)" }}>{label}</span>
            </div>
          ))}
        </div>

        {toast && (
          <div style={{ marginTop: "14px" }}>
            <Toast type={toast.type} message={toast.message} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Appearance / theme section ──────────────────────────────────── */
function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={CARD}>
      <SectionHeader
        icon={Moon}
        iconBg="rgba(139,92,246,0.1)"
        iconColor="#a78bfa"
        title="Appearance"
        subtitle="Choose your preferred interface theme"
      />

      <div style={{ padding: "20px 24px" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <ThemePill
            label="Dark"
            icon={Moon}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
          <ThemePill
            label="Light"
            icon={Sun}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
        </div>

        {/* Preview swatch */}
        <div
          style={{
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--th-card-border)",
            boxShadow: "var(--th-card-shadow)",
          }}
        >
          {/* Preview header bar */}
          <div
            style={{
              padding: "10px 16px",
              background:
                theme === "dark"
                  ? "rgba(5, 12, 25, 0.9)"
                  : "rgba(248, 250, 252, 0.95)",
              borderBottom:
                theme === "dark"
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.25s, border-color 0.25s",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background:
                    i === 1 ? "#ef4444" : i === 2 ? "#f59e0b" : "#10b981",
                }}
              />
            ))}
            <div
              style={{
                flex: 1,
                height: "6px",
                borderRadius: "3px",
                background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
                marginLeft: "6px",
              }}
            />
          </div>
          {/* Preview body */}
          <div
            style={{
              padding: "16px",
              background: theme === "dark" ? "#060d1b" : "#f8fafc",
              transition: "background 0.25s",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Sidebar mock */}
              <div
                style={{
                  width: "50px",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  background: theme === "dark" ? "#060d1b" : "#f1f5f9",
                  border:
                    theme === "dark"
                      ? "1px solid rgba(255,255,255,0.055)"
                      : "1px solid rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  transition: "background 0.25s, border-color 0.25s",
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: "5px",
                      borderRadius: "3px",
                      background:
                        i === 1
                          ? "#3b82f6"
                          : theme === "dark"
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  />
                ))}
              </div>
              {/* Content mock */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    height: "14px",
                    borderRadius: "5px",
                    background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
                    width: "60%",
                  }}
                />
                <div
                  style={{
                    borderRadius: "8px",
                    padding: "8px",
                    background: theme === "dark" ? "rgba(10,20,38,0.65)" : "rgba(255,255,255,0.9)",
                    border:
                      theme === "dark"
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: "5px",
                        borderRadius: "3px",
                        background:
                          theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                        marginBottom: i < 2 ? "5px" : 0,
                        width: i === 2 ? "70%" : "100%",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--th-text-4)",
            marginTop: "12px",
            lineHeight: 1.6,
          }}
        >
          Theme preference is saved locally and persists across sessions.
          {theme === "light" && (
            <span style={{ color: "#fbbf24" }}>
              {" "}
              Light mode applies globally — some sections remain optimised for dark.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { theme } = useTheme();
  return (
    <AppShell>
      {/* Ambient glow — same pattern as dashboard */}
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
        {/* Page header */}
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
              Settings
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--th-text-3)" }}>
              Manage your workspace preferences, notifications, and appearance
            </p>
          </div>
        </FadeUp>

        {/* 2-column grid on wider screens, single column on narrow */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "20px",
          }}
        >
          <FadeUp delay={0.05}>
            <WorkspaceSection />
          </FadeUp>

          <FadeUp delay={0.1}>
            <NotificationsSection />
          </FadeUp>

          <FadeUp delay={0.15}>
            <AppearanceSection />
          </FadeUp>

          <FadeUp delay={0.2}>
            <AccountSection />
          </FadeUp>
        </div>

        {/* Footer — same as dashboard */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "32px",
            marginTop: "12px",
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
      </div>
    </AppShell>
  );
}
