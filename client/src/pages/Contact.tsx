import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { api } from "../lib/api";
import { useContent } from "../lib/content";
import { Alert, Reveal } from "../components/ui";

export default function Contact() {
  const c = useContent();
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api("/contact", { method: "POST", json: f });
      setMsg({ kind: "success", text: "Thank you! Your message has been sent. We'll reply within one business day." });
      setF({ name: "", email: "", subject: "", message: "" });
    } catch (err) { setMsg({ kind: "error", text: (err as Error).message }); } finally { setBusy(false); }
  };
  const info = [
    { icon: MapPin, label: "Office", value: c.contact_address },
    { icon: Mail, label: "Email", value: c.contact_email, href: `mailto:${c.contact_email}` },
    { icon: Phone, label: "Phone", value: c.contact_phone, href: `tel:${c.contact_phone?.replace(/\s/g, "")}` },
    { icon: Clock, label: "Office hours", value: c.office_hours },
  ];
  return (
    <>
      <section className="bg-gradient-to-br from-brand-800 to-brand-950 py-14 text-white">
        <div className="container-x"><h1 className="text-3xl font-extrabold !text-white sm:text-4xl">Contact us</h1><p className="mt-2 max-w-2xl text-brand-100">Looking for work or hiring? Our team is ready to help.</p></div>
      </section>
      <section className="container-x grid gap-8 py-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="space-y-4">
            {info.map(i => (
              <div key={i.label} className="card flex items-start gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><i.icon size={20} /></span>
                <div><p className="text-sm muted">{i.label}</p>{i.href ? <a href={i.href} className="font-semibold text-ink-900 hover:text-brand-700 dark:text-white">{i.value}</a> : <p className="font-semibold text-ink-900 dark:text-white">{i.value}</p>}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
            <h2 className="text-xl font-bold">Send us a message</h2>
            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="c-name">Full name *</label><input id="c-name" required className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
              <div><label className="label" htmlFor="c-email">Email *</label><input id="c-email" type="email" required className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
            </div>
            <div><label className="label" htmlFor="c-sub">Subject</label>
              <select id="c-sub" className="input" value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}>
                <option value="">General enquiry</option><option>I'm looking for work</option><option>I want to hire</option><option>Account support</option><option>Partnership</option>
              </select></div>
            <div><label className="label" htmlFor="c-msg">Message *</label><textarea id="c-msg" required className="input min-h-36" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} /></div>
            <button className="btn-primary w-full py-3 sm:w-auto" disabled={busy}><Send size={17} />{busy ? "Sending…" : "Send message"}</button>
          </form>
        </Reveal>
      </section>
      <section className="container-x pb-16">
        <div className="card overflow-hidden">
          <iframe title="MBONO Recruitment Services office location on Google Maps" className="h-80 w-full border-0 sm:h-96"
            src={`https://www.google.com/maps?q=${encodeURIComponent(c.contact_address || "Gqeberha, South Africa")}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </section>
    </>
  );
}
