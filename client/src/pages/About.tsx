import { Link } from "react-router-dom";
import { ArrowRight, Compass, Eye, Handshake, Heart, Lightbulb, Linkedin, Scale, Search, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { Reveal, Avatar } from "../components/ui";
import { IMG } from "./Home";

const values = [
  { icon: Heart, title: "People first", text: "Every candidate and client is treated with dignity, respect and care." },
  { icon: ShieldCheck, title: "Integrity", text: "Honest, transparent and POPIA-compliant in everything we do." },
  { icon: Sparkles, title: "Excellence", text: "High standards in screening, matching and service delivery." },
  { icon: Scale, title: "Inclusion", text: "Championing diversity, transformation and equal opportunity." },
  { icon: Lightbulb, title: "Innovation", text: "Using technology to make hiring faster, fairer and smarter." },
  { icon: Handshake, title: "Partnership", text: "Long-term relationships built on trust and shared success." },
];
const approach = [
  { icon: Search, title: "Understand", text: "We take time to understand the role, team culture and candidate goals." },
  { icon: Target, title: "Source & screen", text: "Targeted sourcing, competency screening and reference checks." },
  { icon: Users, title: "Match & present", text: "A curated shortlist of candidates who fit both skills and culture." },
  { icon: Compass, title: "Support & follow up", text: "Interview coordination, offer support and post-placement check-ins." },
];
const team = [
  { name: "Nomvula Mbono", role: "Founder & Managing Director" },
  { name: "Sipho Ndlovu", role: "Head of Talent Acquisition" },
  { name: "Lerato Mokoena", role: "Senior Recruitment Consultant" },
  { name: "Thabo Nkosi", role: "Client Relationship Manager" },
];

export default function About() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink-900 py-24 text-white">
        <img src={IMG.team} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" onError={e => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-900/90 to-brand-900/70" />
        <div className="container-x animate-fade-up">
          <span className="eyebrow !text-brand-300">About us</span>
          <h1 className="max-w-3xl text-4xl font-extrabold !text-white sm:text-5xl">Building careers. Building businesses. Building South Africa.</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-200">MBONO Recruitment Services is a South African recruitment and talent acquisition partner connecting skilled professionals with employers who value them.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Company overview</span>
            <h2 className="section-title">Who we are</h2>
            <div className="mt-4 space-y-4 muted leading-7">
              <p>Founded in Nelson Mandela Bay, MBONO Recruitment Services grew from a simple belief: the right opportunity can change a life, and the right person can transform a business.</p>
              <p>Today we recruit for permanent, contract, graduate and learnership roles across customer experience, finance, IT, healthcare, logistics, engineering and more — in all nine provinces.</p>
              <p>Our digital platform lets candidates apply and track progress in real time, while recruiters manage vacancies, shortlists and interviews in one place.</p>
            </div>
          </Reveal>
          <Reveal delay={100}><img src={IMG.meeting} alt="MBONO consultants in a planning session" className="aspect-[4/3] w-full rounded-3xl bg-brand-100 object-cover shadow-xl dark:bg-brand-950" onError={e => (e.currentTarget.style.visibility = "hidden")} /></Reveal>
        </div>
      </section>

      <section className="bg-ink-50 py-20 dark:bg-ink-900/40">
        <div className="container-x grid gap-6 md:grid-cols-2">
          <Reveal><div className="card h-full p-8"><span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white"><Target /></span><h3 className="mt-5 text-2xl font-bold">Our mission</h3><p className="mt-3 muted leading-7">To connect talented South Africans with meaningful work, and to help organisations recruit top talent through a fair, fast and people-centred recruitment experience.</p></div></Reveal>
          <Reveal delay={100}><div className="card h-full p-8"><span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-white dark:bg-brand-900"><Eye /></span><h3 className="mt-5 text-2xl font-bold">Our vision</h3><p className="mt-3 muted leading-7">To be South Africa's most trusted recruitment partner — reducing unemployment by unlocking potential and building workplaces where people thrive.</p></div></Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center"><span className="eyebrow">Core values</span><h2 className="section-title">What we stand for</h2></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => <Reveal key={v.title} delay={i * 60}><div className="card h-full p-6 transition hover:-translate-y-1 hover:shadow-lg"><v.icon className="text-brand-700 dark:text-brand-400" /><h3 className="mt-4 font-semibold">{v.title}</h3><p className="mt-1.5 text-sm muted">{v.text}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 py-20 text-white">
        <div className="container-x">
          <Reveal className="max-w-2xl"><span className="eyebrow !text-brand-300">Recruitment approach</span><h2 className="section-title !text-white">How we find the right fit</h2><p className="mt-3 text-ink-300">A structured, transparent process that respects candidates' time and gives employers confidence.</p></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((a, i) => <Reveal key={a.title} delay={i * 80}><div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6"><span className="text-sm font-bold text-brand-400">0{i + 1}</span><a.icon className="mt-3 text-brand-300" /><h3 className="mt-3 font-semibold !text-white">{a.title}</h3><p className="mt-1.5 text-sm text-ink-300">{a.text}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center"><span className="eyebrow">Our team</span><h2 className="section-title">The people behind MBONO</h2></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="card group p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mx-auto w-fit transition group-hover:scale-105"><Avatar name={t.name} size={88} /></div>
                  <h3 className="mt-4 font-semibold">{t.name}</h3><p className="text-sm muted">{t.role}</p>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label={`${t.name} on LinkedIn`} className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-full bg-ink-100 text-ink-600 hover:bg-brand-700 hover:text-white dark:bg-ink-800 dark:text-ink-300"><Linkedin size={15} /></a>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 text-center"><Link to="/contact" className="btn-primary px-6 py-3">Work with us <ArrowRight size={18} /></Link></div>
        </div>
      </section>
    </>
  );
}
