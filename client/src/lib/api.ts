export const TOKEN_KEY = "mbono-token";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** fetch wrapper: adds the JWT, parses JSON, throws ApiError with the server's message. */
export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) { headers.set("Content-Type", "application/json"); body = JSON.stringify(init.json); }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running (npm run dev)?", 0);
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event("mbono:unauthorized"));
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

/** Downloads a protected file (CV, certificate, CSV report) using the JWT. */
export async function download(path: string, fallbackName: string) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
  if (!res.ok) throw new ApiError("Could not download the file.", res.status);
  const cd = res.headers.get("Content-Disposition") ?? "";
  const name = decodeURIComponent(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1] ?? fallbackName);
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const rand = (n: number) => `R${Number(n || 0).toLocaleString("en-ZA")}`;
export const fmtDate = (d: string) => d ? new Date(d.length === 10 ? d + "T00:00" : d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
export const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
export const daysLeft = (d: string) => Math.ceil((new Date(d + "T23:59").getTime() - Date.now()) / 86400000);

export interface Job {
  id: number; title: string; company: string; location: string; province: string; employment_type: string; industry: string;
  salary_min: number; salary_max: number; description: string; requirements?: string; closing_date: string; status: string; featured: boolean;
  recruiter_id?: number; applicants?: number; created_at?: string;
}
export interface User {
  id: number; name: string; email: string; role: "admin" | "recruiter" | "candidate"; status: string; phone?: string; location?: string;
  headline?: string; bio?: string; skills?: string; experience?: string; education?: string; cv_name?: string; cv_path?: string;
  company_name?: string; company_website?: string; company_industry?: string; company_description?: string; created_at?: string;
}
