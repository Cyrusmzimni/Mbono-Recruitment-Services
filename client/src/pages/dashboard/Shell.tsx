import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { Alert, Avatar } from "../../components/ui";
import ThemeToggle from "../../components/ThemeToggle";

export interface Tab { id: string; label: string; icon: any; badge?: number }

/** Dashboard layout: sidebar on desktop, scrollable tab bar on mobile. Active tab lives in ?tab= */
export function DashboardShell({ title, tabs, render }: { title: string; tabs: Tab[]; render: (tab: string, go: (t: string) => void) => React.ReactNode }) {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = tabs.some(t => t.id === sp.get("tab")) ? sp.get("tab")! : tabs[0].id;
  const go = (t: string) => { setSp({ tab: t }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-50 dark:bg-ink-950">
      <div className="container-x grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card mb-3 hidden items-center gap-3 p-4 lg:flex">
            <Avatar name={user?.name ?? "U"} />
            <div className="min-w-0"><p className="truncate font-semibold text-ink-900 dark:text-white">{user?.name}</p><p className="text-xs capitalize muted">{title}</p></div>
          </div>
          <nav className="card flex gap-1 overflow-x-auto p-1.5 lg:flex-col" aria-label="Dashboard">
            {tabs.map(t => (
              <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? "bg-brand-700 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"}`}>
                <t.icon size={17} /><span className="whitespace-nowrap">{t.label}</span>
                {!!t.badge && <span className={`ml-auto rounded-full px-1.5 text-[11px] font-bold ${tab === t.id ? "bg-white/20" : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"}`}>{t.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 animate-fade-in" key={tab}>{render(tab, go)}</main>
      </div>
    </div>
  );
}

export const PageHead = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm muted">{sub}</p>}</div>{action}
  </div>
);

/** Account settings shared by every role: theme + change password. */
export function AccountSettings() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return setMsg({ kind: "error", text: "New passwords do not match." });
    try { await api("/auth/change-password", { method: "POST", json: f }); setMsg({ kind: "success", text: "Password updated." }); setF({ currentPassword: "", newPassword: "", confirm: "" }); }
    catch (err) { setMsg({ kind: "error", text: (err as Error).message }); }
  };
  return (
    <div className="space-y-6">
      <PageHead title="Account settings" />
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div><h2 className="font-semibold">Appearance</h2><p className="text-sm muted">Choose Light, Dark, or follow your System setting.</p></div>
        <ThemeToggle showLabels />
      </div>
      <form onSubmit={submit} className="card max-w-xl space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} />Change password</h2>
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        {(["currentPassword", "newPassword", "confirm"] as const).map(k => (
          <div key={k}><label className="label" htmlFor={k}>{k === "currentPassword" ? "Current password" : k === "newPassword" ? "New password" : "Confirm new password"}</label>
            <input id={k} type="password" required className="input" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
        <button className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
