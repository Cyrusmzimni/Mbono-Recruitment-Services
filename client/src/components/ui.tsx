import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="MBONO Recruitment Services home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-700 shadow-sm">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true"><path d="M10 50V14h9l13 19 13-19h9v36h-9V30L32 48 19 30v20z" fill="#fff" /></svg>
      </span>
      <span className="leading-none">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900 dark:text-white"}`}>MBONO</span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-brand-300" : "text-brand-700 dark:text-brand-400"}`}>Recruitment Services</span>
      </span>
    </Link>
  );
}

/** Fades children in when they scroll into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/** Animated number that counts up when visible. */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const start = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - start) / 1400); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString("en-ZA")}{suffix}</span>;
}

export function StatCard({ label, value, icon: Icon, tone = "brand", hint }: { label: string; value: React.ReactNode; icon: any; tone?: "brand" | "blue" | "amber" | "violet" | "rose"; hint?: string }) {
  const tones = { brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", blue: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300", amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", violet: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" };
  return (
    <div className="card flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20} /></span>
      <div className="min-w-0">
        <p className="text-sm muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
        {hint && <p className="mt-0.5 text-xs muted">{hint}</p>}
      </div>
    </div>
  );
}

const statusTone: Record<string, string> = {
  Submitted: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
  "Under Review": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  Shortlisted: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  Interview: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Offered: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  Hired: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300",
  Rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  active: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300",
  open: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  closed: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  suspended: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};
export const StatusBadge = ({ status }: { status: string }) => <span className={`badge ${statusTone[status] ?? statusTone.Submitted} capitalize`}>{status}</span>;

export function Alert({ kind = "error", children, onClose }: { kind?: "error" | "success"; children: React.ReactNode; onClose?: () => void }) {
  if (!children) return null;
  const cls = kind === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm animate-fade-in ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" /><div className="flex-1 whitespace-pre-line">{children}</div>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><X size={16} /></button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-6 animate-fade-up sm:rounded-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`} onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ icon: Icon, title, text, action }: { icon: any; title: string; text?: string; action?: React.ReactNode }) => (
  <div className="card flex flex-col items-center px-6 py-12 text-center">
    <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"><Icon size={22} /></span>
    <p className="font-semibold text-ink-900 dark:text-white">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm muted">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Spinner = () => <div className="grid place-items-center py-16"><span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" /></div>;

export const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => (
  <span className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
  </span>
);

/** Simple horizontal bar chart for dashboards. */
export function Bars({ data, color = "bg-brand-600" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <ul className="space-y-3">
      {data.map(d => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="text-ink-700 dark:text-ink-200">{d.label}</span><span className="font-semibold">{d.value}</span></div>
          <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800"><div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
      {!data.length && <li className="text-sm muted">No data yet.</li>}
    </ul>
  );
}

/** Vertical column chart. */
export function Columns({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex h-48 items-end gap-3">
      {data.map(d => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold">{d.value}</span>
          <div className="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-500 transition-all duration-700" style={{ height: `${Math.max(4, (d.value / max) * 140)}px` }} />
          <span className="text-xs muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
