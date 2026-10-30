import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Bookmark, Briefcase, CalendarCheck, CheckCircle2, Download, FileText, Heart, LayoutDashboard, MapPin, Search, Settings, Trash2, Upload, UserCircle } from "lucide-react";
import { api, download, fmtDate, fmtDateTime, type Job } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Alert, Empty, Spinner, StatCard, StatusBadge } from "../../components/ui";
import JobCard, { useApply } from "../../components/JobCard";
import { AccountSettings, DashboardShell, PageHead } from "./Shell";

const PIPELINE = ["Submitted", "Under Review", "Shortlisted", "Interview", "Offered", "Hired"];

function Progress({ status }: { status: string }) {
  const idx = PIPELINE.indexOf(status);
  if (status === "Rejected") return <p className="text-xs text-rose-600 dark:text-rose-400">This application was not successful. Keep going — new jobs are posted every week.</p>;
  return (
    <ol className="mt-3 flex items-center gap-1" aria-label={`Progress: ${status}`}>
      {PIPELINE.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1">
          <span className={`h-1.5 rounded-full ${i <= idx ? "bg-brand-600" : "bg-ink-200 dark:bg-ink-800"}`} />
          <span className={`hidden text-[10px] sm:block ${i <= idx ? "font-semibold text-brand-700 dark:text-brand-400" : "muted"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Overview({ go }: { go: (t: string) => void }) {
  const { user } = useAuth();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/candidate/dashboard").then(setD).catch(() => {}); }, []);
  if (!d) return <Spinner />;
  const upcoming = d.interviews.filter((i: any) => i.scheduled_at >= new Date().toISOString().slice(0, 16));
  return (
    <>
      <PageHead title={`Welcome back, ${user?.name.split(" ")[0]} 👋`} sub="Here's what's happening with your job search." action={<Link to="/vacancies" className="btn-primary"><Search size={16} />Find jobs</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applied jobs" value={d.applied} icon={Briefcase} />
        <StatCard label="Saved jobs" value={d.saved} icon={Heart} tone="rose" />
        <StatCard label="Interview invitations" value={d.interviews.length} icon={CalendarCheck} tone="amber" hint={`${upcoming.length} upcoming`} />
        <StatCard label="Profile completion" value={`${d.completion}%`} icon={UserCircle} tone="violet" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Application status tracking</h2><button className="text-sm font-semibold text-brand-700 dark:text-brand-400" onClick={() => go("applications")}>View all</button></div>
          {d.recent.length ? <ul className="divide-y divide-ink-100 dark:divide-ink-800">{d.recent.map((a: any) => (
            <li key={a.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-ink-900 dark:text-white">{a.title}</p><p className="text-xs muted">{a.company} · Applied {fmtDate(a.created_at)}</p></div><StatusBadge status={a.status} /></div><Progress status={a.status} /></li>
          ))}</ul> : <p className="text-sm muted">No applications yet. <Link to="/vacancies" className="font-semibold text-brand-700">Browse vacancies</Link></p>}
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold">Profile completion</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" className="stroke-ink-200 dark:stroke-ink-800" /><circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-brand-600 transition-all duration-1000" strokeDasharray={`${d.completion} 100`} /></svg>
                <span className="absolute inset-0 grid place-items-center text-lg font-bold">{d.completion}%</span>
              </div>
              <div><p className="text-sm muted">{d.completion < 100 ? "Complete your profile to stand out to recruiters." : "Your profile is complete — great work!"}</p>{d.completion < 100 && <button className="btn-secondary btn-sm mt-2" onClick={() => go("profile")}>Complete profile</button>}</div>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="mb-3 font-semibold">Interview invitations</h2>
            {d.interviews.length ? d.interviews.slice(0, 3).map((i: any) => (
              <div key={i.id} className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 last:mb-0 dark:border-amber-900/50 dark:bg-amber-900/20">
                <p className="font-medium text-ink-900 dark:text-white">{i.title}</p><p className="text-xs muted">{i.company}</p>
                <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-300">{fmtDateTime(i.scheduled_at)}</p><p className="text-xs muted">{i.mode}{i.location ? ` · ${i.location}` : ""}</p>
              </div>
            )) : <p className="text-sm muted">No invitations yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function Profile() {
  const { refresh } = useAuth();
  const [p, setP] = useState<any>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [certTitle, setCertTitle] = useState("");
  const cvRef = useRef<HTMLInputElement>(null); const certRef = useRef<HTMLInputElement>(null);
  const load = () => api("/candidate/profile").then(setP);
  useEffect(() => { load(); }, []);
  if (!p) return <Spinner />;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    try { const u = await api("/candidate/profile", { method: "PUT", json: p }); setP({ ...p, ...u }); refresh(); setMsg({ kind: "success", text: "Profile saved." }); }
    catch (err) { setMsg({ kind: "error", text: (err as Error).message }); }
  };
  const upload = async (path: string, field: string, file?: File, extra?: Record<string, string>) => {
    if (!file) return; setMsg(null);
    const fd = new FormData(); fd.append(field, file); for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v);
    try { await api(path, { method: "POST", body: fd }); await load(); setCertTitle(""); setMsg({ kind: "success", text: "File uploaded successfully." }); }
    catch (err) { setMsg({ kind: "error", text: (err as Error).message }); }
  };
  const field = (k: string, label: string, opts: { area?: boolean; ph?: string } = {}) => (
    <div className={opts.area ? "sm:col-span-2" : ""}><label className="label" htmlFor={`p-${k}`}>{label}</label>
      {opts.area ? <textarea id={`p-${k}`} className="input min-h-24" placeholder={opts.ph} value={p[k] ?? ""} onChange={e => setP({ ...p, [k]: e.target.value })} />
        : <input id={`p-${k}`} className="input" placeholder={opts.ph} value={p[k] ?? ""} onChange={e => setP({ ...p, [k]: e.target.value })} />}</div>
  );
  return (
    <>
      <PageHead title="Profile & CV" sub={`Profile ${p.completion}% complete`} />
      {msg && <div className="mb-4"><Alert kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Alert></div>}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <form onSubmit={save} className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Personal details</h2>
          {field("name", "Full name")}
          <div><label className="label">Email</label><input className="input opacity-70" value={p.email} disabled /></div>
          {field("phone", "Phone", { ph: "+27 …" })}{field("location", "Location", { ph: "City, Province" })}
          {field("headline", "Professional headline", { ph: "e.g. Customer Service Specialist" })}
          {field("skills", "Skills (comma separated)", { ph: "Excel, CRM, isiXhosa" })}
          {field("bio", "About me", { area: true })}{field("experience", "Work experience", { area: true })}{field("education", "Education & qualifications", { area: true })}
          <div className="sm:col-span-2"><button className="btn-primary">Save profile</button></div>
        </form>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold"><FileText size={18} />Curriculum Vitae</h2>
            {p.cv_name ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-900 dark:bg-brand-950/40">
                <CheckCircle2 className="text-brand-700" size={20} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{p.cv_name}</span>
                <button className="btn-ghost p-1.5" onClick={() => download(`/files/cv/${p.id}`, p.cv_name)} aria-label="Download CV"><Download size={16} /></button>
                <button className="btn-ghost p-1.5 text-rose-600" onClick={async () => { await api("/candidate/cv", { method: "DELETE" }); load(); }} aria-label="Remove CV"><Trash2 size={16} /></button>
              </div>
            ) : <p className="mt-2 text-sm muted">No CV uploaded yet. You need a CV to apply.</p>}
            <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={e => { upload("/candidate/cv", "cv", e.target.files?.[0]); e.target.value = ""; }} />
            <button className="btn-secondary mt-4 w-full" onClick={() => cvRef.current?.click()}><Upload size={16} />{p.cv_name ? "Replace CV" : "Upload CV"}</button>
            <p className="mt-2 text-xs muted">PDF, DOC or DOCX · max 5 MB</p>
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold"><Award size={18} />Certifications</h2>
            <ul className="mt-3 space-y-2">
              {p.certifications.map((c: any) => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg border border-ink-200 p-2.5 text-sm dark:border-ink-800">
                  <Award size={16} className="text-brand-700" /><span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <button className="btn-ghost p-1" onClick={() => download(`/files/cert/${c.id}`, c.file_name)} aria-label="Download"><Download size={15} /></button>
                  <button className="btn-ghost p-1 text-rose-600" onClick={async () => { await api(`/candidate/certifications/${c.id}`, { method: "DELETE" }); load(); }} aria-label="Delete"><Trash2 size={15} /></button>
                </li>
              ))}
              {!p.certifications.length && <li className="text-sm muted">No certifications uploaded.</li>}
            </ul>
            <input className="input mt-4" placeholder="Certificate name (e.g. Matric certificate)" value={certTitle} onChange={e => setCertTitle(e.target.value)} />
            <input ref={certRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" hidden onChange={e => { upload("/candidate/certifications", "file", e.target.files?.[0], { title: certTitle }); e.target.value = ""; }} />
            <button className="btn-secondary mt-2 w-full" onClick={() => certRef.current?.click()}><Upload size={16} />Upload certification</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Applications() {
  const [apps, setApps] = useState<any[] | null>(null);
  const load = () => api<any[]>("/candidate/applications").then(setApps);
  useEffect(() => { load(); }, []);
  if (!apps) return <Spinner />;
  return (
    <>
      <PageHead title="My applications" sub="Track the status of every application in real time." />
      {apps.length ? <div className="space-y-4">{apps.map(a => (
        <div key={a.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><Link to={`/vacancies/${a.job_id}`} className="font-semibold text-ink-900 hover:text-brand-700 dark:text-white">{a.title}</Link><p className="flex items-center gap-1 text-sm muted"><MapPin size={13} />{a.company} · {a.location}</p><p className="mt-1 text-xs muted">Applied {fmtDate(a.created_at)} · Updated {fmtDate(a.updated_at)}</p></div>
            <div className="flex items-center gap-2"><StatusBadge status={a.status} />{a.status === "Submitted" && <button className="btn-ghost btn-sm text-rose-600" onClick={async () => { if (confirm("Withdraw this application?")) { await api(`/candidate/applications/${a.id}`, { method: "DELETE" }); load(); } }}>Withdraw</button>}</div>
          </div>
          <Progress status={a.status} />
        </div>
      ))}</div> : <Empty icon={Briefcase} title="No applications yet" text="Find a role you love and apply in one click." action={<Link to="/vacancies" className="btn-primary">Browse vacancies</Link>} />}
    </>
  );
}

function Saved() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const { start, modal } = useApply();
  const load = () => api<Job[]>("/candidate/saved").then(setJobs);
  useEffect(() => { load(); }, []);
  if (!jobs) return <Spinner />;
  return (
    <>
      <PageHead title="Saved jobs" sub="Your favourite vacancies in one place." />
      {jobs.length ? <div className="grid gap-5 md:grid-cols-2">{jobs.map(j => <JobCard key={j.id} job={j} saved onApply={start} onToggleSave={async jb => { await api(`/candidate/saved/${jb.id}`, { method: "POST" }); load(); }} />)}</div>
        : <Empty icon={Bookmark} title="No saved jobs" text="Tap the heart on any job to save it for later." action={<Link to="/vacancies" className="btn-primary">Browse vacancies</Link>} />}
      {modal}
    </>
  );
}

function Interviews() {
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/candidate/interviews").then(setList); }, []);
  if (!list) return <Spinner />;
  return (
    <>
      <PageHead title="Interview invitations" sub="You'll also receive these by email." />
      {list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map(i => (
        <div key={i.id} className="card border-l-4 border-l-amber-500 p-5">
          <p className="font-semibold text-ink-900 dark:text-white">{i.title}</p><p className="text-sm muted">{i.company}</p>
          <p className="mt-3 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400"><CalendarCheck size={17} />{fmtDateTime(i.scheduled_at)}</p>
          <p className="mt-1 text-sm"><span className="muted">Type:</span> {i.mode}</p>
          {i.location && <p className="text-sm break-words"><span className="muted">Where / link:</span> {i.location}</p>}
          {i.notes && <p className="mt-2 rounded-lg bg-ink-50 p-2.5 text-sm dark:bg-ink-800">{i.notes}</p>}
        </div>
      ))}</div> : <Empty icon={CalendarCheck} title="No interview invitations yet" text="When a recruiter invites you, it will appear here." />}
    </>
  );
}

export default function CandidateDashboard() {
  return (
    <DashboardShell title="Candidate" tabs={[
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "profile", label: "Profile & CV", icon: UserCircle },
      { id: "applications", label: "My Applications", icon: Briefcase },
      { id: "saved", label: "Saved Jobs", icon: Heart },
      { id: "interviews", label: "Interviews", icon: CalendarCheck },
      { id: "settings", label: "Settings", icon: Settings },
    ]} render={(tab, go) => ({
      overview: <Overview go={go} />, profile: <Profile />, applications: <Applications />, saved: <Saved />, interviews: <Interviews />, settings: <AccountSettings />,
    } as Record<string, React.ReactNode>)[tab]} />
  );
}
