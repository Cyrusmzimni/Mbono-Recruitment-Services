import { useEffect, useState } from "react";
import { Building2, CalendarCheck, CalendarPlus, Download, Edit3, FileText, LayoutDashboard, Plus, Search, Settings, Star, Trash2, Users, Briefcase, UserSearch, Mail, Phone, MapPin } from "lucide-react";
import { api, download, fmtDate, fmtDateTime, rand, type Job } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Alert, Avatar, Empty, Modal, Spinner, StatCard, StatusBadge } from "../../components/ui";
import { AccountSettings, DashboardShell, PageHead } from "./Shell";

export const STATUSES = ["Submitted", "Under Review", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"];
const TYPES = ["Full-time", "Part-time", "Contract", "Permanent", "Temporary", "Internship", "Learnership", "Graduate Programme"];
const INDUSTRIES = ["Customer Service", "Information Technology", "Finance", "Human Resources", "Healthcare", "Engineering", "Logistics", "Marketing", "Sales", "Education", "Retail", "Mining", "Hospitality", "Legal"];
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape", "South Africa"];

function JobForm({ job, onClose, onSaved, isAdmin }: { job: Partial<Job> | null; onClose: () => void; onSaved: () => void; isAdmin?: boolean }) {
  const [f, setF] = useState<any>({});
  const [err, setErr] = useState("");
  useEffect(() => { setErr(""); setF(job ?? {}); }, [job]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try {
      if (f.id) await api(`/recruiter/jobs/${f.id}`, { method: "PUT", json: f }); else await api("/recruiter/jobs", { method: "POST", json: f });
      onSaved(); onClose();
    } catch (e) { setErr((e as Error).message); }
  };
  const sel = (k: string, opts: string[], label: string) => (
    <div><label className="label" htmlFor={`j-${k}`}>{label}</label><select id={`j-${k}`} required className="input" value={f[k] ?? ""} onChange={set(k)}><option value="">Select…</option>{opts.map(o => <option key={o}>{o}</option>)}{f[k] && !opts.includes(f[k]) && <option>{f[k]}</option>}</select></div>
  );
  return (
    <Modal open={!!job} onClose={onClose} title={f.id ? "Edit vacancy" : "Create vacancy"} wide>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {err && <div className="sm:col-span-2"><Alert>{err}</Alert></div>}
        <div className="sm:col-span-2"><label className="label" htmlFor="j-title">Job title</label><input id="j-title" required className="input" value={f.title ?? ""} onChange={set("title")} /></div>
        <div><label className="label" htmlFor="j-company">Company</label><input id="j-company" className="input" placeholder="Defaults to your company" value={f.company ?? ""} onChange={set("company")} /></div>
        <div><label className="label" htmlFor="j-location">City / town</label><input id="j-location" required className="input" value={f.location ?? ""} onChange={set("location")} /></div>
        {sel("province", PROVINCES, "Province")}{sel("employment_type", TYPES, "Employment type")}{sel("industry", INDUSTRIES, "Industry")}
        <div><label className="label" htmlFor="j-close">Closing date</label><input id="j-close" type="date" required className="input" value={f.closing_date ?? ""} onChange={set("closing_date")} /></div>
        <div><label className="label" htmlFor="j-min">Salary min (R / month)</label><input id="j-min" type="number" min={0} className="input" value={f.salary_min ?? ""} onChange={set("salary_min")} /></div>
        <div><label className="label" htmlFor="j-max">Salary max (R / month)</label><input id="j-max" type="number" min={0} className="input" value={f.salary_max ?? ""} onChange={set("salary_max")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="j-desc">Description</label><textarea id="j-desc" required className="input min-h-28" value={f.description ?? ""} onChange={set("description")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="j-req">Requirements (one per line)</label><textarea id="j-req" className="input min-h-24" value={f.requirements ?? ""} onChange={set("requirements")} /></div>
        {f.id && <div><label className="label" htmlFor="j-status">Status</label><select id="j-status" className="input" value={f.status ?? "open"} onChange={set("status")}><option value="open">Open</option><option value="closed">Closed</option></select></div>}
        {isAdmin && <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={!!f.featured} onChange={set("featured")} className="h-4 w-4 accent-brand-700" />Featured on home page</label>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary">{f.id ? "Save changes" : "Publish vacancy"}</button></div>
      </form>
    </Modal>
  );
}

/** Vacancy management table (used by recruiters and admins). */
export function VacancyManager({ isAdmin }: { isAdmin?: boolean }) {
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [edit, setEdit] = useState<Partial<Job> | null>(null);
  const [q, setQ] = useState("");
  const load = () => api<any[]>(isAdmin ? "/admin/jobs" : "/recruiter/jobs").then(setJobs);
  useEffect(() => { load(); }, []); // eslint-disable-line
  const del = async (j: Job) => { if (confirm(`Delete "${j.title}"? Applications for it will also be removed.`)) { await api(`/recruiter/jobs/${j.id}`, { method: "DELETE" }); load(); } };
  const shown = (jobs ?? []).filter(j => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title={isAdmin ? "Manage vacancies" : "My vacancies"} sub="Create, edit, close and delete job vacancies." action={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} />New vacancy</button>} />
      <div className="relative mb-4 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="Search vacancies…" value={q} onChange={e => setQ(e.target.value)} /></div>
      {!jobs ? <Spinner /> : shown.length ? (
        <div className="card overflow-x-auto">
          <table className="table-x min-w-[760px]">
            <thead><tr><th>Vacancy</th><th>Type</th><th>Salary</th><th>Closes</th><th>Applicants</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{shown.map(j => (
              <tr key={j.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/40">
                <td><p className="font-medium text-ink-900 dark:text-white">{j.title}{j.featured && <Star size={13} className="ml-1 inline text-amber-500" fill="currentColor" />}</p><p className="text-xs muted">{j.company} · {j.location}{isAdmin && j.recruiter_name ? ` · by ${j.recruiter_name}` : ""}</p></td>
                <td>{j.employment_type}</td><td className="whitespace-nowrap">{rand(j.salary_min)}–{rand(j.salary_max)}</td><td className="whitespace-nowrap">{fmtDate(j.closing_date)}</td>
                <td><span className="badge bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">{j.applicants}</span></td><td><StatusBadge status={j.status} /></td>
                <td className="whitespace-nowrap text-right"><button className="btn-ghost p-2" onClick={() => setEdit(j)} aria-label="Edit"><Edit3 size={16} /></button><button className="btn-ghost p-2 text-rose-600" onClick={() => del(j)} aria-label="Delete"><Trash2 size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <Empty icon={Briefcase} title="No vacancies yet" text="Publish your first vacancy to start receiving applications." action={<button className="btn-primary" onClick={() => setEdit({})}><Plus size={16} />New vacancy</button>} />}
      <JobForm job={edit} onClose={() => setEdit(null)} onSaved={load} isAdmin={isAdmin} />
    </>
  );
}

function Overview({ go }: { go: (t: string) => void }) {
  const { user } = useAuth();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/recruiter/dashboard").then(setD); }, []);
  if (!d) return <Spinner />;
  return (
    <>
      <PageHead title={`Hello, ${user?.name.split(" ")[0]}`} sub={user?.company_name ?? "Recruiter dashboard"} action={<button className="btn-primary" onClick={() => go("vacancies")}><Plus size={16} />Post a job</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={d.activeJobs} icon={Briefcase} hint={`${d.totalJobs} total`} />
        <StatCard label="Applications received" value={d.applications} icon={FileText} tone="blue" />
        <StatCard label="Shortlisted candidates" value={d.shortlisted} icon={Star} tone="violet" />
        <StatCard label="Upcoming interviews" value={d.upcomingInterviews.length} icon={CalendarCheck} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent applications</h2><button className="text-sm font-semibold text-brand-700 dark:text-brand-400" onClick={() => go("applications")}>Review all</button></div>
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">{d.recent.map((a: any) => (
            <li key={a.id} className="flex items-center gap-3 py-3"><Avatar name={a.candidate_name} size={36} /><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink-900 dark:text-white">{a.candidate_name}</p><p className="truncate text-xs muted">{a.title} · {fmtDate(a.created_at)}</p></div><StatusBadge status={a.status} /></li>
          ))}{!d.recent.length && <li className="py-3 text-sm muted">No applications yet.</li>}</ul>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Upcoming interviews</h2>
          {d.upcomingInterviews.length ? d.upcomingInterviews.slice(0, 5).map((i: any) => (
            <div key={i.id} className="mb-3 flex gap-3 last:mb-0"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><CalendarCheck size={18} /></span><div className="min-w-0"><p className="truncate font-medium text-ink-900 dark:text-white">{i.candidate_name}</p><p className="truncate text-xs muted">{i.title}</p><p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{fmtDateTime(i.scheduled_at)}</p></div></div>
          )) : <p className="text-sm muted">No upcoming interviews.</p>}
        </div>
      </div>
    </>
  );
}

function Applications() {
  const [apps, setApps] = useState<any[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState(""); const [status, setStatus] = useState("");
  const [sched, setSched] = useState<any>(null);
  const [view, setView] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const load = () => api<any[]>(`/recruiter/applications?jobId=${jobId}&status=${encodeURIComponent(status)}`).then(setApps);
  useEffect(() => { api<Job[]>("/recruiter/jobs").then(setJobs); }, []);
  useEffect(() => { load(); }, [jobId, status]); // eslint-disable-line
  const setSt = async (a: any, s: string) => { await api(`/recruiter/applications/${a.id}/status`, { method: "PATCH", json: { status: s } }); setMsg(`${a.candidate_name} moved to "${s}". The candidate has been notified by email.`); load(); };
  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api(`/recruiter/applications/${sched.app.id}/interview`, { method: "POST", json: sched }); setMsg(`Interview scheduled with ${sched.app.candidate_name}. Invitation emailed.`); setSched(null); load(); }
    catch (err) { alert((err as Error).message); }
  };
  return (
    <>
      <PageHead title="Applications" sub="Review, shortlist and update application status." />
      {msg && <div className="mb-4"><Alert kind="success" onClose={() => setMsg("")}>{msg}</Alert></div>}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <select className="input" value={jobId} onChange={e => setJobId(e.target.value)} aria-label="Filter by vacancy"><option value="">All vacancies</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      {!apps ? <Spinner /> : apps.length ? (
        <div className="space-y-3">{apps.map(a => (
          <div key={a.id} className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar name={a.candidate_name} />
              <div className="min-w-0"><button onClick={() => setView(a)} className="font-semibold text-ink-900 hover:text-brand-700 dark:text-white">{a.candidate_name}</button><p className="text-sm muted">{a.headline || "Candidate"} · {a.candidate_location}</p><p className="text-xs muted">Applied for <span className="font-medium">{a.title}</span> on {fmtDate(a.created_at)}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="input w-auto py-1.5 text-xs" value={a.status} onChange={e => setSt(a, e.target.value)} aria-label="Update status">{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
              {a.status !== "Shortlisted" && <button className="btn-secondary btn-sm" onClick={() => setSt(a, "Shortlisted")}><Star size={14} />Shortlist</button>}
              <button className="btn-secondary btn-sm" onClick={() => setSched({ app: a, scheduledAt: "", mode: "Video call", location: "", notes: "" })}><CalendarPlus size={14} />Interview</button>
              {a.cv_name && <button className="btn-ghost btn-sm" onClick={() => download(`/files/cv/${a.candidate_user_id}`, a.cv_name)}><Download size={14} />CV</button>}
            </div>
          </div>
        ))}</div>
      ) : <Empty icon={FileText} title="No applications found" text="Applications for your vacancies will appear here." />}
      <Modal open={!!view} onClose={() => setView(null)} title="Candidate application">
        {view && <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3"><Avatar name={view.candidate_name} size={48} /><div><p className="font-semibold text-ink-900 dark:text-white">{view.candidate_name}</p><p className="muted">{view.headline}</p></div></div>
          <p className="flex items-center gap-2"><Mail size={15} />{view.candidate_email}</p>{view.candidate_phone && <p className="flex items-center gap-2"><Phone size={15} />{view.candidate_phone}</p>}<p className="flex items-center gap-2"><MapPin size={15} />{view.candidate_location}</p>
          {view.skills && <div className="flex flex-wrap gap-1.5">{view.skills.split(",").map((s: string) => <span key={s} className="badge bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">{s.trim()}</span>)}</div>}
          <div><p className="font-semibold">Cover letter</p><p className="mt-1 whitespace-pre-line muted">{view.cover_letter || "—"}</p></div>
          <div className="flex items-center justify-between"><StatusBadge status={view.status} />{view.cv_name && <button className="btn-secondary btn-sm" onClick={() => download(`/files/cv/${view.candidate_user_id}`, view.cv_name)}><Download size={14} />Download CV</button>}</div>
        </div>}
      </Modal>
      <Modal open={!!sched} onClose={() => setSched(null)} title={`Schedule interview${sched ? ` – ${sched.app.candidate_name}` : ""}`}>
        {sched && <form onSubmit={schedule} className="space-y-4">
          <div><label className="label" htmlFor="i-when">Date & time</label><input id="i-when" type="datetime-local" required className="input" value={sched.scheduledAt} onChange={e => setSched({ ...sched, scheduledAt: e.target.value })} /></div>
          <div><label className="label" htmlFor="i-mode">Interview type</label><select id="i-mode" className="input" value={sched.mode} onChange={e => setSched({ ...sched, mode: e.target.value })}><option>Video call</option><option>In person</option><option>Phone call</option></select></div>
          <div><label className="label" htmlFor="i-loc">Location or meeting link</label><input id="i-loc" className="input" value={sched.location} onChange={e => setSched({ ...sched, location: e.target.value })} /></div>
          <div><label className="label" htmlFor="i-notes">Notes for candidate</label><textarea id="i-notes" className="input" value={sched.notes} onChange={e => setSched({ ...sched, notes: e.target.value })} /></div>
          <p className="text-xs muted">The candidate receives an email invitation and in-app notification.</p>
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setSched(null)}>Cancel</button><button className="btn-primary">Send invitation</button></div>
        </form>}
      </Modal>
    </>
  );
}

function Interviews() {
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/recruiter/interviews").then(setList); }, []);
  if (!list) return <Spinner />;
  const now = new Date().toISOString().slice(0, 16);
  return (
    <>
      <PageHead title="Interviews" sub="All scheduled interviews for your vacancies." />
      {list.length ? <div className="card overflow-x-auto"><table className="table-x min-w-[640px]"><thead><tr><th>Candidate</th><th>Vacancy</th><th>When</th><th>Type</th><th>Location / link</th></tr></thead>
        <tbody>{list.map(i => <tr key={i.id} className={i.scheduled_at < now ? "opacity-60" : ""}><td className="font-medium text-ink-900 dark:text-white">{i.candidate_name}<p className="text-xs font-normal muted">{i.candidate_email}</p></td><td>{i.title}</td><td className="whitespace-nowrap">{fmtDateTime(i.scheduled_at)}</td><td>{i.mode}</td><td className="max-w-[14rem] break-words">{i.location}</td></tr>)}</tbody></table></div>
        : <Empty icon={CalendarCheck} title="No interviews scheduled" text="Schedule interviews from the Applications tab." />}
    </>
  );
}

function CandidateSearch() {
  const [q, setQ] = useState(""); const [loc, setLoc] = useState("");
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { const t = setTimeout(() => api<any[]>(`/recruiter/candidates?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`).then(setList), 250); return () => clearTimeout(t); }, [q, loc]);
  return (
    <>
      <PageHead title="Candidate database" sub="Search registered candidates by name, skill, headline or location." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="Skills, title or name (e.g. SQL)" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="Location" value={loc} onChange={e => setLoc(e.target.value)} /></div>
      </div>
      {!list ? <Spinner /> : list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map(c => (
        <div key={c.id} className="card p-5">
          <div className="flex items-start gap-3"><Avatar name={c.name} /><div className="min-w-0 flex-1"><p className="font-semibold text-ink-900 dark:text-white">{c.name}</p><p className="text-sm muted">{c.headline || "Candidate"}</p><p className="flex items-center gap-1 text-xs muted"><MapPin size={12} />{c.location || "—"}</p></div>
            {c.has_cv && <button className="btn-secondary btn-sm" onClick={() => download(`/files/cv/${c.id}`, c.cv_name)}><Download size={14} />CV</button>}</div>
          {c.skills && <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.split(",").map((s: string) => <span key={s} className="badge bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">{s.trim()}</span>)}</div>}
          {c.experience && <p className="mt-3 text-sm muted">{c.experience}</p>}
          <a href={`mailto:${c.email}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400"><Mail size={14} />Contact candidate</a>
        </div>
      ))}</div> : <Empty icon={UserSearch} title="No candidates found" />}
    </>
  );
}

function Company() {
  const { refresh } = useAuth();
  const [f, setF] = useState<any>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  useEffect(() => { api("/recruiter/company").then(setF); }, []);
  if (!f) return <Spinner />;
  const save = async (e: React.FormEvent) => { e.preventDefault(); try { setF(await api("/recruiter/company", { method: "PUT", json: f })); refresh(); setMsg({ kind: "success", text: "Company profile saved." }); } catch (err) { setMsg({ kind: "error", text: (err as Error).message }); } };
  const inp = (k: string, l: string) => <div><label className="label" htmlFor={`co-${k}`}>{l}</label><input id={`co-${k}`} className="input" value={f[k] ?? ""} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <>
      <PageHead title="Company profile" sub="This information appears on your vacancies." />
      <form onSubmit={save} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2">
        {msg && <div className="sm:col-span-2"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
        {inp("company_name", "Company name")}{inp("company_industry", "Industry")}{inp("company_website", "Website")}{inp("location", "Head office location")}{inp("name", "Contact person")}{inp("phone", "Phone")}
        <div className="sm:col-span-2"><label className="label" htmlFor="co-desc">About the company</label><textarea id="co-desc" className="input min-h-32" value={f.company_description ?? ""} onChange={e => setF({ ...f, company_description: e.target.value })} /></div>
        <div><button className="btn-primary">Save company profile</button></div>
      </form>
    </>
  );
}

export default function RecruiterDashboard() {
  return (
    <DashboardShell title="Recruiter" tabs={[
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "vacancies", label: "Vacancies", icon: Briefcase },
      { id: "applications", label: "Applications", icon: FileText },
      { id: "interviews", label: "Interviews", icon: CalendarCheck },
      { id: "candidates", label: "Candidate Search", icon: Users },
      { id: "company", label: "Company Profile", icon: Building2 },
      { id: "settings", label: "Settings", icon: Settings },
    ]} render={(tab, go) => ({
      overview: <Overview go={go} />, vacancies: <VacancyManager />, applications: <Applications />, interviews: <Interviews />, candidates: <CandidateSearch />, company: <Company />, settings: <AccountSettings />,
    } as Record<string, React.ReactNode>)[tab]} />
  );
}
