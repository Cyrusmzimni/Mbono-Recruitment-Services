import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, CalendarClock, Filter, Heart, MapPin, Search, SearchX, Wallet, X } from "lucide-react";
import { api, daysLeft, fmtDate, rand, type Job } from "../lib/api";
import JobCard, { useApply } from "../components/JobCard";
import { Empty, Spinner } from "../components/ui";
import { useSaved } from "../lib/saved";

const salaryRanges = [
  { label: "Any salary", min: "", max: "" },
  { label: "Up to R10 000", min: "", max: "10000" },
  { label: "R10 000 – R20 000", min: "10000", max: "20000" },
  { label: "R20 000 – R35 000", min: "20000", max: "35000" },
  { label: "R35 000 – R50 000", min: "35000", max: "50000" },
  { label: "R50 000+", min: "50000", max: "" },
];

export default function Vacancies() {
  const [sp, setSp] = useSearchParams();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [filters, setFilters] = useState<{ types: string[]; industries: string[]; provinces: string[] }>({ types: [], industries: [], provinces: [] });
  const [kw, setKw] = useState(sp.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const { start, modal } = useApply();
  const saved = useSaved();
  const get = (k: string) => sp.get(k) ?? "";
  const set = (patch: Record<string, string>) => { const n = new URLSearchParams(sp); for (const [k, v] of Object.entries(patch)) v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  const salaryIdx = Math.max(0, salaryRanges.findIndex(r => r.min === get("salaryMin") && r.max === get("salaryMax")));

  useEffect(() => { api("/jobs/filters").then(setFilters).catch(() => {}); }, []);
  useEffect(() => {
    setJobs(null);
    const t = setTimeout(() => api<Job[]>(`/jobs?${sp.toString()}`).then(setJobs).catch(() => setJobs([])), 150);
    return () => clearTimeout(t);
  }, [sp]);
  useEffect(() => { const t = setTimeout(() => { if (kw !== get("q")) set({ q: kw }); }, 350); return () => clearTimeout(t); }, [kw]); // eslint-disable-line

  const active = ["q", "type", "location", "industry", "salaryMin", "salaryMax"].filter(k => get(k)).length;
  const sel = "input cursor-pointer";

  const panel = (
    <div className="space-y-5">
      <div><label className="label" htmlFor="f-type">Employment type</label>
        <select id="f-type" className={sel} value={get("type")} onChange={e => set({ type: e.target.value })}><option value="">All types</option>{filters.types.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label className="label" htmlFor="f-loc">Location</label>
        <select id="f-loc" className={sel} value={get("location")} onChange={e => set({ location: e.target.value })}><option value="">All of South Africa</option>{filters.provinces.map(t => <option key={t}>{t}</option>)}{get("location") && !filters.provinces.includes(get("location")) && <option>{get("location")}</option>}</select></div>
      <div><label className="label" htmlFor="f-ind">Industry</label>
        <select id="f-ind" className={sel} value={get("industry")} onChange={e => set({ industry: e.target.value })}><option value="">All industries</option>{filters.industries.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label className="label" htmlFor="f-sal">Salary range (per month)</label>
        <select id="f-sal" className={sel} value={salaryIdx} onChange={e => { const r = salaryRanges[Number(e.target.value)]; set({ salaryMin: r.min, salaryMax: r.max }); }}>{salaryRanges.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}</select></div>
      {active > 0 && <button className="btn-ghost w-full" onClick={() => { setKw(""); setSp({}, { replace: true }); }}><X size={16} />Clear all filters</button>}
    </div>
  );

  return (
    <>
      <section className="bg-gradient-to-br from-brand-800 to-brand-950 py-14 text-white">
        <div className="container-x">
          <h1 className="text-3xl font-extrabold !text-white sm:text-4xl">Find your next opportunity</h1>
          <p className="mt-2 text-brand-100">Search vacancies from trusted employers across South Africa.</p>
          <div className="mt-6 flex max-w-3xl items-center gap-2 rounded-xl bg-white p-2 shadow-xl dark:bg-ink-900">
            <Search className="ml-2 shrink-0 text-brand-700" size={20} />
            <input value={kw} onChange={e => setKw(e.target.value)} placeholder="Search by job title, company, keyword or industry…" aria-label="Search jobs by keyword" className="w-full bg-transparent py-2.5 text-ink-900 outline-none dark:text-white" />
            {kw && <button onClick={() => setKw("")} className="btn-ghost p-2" aria-label="Clear search"><X size={16} /></button>}
          </div>
        </div>
      </section>
      <section className="container-x grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="card sticky top-24 p-5"><p className="mb-4 flex items-center gap-2 font-semibold"><Filter size={17} />Filters</p>{panel}</div></aside>
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm muted">{jobs ? <><span className="font-semibold text-ink-900 dark:text-white">{jobs.length}</span> vacanc{jobs.length === 1 ? "y" : "ies"} found</> : "Searching…"}</p>
            <button className="btn-secondary lg:hidden" onClick={() => setShowFilters(!showFilters)}><Filter size={16} />Filters{active ? ` (${active})` : ""}</button>
          </div>
          {showFilters && <div className="card mb-5 p-5 animate-fade-in lg:hidden">{panel}</div>}
          {!jobs ? <Spinner /> : jobs.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{jobs.map(j => <JobCard key={j.id} job={j} onApply={start} saved={saved.ids.has(j.id)} onToggleSave={saved.toggle} />)}</div>
          ) : <Empty icon={SearchX} title="No vacancies match your search" text="Try a different keyword or remove some filters." action={<button className="btn-secondary" onClick={() => { setKw(""); setSp({}); }}>Clear filters</button>} />}
        </div>
      </section>
      {modal}
    </>
  );
}

export function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null | undefined>();
  const { start, modal } = useApply();
  const saved = useSaved();
  useEffect(() => { api<Job>(`/jobs/${id}`).then(setJob).catch(() => setJob(null)); }, [id]);
  if (job === undefined) return <Spinner />;
  if (!job) return <div className="container-x py-20"><Empty icon={SearchX} title="Vacancy not found" action={<Link to="/vacancies" className="btn-primary">Browse vacancies</Link>} /></div>;
  const left = daysLeft(job.closing_date);
  const closed = job.status !== "open" || left < 0;
  return (
    <div className="container-x py-10">
      <Link to="/vacancies" className="btn-ghost mb-6 -ml-3"><ArrowLeft size={16} />Back to vacancies</Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="card p-6 sm:p-8 animate-fade-up">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{job.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
            <div><h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1><p className="mt-1 flex items-center gap-1.5 muted"><Building2 size={16} />{job.company}</p></div>
          </div>
          <h2 className="mt-8 text-lg font-semibold">About the role</h2>
          <p className="mt-2 leading-7 muted">{job.description}</p>
          {job.requirements && (<><h2 className="mt-6 text-lg font-semibold">Requirements</h2><ul className="mt-2 list-disc space-y-1 pl-5 muted">{job.requirements.split("\n").filter(Boolean).map(r => <li key={r}>{r}</li>)}</ul></>)}
        </article>
        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          {[[MapPin, "Location", `${job.location}, ${job.province}`], [Briefcase, "Employment type", job.employment_type], [Building2, "Industry", job.industry], [Wallet, "Salary", `${rand(job.salary_min)} – ${rand(job.salary_max)} per month`], [CalendarClock, "Closing date", `${fmtDate(job.closing_date)}${!closed ? ` (${left} days left)` : ""}`]].map(([Icon, l, v]: any) => (
            <div key={l} className="flex gap-3"><Icon size={18} className="mt-0.5 text-brand-700 dark:text-brand-400" /><div><p className="text-xs muted">{l}</p><p className="text-sm font-medium text-ink-900 dark:text-white">{v}</p></div></div>
          ))}
          <button className="btn-primary w-full py-3" disabled={closed} onClick={() => start(job)}>{closed ? "Applications closed" : "Apply now"}</button>
          <button className="btn-secondary w-full" onClick={() => saved.toggle(job)}><Heart size={16} fill={saved.ids.has(job.id) ? "currentColor" : "none"} className={saved.ids.has(job.id) ? "text-rose-600" : ""} />{saved.ids.has(job.id) ? "Saved" : "Save job"}</button>
        </aside>
      </div>
      {modal}
    </div>
  );
}
