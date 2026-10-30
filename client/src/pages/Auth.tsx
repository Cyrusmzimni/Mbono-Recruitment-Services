import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Briefcase, Eye, EyeOff, Lock, Mail, User as UserIcon, Users } from "lucide-react";
import { useAuth, dashboardPath } from "../lib/auth";
import { Alert, Logo } from "../components/ui";
import { IMG } from "./Home";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <img src={IMG.interview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" onError={e => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="text-3xl font-bold leading-tight">"Connecting Talent with Opportunity."</p>
          <p className="mt-3 max-w-md text-brand-100">Join thousands of professionals and employers building their future with MBONO Recruitment Services.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold">{title}</h1><p className="mt-2 muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input id={id} type={show ? "text" : "password"} required className="input pl-10 pr-10" value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
  );
}

export function SignIn() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) nav(sp.get("next") || dashboardPath(user), { replace: true }); }, [user]); // eslint-disable-line
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(email, password); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const demo = [["Admin", "admin@mbono.co.za", "Admin@123"], ["Recruiter", "recruiter@mbono.co.za", "Recruiter@123"], ["Candidate", "candidate@mbono.co.za", "Candidate@123"]];
  return (
    <Shell title="Welcome back" subtitle="Sign in to your MBONO account.">
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert>{err}</Alert>}
        <div><label className="label" htmlFor="email">Email address</label>
          <div className="relative"><Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input id="email" type="email" required autoComplete="email" className="input pl-10" value={email} onChange={e => setEmail(e.target.value)} /></div></div>
        <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" /></div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
      </form>
      <p className="mt-6 text-center text-sm muted">Don't have an account? <Link to="/signup" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">Sign up</Link></p>
      <div className="mt-8 rounded-xl border border-dashed border-ink-300 p-4 dark:border-ink-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider muted">Demo accounts (click to fill)</p>
        <div className="grid grid-cols-3 gap-2">{demo.map(([r, e, p]) => <button key={r} type="button" className="btn-secondary btn-sm" onClick={() => { setEmail(e); setPassword(p); }}>{r}</button>)}</div>
      </div>
    </Shell>
  );
}

export function SignUp() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState(sp.get("role") === "recruiter" ? "recruiter" : "candidate");
  const [f, setF] = useState({ name: "", email: "", phone: "", companyName: "", password: "", confirm: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) nav(dashboardPath(user), { replace: true }); }, [user]); // eslint-disable-line
  const strength = [f.password.length >= 8, /[A-Z]/.test(f.password), /\d/.test(f.password), /[^A-Za-z0-9]/.test(f.password)].filter(Boolean).length;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (f.password !== f.confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const r = await register({ ...f, role });
      if (r.pending) setOk(r.message ?? "Account created. Awaiting approval.");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (ok) return <Shell title="Almost there!" subtitle=""><Alert kind="success">{ok}{"\n"}You'll receive an email once an administrator approves your account.</Alert><Link to="/" className="btn-primary mt-6 w-full">Back to home</Link></Shell>;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Shell title="Create your account" subtitle="It's free and takes less than a minute.">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-ink-100 p-1 dark:bg-ink-900" role="radiogroup" aria-label="Account type">
        {[["candidate", Users, "I'm a Candidate"], ["recruiter", Briefcase, "I'm a Recruiter"]].map(([r, Icon, l]: any) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${role === r ? "bg-white text-brand-700 shadow dark:bg-ink-700 dark:text-brand-300" : "muted"}`}><Icon size={16} />{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert>{err}</Alert>}
        <div><label className="label" htmlFor="name">Full name</label><div className="relative"><UserIcon size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input id="name" required className="input pl-10" value={f.name} onChange={set("name")} autoComplete="name" /></div></div>
        <div><label className="label" htmlFor="r-email">Email address</label><input id="r-email" type="email" required className="input" value={f.email} onChange={set("email")} autoComplete="email" /></div>
        {role === "recruiter" && <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="company">Company name</label><input id="company" required className="input" value={f.companyName} onChange={set("companyName")} /></div>
          <div><label className="label" htmlFor="phone">Phone</label><input id="phone" className="input" value={f.phone} onChange={set("phone")} /></div>
        </div>}
        <div><label className="label" htmlFor="r-pw">Password</label><PasswordInput id="r-pw" value={f.password} onChange={v => setF({ ...f, password: v })} autoComplete="new-password" />
          <div className="mt-2 flex gap-1">{[0, 1, 2, 3].map(i => <span key={i} className={`h-1 flex-1 rounded-full ${i < strength ? ["bg-rose-500", "bg-amber-500", "bg-brand-500", "bg-brand-700"][strength - 1] : "bg-ink-200 dark:bg-ink-800"}`} />)}</div>
          <p className="mt-1 text-xs muted">At least 8 characters with a letter and a number.</p></div>
        <div><label className="label" htmlFor="r-confirm">Confirm password</label><input id="r-confirm" type="password" required className="input" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></div>
        {role === "recruiter" && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Recruiter accounts are reviewed and approved by an administrator before you can sign in.</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Creating account…" : "Sign Up"}</button>
      </form>
      <p className="mt-6 text-center text-sm muted">Already have an account? <Link to="/signin" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">Sign in</Link></p>
    </Shell>
  );
}
