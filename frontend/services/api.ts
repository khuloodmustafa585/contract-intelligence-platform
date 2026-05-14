const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Contract = {
  id: number;
  title: string;
  owner_id: number;
  status: ContractStatus;
  processing_error?: string | null;
  extracted_text?: string | null;
  cleaned_text?: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  notice_period_days?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  ocr_used: boolean;
  parse_method?: string | null;
  is_indexed: boolean;
  embedding_status: string;
};

export type ContractStatus =
  | "uploaded"
  | "processing"
  | "ocr_processing"
  | "parsed"
  | "indexing"
  | "analysis_pending"
  | "completed"
  | "failed";

export type Clause = {
  id: number;
  contract_id: number;
  category?: string | null;
  heading?: string | null;
  text: string;
  order_index: number;
  page_number?: number | null;
  source_snippet?: string | null;
};

export type Risk = {
  id: number;
  contract_id: number;
  clause_id?: number | null;
  risk_type: string;
  severity: "low" | "medium" | "high";
  title: string;
  explanation?: string | null;
  suggested_action?: string | null;
  source_snippet?: string | null;
  created_at: string;
};

export type Summary = {
  id: number;
  contract_id: number;
  summary_type: string;
  summary_text: string;
  created_at: string;
};

export type Obligation = {
  id: number;
  contract_id: number;
  clause_id?: number | null;
  title: string;
  description?: string | null;
  owner?: string | null;
  due_date?: string | null;
  reminder_date?: string | null;
  status: "pending" | "completed" | "overdue";
  source_snippet?: string | null;
  created_at: string;
};

export type Alert = {
  id: number;
  contract_id: number;
  alert_type: string;
  title: string;
  message?: string | null;
  status: "unread" | "read";
  trigger_date?: string | null;
  created_at: string;
};

export type ContractDetail = Contract & {
  clauses: Clause[];
  risks: Risk[];
  summaries: Summary[];
  obligations: Obligation[];
  alerts: Alert[];
};

export type DashboardMetrics = {
  total_contracts: number;
  high_risk_contracts: number;
  expiring_soon: number;
  overdue_contracts: number;
  upcoming_obligations: number;
  overdue_obligations: number;
  unread_alerts: number;
  recent_uploads: { id: number; title: string; status: string; created_at: string }[];
};

export type AnalyticsCharts = {
  risk_by_severity: { label: string; value: number }[];
  risk_by_type: { label: string; value: number }[];
  contract_by_status: { label: string; value: number }[];
  obligation_by_status: { label: string; value: number }[];
  upload_activity: { day: string; count: number }[];
};

export type AskAISource = {
  clause_id: number;
  score: number;
  snippet: string;
  text?: string | null;
  contract_id: number;
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setAuth(token: string) {
  localStorage.setItem("token", token);
  // lightweight cookie so Next.js middleware can verify auth without JS
  document.cookie = `cl_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}

export function clearAuth() {
  localStorage.removeItem("token");
  document.cookie = "cl_auth=; path=/; max-age=0";
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    clearAuth();
    window.location.href = "/login";
  }

  if (response.status === 204) return undefined as unknown as T;

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(data: { email: string; password: string }) {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);
  const token = await request<{ access_token: string; token_type: string }>(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }
  );
  setAuth(token.access_token);
  return token;
}

export async function registerUser(data: {
  full_name: string;
  email: string;
  password: string;
}) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function logoutUser() {
  clearAuth();
  if (typeof window !== "undefined") window.location.href = "/login";
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  me: () => request<{ id: number; full_name: string; email: string; is_verified: boolean }>("/users/me"),

  dashboard: () => request<DashboardMetrics>("/dashboard/metrics"),
  charts: () => request<AnalyticsCharts>("/dashboard/charts"),

  contracts: () => request<Contract[]>("/contracts/"),
  contract: (id: number | string) => request<ContractDetail>(`/contracts/${id}`),
  contractStatus: (id: number | string) =>
    request<{ id: number; status: string; embedding_status: string; is_indexed: boolean; processing_error: string | null }>(
      `/contracts/${id}/status`
    ),
  deleteContract: (id: number) =>
    request(`/contracts/${id}`, { method: "DELETE" }),
  retryContract: (id: number) =>
    request(`/contracts/${id}/retry`, { method: "POST" }),

  clauses: (contractId: number | string) =>
    request<Clause[]>(`/contracts/${contractId}/clauses`),

  risks: () => request<Risk[]>("/risks"),
  contractRisks: (contractId: number | string) =>
    request<Risk[]>(`/contracts/${contractId}/risks`),

  summaries: () => request<Summary[]>("/summaries"),
  contractSummaries: (contractId: number | string) =>
    request<Summary[]>(`/contracts/${contractId}/summaries`),

  obligations: () => request<Obligation[]>("/obligations"),
  contractObligations: (contractId: number | string) =>
    request<Obligation[]>(`/contracts/${contractId}/obligations`),

  alerts: (params?: { status?: string; alert_type?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return request<Alert[]>(`/alerts/${qs}`);
  },
  markAlertRead: (id: number) =>
    request(`/alerts/${id}/read`, { method: "PATCH" }),

  analyze: (id: number) =>
    request(`/contracts/${id}/analyze`, { method: "POST" }),

  ask: (id: number | string, question: string) =>
    request<{ answer: string; sources: AskAISource[] }>(
      `/contracts/${id}/ask`,
      { method: "POST", body: JSON.stringify({ question }) }
    ),

  upload: (file: File, onProgress?: (progress: number) => void) =>
    new Promise<{ id: number; title: string; status: string; message: string }>(
      (resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/upload/`);
        const token = getToken();
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress)
            onProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          const payload = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
          else reject(new Error(payload.detail || "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(form);
      }
    ),
};
