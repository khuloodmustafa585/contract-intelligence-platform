const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export type Contract = {
  id: number;
  title: string;
  owner_id: number;
  status: string;
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

export type Clause = { id: number; contract_id: number; heading?: string | null; text: string; order_index: number };
export type Risk = { id: number; contract_id: number; clause_id?: number | null; risk_type: string; severity: string; title: string; explanation?: string | null; suggested_action?: string | null; source_snippet?: string | null; created_at: string };
export type Summary = { id: number; contract_id: number; summary_type: string; summary_text: string; created_at: string };
export type Obligation = { id: number; contract_id: number; clause_id?: number | null; title: string; description?: string | null; owner?: string | null; due_date?: string | null; status: string; source_snippet?: string | null; created_at: string };
export type Alert = { id: number; contract_id: number; alert_type: string; title: string; message?: string | null; status: string; trigger_date?: string | null; created_at: string };
export type ContractDetail = Contract & { clauses: Clause[]; risks: Risk[]; summaries: Summary[]; obligations: Obligation[]; alerts: Alert[] };

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function setToken(token: string) {
  localStorage.setItem("token", token);
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
    window.location.href = "/login";
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || "Request failed");
  }
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

export async function registerUser(data: { full_name: string; email: string; password: string }) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export const api = {
  me: () => request("/users/me"),
  dashboard: () => request("/dashboard/metrics"),
  contracts: () => request<Contract[]>("/contracts/"),
  contract: (id: number | string) => request<ContractDetail>(`/contracts/${id}`),
  risks: () => request<Risk[]>("/risks"),
  summaries: () => request<Summary[]>("/summaries"),
  obligations: () => request<Obligation[]>("/obligations"),
  alerts: () => request<Alert[]>("/alerts/"),
  markAlertRead: (id: number) => request(`/alerts/${id}/read`, { method: "PATCH" }),
  analyze: (id: number) => request(`/contracts/${id}/analyze`, { method: "POST" }),
  ask: (id: number | string, question: string) => request<{ answer: string; sources: unknown[] }>(`/contracts/${id}/ask`, { method: "POST", body: JSON.stringify({ question }) }),
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
        else reject(new Error(payload.detail || "Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(form);
    }),
};
