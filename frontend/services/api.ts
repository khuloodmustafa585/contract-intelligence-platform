const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export type User = {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  email_notifications_enabled: boolean;
  // Structured name fields — null for accounts created before this feature
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  created_at?: string | null;
  department?: string | null;
  company?: string | null;
  avatar_url?: string | null;
};

export type Contract = {
  id: number;
  title: string;
  owner_id: number;
  status: string;
  processing_error?: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  notice_period_days?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  ocr_used: boolean;
  parse_method?: string | null;
  is_indexed: boolean;
  embedding_status: string;
};

export type ContractFull = Contract & {
  extracted_text?: string | null;
  cleaned_text?: string | null;
  file_path?: string | null;
};

export type Clause = { id: number; contract_id: number; heading?: string | null; text: string; order_index: number; category?: string | null; page_number?: number | null; source_snippet?: string | null };
export type Risk = {
  id: number;
  contract_id: number;
  clause_id?: number | null;
  risk_type: string;
  severity: string;
  title: string;
  explanation?: string | null;
  suggested_action?: string | null;
  source_snippet?: string | null;
  // Per-risk AI-generated detail fields (null for risks created before this
  // feature was added — the frontend falls back to type-based templates then).
  // business_impact and trigger_terms are JSON-serialised string arrays.
  business_impact?: string | null;
  why_this_matters?: string | null;
  trigger_terms?: string | null;
  created_at: string;
};
export type Summary = { id: number; contract_id: number; summary_type: string; summary_text: string; created_at: string };
export type Obligation = { id: number; contract_id: number; clause_id?: number | null; title: string; description?: string | null; owner?: string | null; due_date?: string | null; status: string; source_snippet?: string | null; created_at: string };
export type Alert = { id: number; contract_id: number; alert_type: string; title: string; message?: string | null; status: string; trigger_date?: string | null; created_at: string };
export type ContractDetail = ContractFull & { clauses: Clause[]; risks: Risk[]; summaries: Summary[]; obligations: Obligation[]; alerts: Alert[] };

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function setToken(token: string) {
  localStorage.setItem("token", token);
  // Mirror in a cookie so Next.js middleware can read it for server-side
  // route protection (middleware cannot access localStorage).
  // 7-day expiry matches the ACCESS_TOKEN_EXPIRE_MINUTES * 336 sessions
  // expected by the backend. SameSite=Strict prevents CSRF.
  if (typeof document !== "undefined") {
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
    window.location.href = "/login";
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function loginUser(data: { email: string; password: string }) {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);
  const token = await request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  setToken(token.access_token);
  return token;
}

export async function registerUser(data: {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
}) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export async function verifyEmail(data: { email: string; code: string }) {
  return request("/auth/verify-email", { method: "POST", body: JSON.stringify(data) });
}

export async function resendVerification(data: { email: string }) {
  return request("/auth/resend-verification", { method: "POST", body: JSON.stringify(data) });
}

export const api = {
  me: () => request<User>("/users/me"),
  updateMe: (data: {
    // Structured name fields (preferred)
    first_name?: string | null;
    last_name?: string | null;
    job_title?: string | null;
    // Legacy display-name override (settings WorkspaceSection)
    full_name?: string;
    email_notifications_enabled?: boolean;
    department?: string | null;
    company?: string | null;
    avatar_url?: string | null;
  }) => request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  dashboard: () => request("/dashboard/metrics"),
  contracts: () => request<Contract[]>("/contracts/"),
  contract: (id: number | string) => request<ContractDetail>(`/contracts/${id}`),
  risks: () => request<Risk[]>("/insights/risks"),
  summaries: () => request<Summary[]>("/insights/summaries"),
  obligations: () => request<Obligation[]>("/insights/obligations"),
  alerts: () => request<Alert[]>("/alerts/"),
  markAlertRead: (id: number) => request(`/alerts/${id}/read`, { method: "PATCH" }),
  deleteContract: (id: number) => request(`/contracts/${id}`, { method: "DELETE" }),
  updateObligationStatus: (contractId: number, obligationId: number, status: "pending" | "completed" | "overdue") =>
    request<Obligation>(`/contracts/${contractId}/obligations/${obligationId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  analyze: (id: number) => request(`/contracts/${id}/analyze`, { method: "POST" }),
  ask: (id: number | string, question: string) => request<{
    clause_summary: string;
    quoted_clause: string | null;
    legal_risk: string | null;
    recommendation: string | null;
    confidence: string;
    sources: unknown[];
  }>(`/contracts/${id}/ask`, { method: "POST", body: JSON.stringify({ question }) }),
  upload: (file: File, onProgress?: (progress: number) => void) =>
    new Promise<{ id: number; title: string; status: string; message: string }>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/upload/`);
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
        else reject(new Error("Failed to upload contract. Please try again."));
      };
      xhr.onerror = () => reject(new Error("Failed to upload contract. Please try again."));
      xhr.send(form);
    }),
};
