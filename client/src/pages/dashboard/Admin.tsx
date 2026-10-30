import { useEffect, useState } from "react";
import { BarChart3, Briefcase, CheckCircle2, Download, FileBarChart, FileText, Globe, Inbox, LayoutDashboard, Mail, Plus, Search, Settings, ShieldCheck, Trash2, UserCheck, Users, XCircle, GraduationCap, Clock } from "lucide-react";
import { api, download, fmtDate, fmtDateTime, type User } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useReloadContent } from "../../lib/content";
import { Alert, Avatar, Bars, Columns, Empty, Modal, Spinner, StatCard, StatusBadge } from "../../components/ui";
import { AccountSettings, DashboardShell, PageHead } from "./Shell";
import { VacancyManager } from "./Recruiter";

function Overview({ a, go }: { a: any; go: (t: string) => void }) {
  if (!a) return <Spinner />;
  return (
    <>
      <PageHead title="Platform overview" sub="Real-time analytics across MBONO Recruitment Services." action={<button className="btn-secondary" onClick={() => go("reports")}><FileBarChart size={16} />Reports</button>} />
      {a.pendingRecruiters > 0 && <div className="mb-5"><Alert><span>{a.pendingRecruiters} recruiter account(s) awaiting approval. <button className="font-semibold underline" onClick={() => go("recruiters")}>Review now</button></span></Alert></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total users" value={a.totalUsers} icon={Users} />
        <StatCard label="Total recruiters" value={a.totalRecruiters} icon={UserCheck} tone="blue" hint={`${a.pendingRecruiters} pending approval`} />
        <StatCard label="Total candidates" value={a.totalCandidates} icon={GraduationCap} tone="violet" />
        <StatCard label="Active vacancies" value={a.activeVacancies} icon={Briefcase} tone="amber" />
        <StatCard label="Applications submitted" value={a.applications} icon={FileText} tone="rose" />
        <StatCard label="Contact messages" value={a.contactMessages} icon={Inbox} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-6"><h2 className="mb-5 font-semibold">Applications per month</h2><Columns data={a.applicationsByMonth} /></div>
        <div className="card p-6"><h2 className="mb-5 font-semibold">Applications by status</h2><Bars data={a.applicationsByStatus} color="bg-sky-600" /></div>
        <div className="card p-6 xl:col-span-2"><h2 className="mb-5 font-semibold">Vacancies by industry</h2><Bars data={a.jobsByIndustry} /></div>
      </div>
    </>
  );
}

function UsersTable({ role, title, sub }: { role?: string; title: string; sub: string }) {
  const { user: me } = useAuth();
  const [list, setList] = useState<User[] | null>(null);
  const [q, setQ] = useState(""); const [r, setR] = useState(role ?? ""); const [st, setSt] = useState("");
  const [add, setAdd] = useState<any>(null); const [err, setErr] = useState("");
  const load = () => api<User[]>(`/admin/users?role=${r}&status=${st}&q=${encodeURIComponent(q)}`).then(setList);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q, r, st]); // eslint-disable-line
  const patch = async (u: User, body: any) => { try { await api(`/admin/users/${u.id}`, { method: "PATCH", json: body }); load(); } catch (e) { alert((e as Error).message); } };
  const del = async (u: User) => { if (confirm(`Delete ${u.name}? This cannot be undone.`)) { try { await api(`/admin/users/${u.id}`, { method: "DELETE" }); load(); } catch (e) { alert((e as Error).message); } } };
  const create = async (e: React.FormEvent) => { e.preventDefault(); setErr(""); try { await api("/admin/users", { method: "POST", json: add }); setAdd(null); load(); } catch (e) { setErr((e as Error).message); } };
  return (
    <>
      <PageHead title={title} sub={sub} action={<button className="btn-primary" onClick={() => setAdd({ name: "", email: "", password: "", role: role ?? "candidate", companyName: "" })}><Plus size={16} />Add user</button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="Search name, email, company" value={q} onChange={e => setQ(e.target.value)} /></div>
        {!role && <select className="input" value={r} onChange={e => setR(e.target.value)} aria-label="Role"><option value="">All roles</option><option value="admin">Admin</option><option value="recruiter">Recruiter</option><option value="candidate">Candidate</option></select>}
        <select className="input" value={st} onChange={e => setSt(e.target.value)} aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select>
      </div>
      {!list ? <Spinner /> : list.length ? (
        <div className="card overflow-x-auto"><table className="table-x min-w-[760px]">
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
          <tbody>{list.map(u => (
            <tr key={u.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/40">
              <td><div className="flex items-center gap-3"><Avatar name={u.name} size={34} /><div><p className="font-medium text-ink-900 dark:text-white">{u.name}</p><p className="text-xs muted">{u.email}{u.company_name ? ` · ${u.company_name}` : ""}</p></div></div></td>
              <td><select className="input w-auto py-1 text-xs" value={u.role} disabled={u.id === me?.id} onChange={e => patch(u, { role: e.target.value })} aria-label="Role"><option value="admin">Admin</option><option value="recruiter">Recruiter</option><option value="candidate">Candidate</option></select></td>
              <td><StatusBadge status={u.status} /></td><td className="whitespace-nowrap">{fmtDate(u.created_at ?? "")}</td>
              <td className="whitespace-nowrap text-right">
                {u.role === "candidate" && u.cv_name && <button className="btn-ghost btn-sm" onClick={() => download(`/files/cv/${u.id}`, u.cv_name!)}><Download size={14} />CV</button>}
                {u.id !== me?.id && (u.status === "active" ? <button className="btn-ghost btn-sm text-amber-700" onClick={() => patch(u, { status: "suspended" })}>Suspend</button> : <button className="btn-ghost btn-sm text-brand-700" onClick={() => patch(u, { status: "active" })}>Activate</button>)}
                {u.id !== me?.id && <button className="btn-ghost p-2 text-rose-600" onClick={() => del(u)} aria-label="Delete user"><Trash2 size={15} /></button>}
              </td>
            </tr>
          ))}</tbody></table></div>
      ) : <Empty icon={Users} title="No users found" />}
      <Modal open={!!add} onClose={() => setAdd(null)} title="Add user">
        {add && <form onSubmit={create} className="space-y-3">
          {err && <Alert>{err}</Alert>}
          {(["name", "email", "password"] as const).map(k => <div key={k}><label className="label capitalize" htmlFor={`a-${k}`}>{k}</label><input id={`a-${k}`} required type={k === "password" ? "password" : k === "email" ? "email" : "text"} className="input" value={add[k]} onChange={e => setAdd({ ...add, [k]: e.target.value })} /></div>)}
          <div><label className="label" htmlFor="a-role">Role</label><select id="a-role" className="input" value={add.role} onChange={e => setAdd({ ...add, role: e.target.value })}><option value="candidate">Candidate</option><option value="recruiter">Recruiter</option><option value="admin">Admin</option></select></div>
          {add.role === "recruiter" && <div><label className="label" htmlFor="a-co">Company</label><input id="a-co" className="input" value={add.companyName} onChange={e => setAdd({ ...add, companyName: e.target.value })} /></div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={() => setAdd(null)}>Cancel</button><button className="btn-primary">Create user</button></div>
        </form>}
      </Modal>
    </>
  );
}

function Recruiters({ onChange }: { onChange: () => void }) {
  const [pending, setPending] = useState<User[] | null>(null);
  const load = () => api<User[]>("/admin/users?role=recruiter&status=pending").then(setPending);
  useEffect(() => { load(); }, []);
  const decide = async (u: User, d: "approve" | "reject") => { await api(`/admin/recruiters/${u.id}/${d}`, { method: "POST" }); load(); onChange(); };
  return (
    <>
      <PageHead title="Recruiter approvals" sub="Approve or reject recruiter registrations. Recruiters are notified by email." />
      {!pending ? <Spinner /> : pending.length ? <div className="mb-10 grid gap-4 md:grid-cols-2">{pending.map(u => (
        <div key={u.id} className="card p-5">
          <div className="flex items-start gap-3"><Avatar name={u.name} /><div className="min-w-0 flex-1"><p className="font-semibold text-ink-900 dark:text-white">{u.name}</p><p className="text-sm muted">{u.company_name} {u.company_industry ? `· ${u.company_industry}` : ""}</p><p className="text-xs muted">{u.email} · registered {fmtDate(u.created_at ?? "")}</p></div><StatusBadge status="pending" /></div>
          <div className="mt-4 flex gap-2"><button className="btn-primary btn-sm flex-1" onClick={() => decide(u, "approve")}><CheckCircle2 size={15} />Approve</button><button className="btn-danger btn-sm flex-1" onClick={() => decide(u, "reject")}><XCircle size={15} />Reject</button></div>
        </div>
      ))}</div> : <div className="mb-10"><Empty icon={UserCheck} title="No pending approvals" text="All recruiter registrations have been reviewed." /></div>}
      <UsersTable role="recruiter" title="All recruiters" sub="Manage recruiter accounts." />
    </>
  );
}

function Reports({ a }: { a: any }) {
  const reports = [
    { id: "users", title: "Users report", text: "All users with role, status, company and join date." },
    { id: "vacancies", title: "Vacancies report", text: "Every vacancy with salary, closing date, status and applicant count." },
    { id: "applications", title: "Applications report", text: "All applications with candidate, vacancy, company and status." },
  ];
  return (
    <>
      <PageHead title="Reports & analytics" sub="Download CSV reports (open in Excel or Google Sheets)." action={<button className="btn-secondary" onClick={() => window.print()}>Print summary</button>} />
      <div className="grid gap-4 md:grid-cols-3">{reports.map(r => (
        <div key={r.id} className="card flex flex-col p-6"><FileBarChart className="text-brand-700 dark:text-brand-400" /><h3 className="mt-3 font-semibold">{r.title}</h3><p className="mt-1 flex-1 text-sm muted">{r.text}</p>
          <button className="btn-primary mt-4" onClick={() => download(`/admin/reports/${r.id}`, `${r.id}.csv`)}><Download size={16} />Download CSV</button></div>
      ))}</div>
      {a && <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-6"><h2 className="mb-4 font-semibold">Hiring funnel</h2><Bars data={a.applicationsByStatus} color="bg-violet-600" /></div>
        <div className="card p-6"><h2 className="mb-4 font-semibold">Summary</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">{[["Users", a.totalUsers], ["Candidates", a.totalCandidates], ["Recruiters", a.totalRecruiters], ["Active vacancies", a.activeVacancies], ["Applications", a.applications], ["Avg. applications / vacancy", a.activeVacancies ? (a.applications / a.activeVacancies).toFixed(1) : 0]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800"><dt className="muted">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}</dl>
        </div>
      </div>}
    </>
  );
}

function Content() {
  const reload = useReloadContent();
  const [c, setC] = useState<Record<string, string> | null>(null);
  const [ok, setOk] = useState("");
  useEffect(() => { api("/content").then(setC); }, []);
  if (!c) return <Spinner />;
  const save = async (e: React.FormEvent) => { e.preventDefault(); setC(await api("/admin/content", { method: "PUT", json: c })); reload(); setOk("Website content updated. Changes are live."); };
  const fields: [string, string, boolean?][] = [["hero_title", "Homepage headline"], ["hero_subtitle", "Homepage subtitle", true], ["announcement", "Announcement banner (leave empty to hide)"], ["contact_email", "Contact email"], ["contact_phone", "Contact phone"], ["contact_address", "Office address (also used for Google Maps)"], ["office_hours", "Office hours"]];
  return (
    <>
      <PageHead title="Website content" sub="Edit the text shown on the public website." />
      <form onSubmit={save} className="card max-w-3xl space-y-4 p-6">
        {ok && <Alert kind="success" onClose={() => setOk("")}>{ok}</Alert>}
        {fields.map(([k, l, area]) => <div key={k}><label className="label" htmlFor={`ct-${k}`}>{l}</label>{area ? <textarea id={`ct-${k}`} className="input min-h-24" value={c[k] ?? ""} onChange={e => setC({ ...c, [k]: e.target.value })} /> : <input id={`ct-${k}`} className="input" value={c[k] ?? ""} onChange={e => setC({ ...c, [k]: e.target.value })} />}</div>)}
        <button className="btn-primary">Publish changes</button>
      </form>
    </>
  );
}

function SystemSettings() {
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [ok, setOk] = useState("");
  useEffect(() => { api("/admin/settings").then(setS); }, []);
  if (!s) return <Spinner />;
  const toggle = (k: string, label: string, text: string) => (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-ink-200 p-4 dark:border-ink-800">
      <span><span className="block font-medium text-ink-900 dark:text-white">{label}</span><span className="text-sm muted">{text}</span></span>
      <input type="checkbox" className="mt-1 h-5 w-5 accent-brand-700" checked={s[k] === "true"} onChange={e => setS({ ...s, [k]: String(e.target.checked) })} />
    </label>
  );
  const save = async () => { setS(await api("/admin/settings", { method: "PUT", json: s })); setOk("System settings saved."); };
  return (
    <div className="space-y-8">
      <div>
        <PageHead title="System settings" />
        <div className="card max-w-3xl space-y-3 p-6">
          {ok && <Alert kind="success" onClose={() => setOk("")}>{ok}</Alert>}
          {toggle("allow_registrations", "Allow new registrations", "Let new candidates and recruiters sign up.")}
          {toggle("require_recruiter_approval", "Require recruiter approval", "New recruiter accounts must be approved by an admin.")}
          {toggle("maintenance_mode", "Maintenance mode", "Flag the platform as under maintenance.")}
          <div><label className="label" htmlFor="maxmb">Max upload size (MB)</label><input id="maxmb" type="number" min={1} max={20} className="input max-w-[8rem]" value={s.max_upload_mb ?? "5"} onChange={e => setS({ ...s, max_upload_mb: e.target.value })} /></div>
          <button className="btn-primary" onClick={save}>Save settings</button>
        </div>
      </div>
      <AccountSettings />
    </div>
  );
}

function Messages() {
  const [m, setM] = useState<any[] | null>(null); const [e, setE] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/admin/messages").then(setM); api<any[]>("/admin/emails").then(setE); }, []);
  return (
    <>
      <PageHead title="Messages & email log" sub="Contact form submissions and every email notification sent by the platform." />
      <h2 className="mb-3 font-semibold">Contact messages</h2>
      {!m ? <Spinner /> : m.length ? <div className="mb-8 space-y-3">{m.map(x => <div key={x.id} className="card p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-ink-900 dark:text-white">{x.name} <span className="font-normal muted">&lt;{x.email}&gt;</span></p><span className="text-xs muted">{fmtDateTime(x.created_at)}</span></div>{x.subject && <p className="text-sm font-medium text-brand-700 dark:text-brand-400">{x.subject}</p>}<p className="mt-2 whitespace-pre-line text-sm">{x.message}</p><a href={`mailto:${x.email}`} className="btn-secondary btn-sm mt-3"><Mail size={14} />Reply</a></div>)}</div> : <div className="mb-8"><Empty icon={Inbox} title="No messages yet" /></div>}
      <h2 className="mb-3 font-semibold">Email notifications sent</h2>
      {e && <div className="card overflow-x-auto"><table className="table-x min-w-[640px]"><thead><tr><th>To</th><th>Subject</th><th>Sent</th></tr></thead><tbody>{e.map(x => <tr key={x.id} title={x.body}><td>{x.to_email}</td><td>{x.subject}</td><td className="whitespace-nowrap">{fmtDateTime(x.created_at)}</td></tr>)}</tbody></table></div>}
    </>
  );
}

export default function AdminDashboard() {
  const [a, setA] = useState<any>(null);
  const load = () => api("/admin/analytics").then(setA).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <DashboardShell title="Administrator" tabs={[
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "users", label: "All Users", icon: Users },
      { id: "recruiters", label: "Recruiters", icon: UserCheck, badge: a?.pendingRecruiters },
      { id: "candidates", label: "Candidates", icon: GraduationCap },
      { id: "vacancies", label: "Vacancies", icon: Briefcase },
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "content", label: "Website Content", icon: Globe },
      { id: "messages", label: "Messages", icon: Inbox },
      { id: "settings", label: "System Settings", icon: Settings },
    ]} render={(tab, go) => ({
      overview: <Overview a={a} go={go} />, users: <UsersTable title="Manage users" sub="Change roles, suspend, activate or delete any account." />,
      recruiters: <Recruiters onChange={load} />, candidates: <UsersTable role="candidate" title="Manage candidates" sub="All registered candidates." />,
      vacancies: <VacancyManager isAdmin />, reports: <Reports a={a} />, content: <Content />, messages: <Messages />, settings: <SystemSettings />,
    } as Record<string, React.ReactNode>)[tab]} />
  );
}
// Unused icon imports kept tree-shaken by Vite.
void ShieldCheck; void Clock;
