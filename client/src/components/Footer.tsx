import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Logo } from "./ui";
import { useContent } from "../lib/content";

export default function Footer() {
  const c = useContent();
  const socials = [
    { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com" },
    { icon: Facebook, label: "Facebook", href: "https://www.facebook.com" },
    { icon: Twitter, label: "X (Twitter)", href: "https://x.com" },
    { icon: Instagram, label: "Instagram", href: "https://www.instagram.com" },
    { icon: Youtube, label: "YouTube", href: "https://www.youtube.com" },
  ];
  return (
    <footer className="bg-ink-900 text-ink-300 dark:bg-black/40">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-6 text-ink-400">Connecting talent with opportunity across South Africa. People first, possibility always.</p>
          <div className="mt-5 flex gap-2">
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white"><s.icon size={16} /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider !text-white">Quick links</h4>
          <ul className="space-y-2.5 text-sm">
            {[["/", "Home"], ["/about", "About Us"], ["/vacancies", "Vacancies"], ["/contact", "Contact Us"]].map(([to, l]) => <li key={to}><Link to={to} className="hover:text-brand-400">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider !text-white">For you</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/signup" className="hover:text-brand-400">Register as a candidate</Link></li>
            <li><Link to="/signup?role=recruiter" className="hover:text-brand-400">Hire with MBONO</Link></li>
            <li><Link to="/signin" className="hover:text-brand-400">Sign In</Link></li>
            <li><Link to="/vacancies" className="hover:text-brand-400">Browse vacancies</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider !text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin size={17} className="mt-0.5 shrink-0 text-brand-400" />{c.contact_address}</li>
            <li className="flex gap-2.5"><Phone size={17} className="mt-0.5 shrink-0 text-brand-400" /><a href={`tel:${c.contact_phone?.replace(/\s/g, "")}`} className="hover:text-brand-400">{c.contact_phone}</a></li>
            <li className="flex gap-2.5"><Mail size={17} className="mt-0.5 shrink-0 text-brand-400" /><a href={`mailto:${c.contact_email}`} className="hover:text-brand-400">{c.contact_email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MBONO Recruitment Services. All rights reserved.</p>
          <p>POPIA compliant · Equal opportunity recruiter</p>
        </div>
      </div>
    </footer>
  );
}
