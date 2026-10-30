import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Building2, CalendarClock, Heart, MapPin, Wallet } from "lucide-react";
import { api, daysLeft, fmtDate, rand, type Job } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Alert, Modal } from "./ui";

/** Apply flow used by job cards and the job detail page. */
export function useApply() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [cover, setCover] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const start = (j: Job) => {
    if (!user) return nav(`/signin?next=${encodeURIComponent(`/vacancies/${j.id}`)}`);
    setJob(j); setCover(""); setMsg(user.role === "candidate" ? null : { kind: "error", text: "Only candidate accounts can apply for jobs." });
  };
  const submit = async () => {
    if (!job) return;
    setBusy(true);
    try {
      await api("/candidate/applications", { method: "POST", json: { jobId: job.id, coverLetter: cover } });
      setMsg({ kind: "success", text: "Application submitted! Track it in your dashboard. A confirmation email is on its way." });
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); } finally { setBusy(false); }
  };
  const modal = (
    <Modal open={!!job} onClose={() => setJob(null)} title={`Apply: ${job?.title ?? ""}`}>
      <p className="mb-4 text-sm muted">{job?.company} · {job?.location}</p>
      {msg && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
      {msg?.kind === "success" ? (
        <div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setJob(null)}>Close</button><Link to="/dashboard/candidate?tab=applications" className="btn-primary">View applications</Link></div>
      ) : user?.role === "candidate" ? (
        <>
          <label className="label" htmlFor="cover">Cover letter (optional)</label>
          <textarea id="cover" className="input min-h-32" value={cover} onChange={e => setCover(e.target.value)} placeholder="Tell the recruiter why you're a great fit…" />
          <p className="mt-2 text-xs muted">Your profile and uploaded CV will be shared with the recruiter.</p>
          {msg?.text.includes("CV") && <Link to="/dashboard/candidate?tab=profile" className="btn-secondary mt-3">Upload my CV</Link>}
          <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setJob(null)}>Cancel</button><button className="btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit application"}</button></div>
        </>
      ) : null}
    </Modal>
  );
  return { start, modal };
}

export default function JobCard({ job, saved, onToggleSave, onApply }: { job: Job; saved?: boolean; onToggleSave?: (j: Job) => void; onApply: (j: Job) => void }) {
  const left = daysLeft(job.closing_date);
  return (
    <article className="card group flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{job.company.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
          <div className="min-w-0">
            <Link to={`/vacancies/${job.id}`} className="line-clamp-2 font-semibold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400">{job.title}</Link>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm muted"><Building2 size={14} />{job.company}</p>
          </div>
        </div>
        {onToggleSave && (
          <button onClick={() => onToggleSave(job)} aria-label={saved ? "Remove from saved jobs" : "Save job"} aria-pressed={saved}
            className={`rounded-full p-2 transition hover:scale-110 ${saved ? "text-rose-600" : "text-ink-400 hover:text-rose-500"}`}>
            <Heart size={19} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="badge bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"><MapPin size={12} />{job.location}, {job.province}</span>
        <span className="badge bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"><Briefcase size={12} />{job.employment_type}</span>
        <span className="badge bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300"><Wallet size={12} />{rand(job.salary_min)} – {rand(job.salary_max)} pm</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-4 dark:border-ink-800" style={{ marginTop: "1.25rem" }}>
        <p className={`flex items-center gap-1.5 text-xs ${left <= 7 ? "font-semibold text-amber-700 dark:text-amber-400" : "muted"}`}>
          <CalendarClock size={14} />Closes {fmtDate(job.closing_date)}{left >= 0 && left <= 7 ? ` · ${left}d left` : ""}
        </p>
        <button className="btn-primary btn-sm" onClick={() => onApply(job)}>Apply</button>
      </div>
    </article>
  );
}
