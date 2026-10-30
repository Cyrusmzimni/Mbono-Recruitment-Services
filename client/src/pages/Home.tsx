import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Award, BadgeCheck, Briefcase, Building2, CheckCircle2, FileText, Handshake, HeartHandshake, MapPin, Quote, Search, ShieldCheck, Star, Target, UserPlus, Users, Zap } from "lucide-react";
import { api, type Job } from "../lib/api";
import { useContent } from "../lib/content";
import { CountUp, Reveal, Avatar } from "../components/ui";
import JobCard, { useApply } from "../components/JobCard";
import { useSaved } from "../lib/saved";

export const IMG = {
  hero: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=75",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=75",
  meeting: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=75",
  interview: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=75",
};

const why = [
  { icon: Target, title: "Precise matching", text: "We match skills, culture and ambition — not just keywords — so placements last." },
  { icon: Zap, title: "Fast turnaround", text: "Shortlists in days, not weeks, backed by a pre-screened talent pool." },
  { icon: ShieldCheck, title: "Trusted & compliant", text: "POPIA-compliant processes, verified employers and transparent communication." },
  { icon: HeartHandshake, title: "People-first support", text: "Career guidance for candidates and dedicated account managers for employers." },
  { icon: MapPin, title: "National reach", text: "Opportunities across all nine provinces, from Gqeberha to Polokwane." },
  { icon: Award, title: "Proven results", text: "Hundreds of successful placements across BPO, finance, IT, healthcare and more." },
];
const steps = [
  { icon: UserPlus, title: "Register", text: "Create your free profile as a candidate or recruiter." },
  { icon: FileText, title: "Build your profile", text: "Upload your CV and certifications, or post your vacancies." },
  { icon: Search, title: "Match & apply", text: "Search and apply in one click, or shortlist top talent." },
  { icon: Handshake, title: "Interview & hire", text: "Schedule interviews, track progress and make the offer." },
];
const testimonials = [
  { name: "Ayanda Zulu", role: "Customer Experience Consultant, Gqeberha", text: "MBONO helped me move from a temporary contract to a permanent role within three weeks. I always knew where my application stood." },
  { name: "Pieter van Wyk", role: "HR Manager, Karoo Logistics", text: "The shortlists were spot-on. We filled four supervisor positions faster than ever, and the candidates have stayed." },
  { name: "Naledi Khumalo", role: "Graduate Software Developer, Cape Town", text: "As a graduate it felt hard to get noticed. The team gave me CV advice and connected me to an employer who invested in me." },
];
const partners = ["Ubuntu Financial", "Coastal Digital", "Karoo Logistics", "Lowveld Health", "Bushveld Minerals", "Isizwe Telecom", "Amandla Retail", "Baobab Energy"];

export default function Home() {
  const c = useContent();
  const nav = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ candidates: 0, companies: 0, jobs: 0, placements: 0 });
  const [kw, setKw] = useState(""); const [loc, setLoc] = useState("");
  const { start, modal } = useApply();
  const saved = useSaved();
  useEffect(() => {
    api<Job[]>("/jobs?featured=true").then(j => setJobs(j.slice(0, 6))).catch(() => {});
    api("/stats").then(setStats).catch(() => {});
  }, []);

  return (
    <>
      {c.announcement && <div className="bg-brand-700 px-4 py-2 text-center text-sm font-medium text-white">{c.announcement}</div>}
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-900">
        <img src={IMG.hero} alt="Professionals collaborating in a modern office" className="absolute inset-0 -z-20 h-full w-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/95 via-ink-900/85 to-brand-900/60" />
        <div className="container-x grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.2fr_.8fr] lg:py-32">
          <div className="animate-fade-up">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-200 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />Recruitment across South Africa
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight !text-white sm:text-6xl">{c.hero_title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-200">{c.hero_subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/vacancies" className="btn-primary px-6 py-3 text-base">Browse Vacancies <ArrowRight size={18} /></Link>
              <Link to="/signup" className="btn px-6 py-3 text-base border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-ink-900">Register Now</Link>
            </div>
            <form onSubmit={e => { e.preventDefault(); nav(`/vacancies?q=${encodeURIComponent(kw)}&location=${encodeURIComponent(loc)}`); }}
              className="mt-10 grid max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-2xl dark:bg-ink-900 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-2 px-3"><Search size={18} className="text-brand-700" /><input value={kw} onChange={e => setKw(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none dark:text-white" placeholder="Job title or keyword" aria-label="Keyword" /></label>
              <label className="flex items-center gap-2 border-t border-ink-100 px-3 dark:border-ink-800 sm:border-l sm:border-t-0"><MapPin size={18} className="text-brand-700" /><input value={loc} onChange={e => setLoc(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none dark:text-white" placeholder="City or province" aria-label="Location" /></label>
              <button className="btn-primary">Search jobs</button>
            </form>
          </div>
          <div className="hidden lg:block">
            <div className="relative animate-float rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md">
              <p className="text-sm text-brand-200">Live on MBONO</p>
              <p className="mt-1 text-4xl font-extrabold">{stats.jobs}+</p><p className="text-sm text-ink-200">open vacancies right now</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Verified employers", "Free for candidates", "Real-time application tracking", "Interview invitations by email"].map(t => <li key={t} className="flex items-center gap-2"><CheckCircle2 size={17} className="text-brand-400" />{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="py-20">
        <div className="container-x">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div><span className="eyebrow">Featured jobs</span><h2 className="section-title">Opportunities hiring now</h2><p className="mt-2 muted">Hand-picked roles from trusted employers across South Africa.</p></div>
            <Link to="/vacancies" className="btn-secondary">View all vacancies <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j, i) => <Reveal key={j.id} delay={i * 70} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><JobCard job={j} onApply={start} saved={saved.ids.has(j.id)} onToggleSave={saved.toggle} /></div></Reveal>)}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="bg-ink-50 py-20 dark:bg-ink-900/40">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <img src={IMG.meeting} alt="Recruitment consultants meeting with a client" className="aspect-[4/3] w-full rounded-3xl bg-brand-100 object-cover shadow-xl dark:bg-brand-950" onError={e => (e.currentTarget.style.visibility = "hidden")} />
              <div className="card absolute -bottom-6 left-6 flex items-center gap-3 p-4 shadow-xl">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-700 text-white"><BadgeCheck /></span>
                <div><p className="text-xl font-bold">95%</p><p className="text-xs muted">Client satisfaction</p></div>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal><span className="eyebrow">Why choose us</span><h2 className="section-title">Why choose MBONO Recruitment Services</h2><p className="mt-3 muted">A recruitment partner that understands the South African job market and puts people first.</p></Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {why.map((w, i) => (
                <Reveal key={w.title} delay={i * 60}>
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-700/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-400"><w.icon size={20} /></span>
                    <div><h3 className="font-semibold">{w.title}</h3><p className="mt-1 text-sm muted">{w.text}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-20">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center"><span className="eyebrow">How it works</span><h2 className="section-title">Our recruitment process</h2><p className="mt-3 muted">Four simple steps from registration to your next hire or career move.</p></Reveal>
          <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-500 to-brand-200 lg:block dark:from-brand-900 dark:to-brand-900" />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100} className="relative text-center">
                <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-900/20"><s.icon size={26} /><span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-brand-800 ring-2 ring-brand-700 dark:bg-ink-900 dark:text-brand-300">{i + 1}</span></span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3><p className="mt-2 text-sm muted">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-16 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" /><div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-white/5" />
        <div className="container-x relative grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {[
            { label: "Registered candidates", v: 2500 + stats.candidates, s: "+" },
            { label: "Partner companies", v: 120 + stats.companies, s: "+" },
            { label: "Successful placements", v: 1800 + stats.placements, s: "+" },
            { label: "Open vacancies", v: stats.jobs, s: "" },
          ].map(x => (
            <div key={x.label}><p className="text-4xl font-extrabold sm:text-5xl"><CountUp to={x.v} suffix={x.s} /></p><p className="mt-2 text-sm text-brand-100">{x.label}</p></div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center"><span className="eyebrow">Testimonials</span><h2 className="section-title">Success stories</h2><p className="mt-3 muted">Hear from candidates and employers who found their match.</p></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="card flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <Quote className="text-brand-600" size={28} />
                  <div className="mt-3 flex gap-0.5 text-amber-500">{[...Array(5)].map((_, k) => <Star key={k} size={15} fill="currentColor" />)}</div>
                  <blockquote className="mt-3 flex-1 text-sm leading-6 text-ink-700 dark:text-ink-200">"{t.text}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3"><Avatar name={t.name} /><div><p className="font-semibold text-ink-900 dark:text-white">{t.name}</p><p className="text-xs muted">{t.role}</p></div></figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-y border-ink-200 bg-ink-50 py-14 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="container-x">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] muted">Trusted by partner companies across South Africa</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partners.map(p => (
              <div key={p} className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-4 text-sm font-bold text-ink-500 grayscale transition hover:text-brand-700 hover:grayscale-0 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400 dark:hover:text-brand-400">
                <Building2 size={18} />{p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-x">
          <Reveal>
            <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-ink-900 p-8 text-white sm:p-12 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-3xl font-bold !text-white sm:text-4xl">Ready for your next move?</h2>
                <p className="mt-3 text-ink-300">Join thousands of South Africans building their careers with MBONO — or find your next great hire today.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/signup" className="btn-primary px-6 py-3"><Users size={18} />I'm looking for work</Link>
                  <Link to="/signup?role=recruiter" className="btn px-6 py-3 border border-white/25 text-white hover:bg-white hover:text-ink-900"><Briefcase size={18} />I'm hiring</Link>
                </div>
              </div>
              <img src={IMG.interview} alt="Candidate in a job interview" className="hidden h-56 w-full rounded-2xl bg-ink-800 object-cover lg:block" onError={e => (e.currentTarget.style.visibility = "hidden")} />
            </div>
          </Reveal>
        </div>
      </section>
      {modal}
    </>
  );
}
