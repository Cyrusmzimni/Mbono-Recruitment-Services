import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Logo, Avatar } from "./ui";
import ThemeToggle from "./ThemeToggle";
import { useAuth, dashboardPath } from "../lib/auth";
import { api, fmtDate } from "../lib/api";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/vacancies", label: "Vacancies" },
  { to: "/contact", label: "Contact Us" },
];

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const load = () => api<any[]>("/notifications").then(setItems).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const unread = items.filter(i => !i.is_read).length;
  const toggle = () => { setOpen(!open); if (!open && unread) api("/notifications/read", { method: "POST" }).then(load); };
  return (
    <div className="relative">
      <button className="btn-ghost relative p-2" onClick={toggle} aria-label={`Notifications (${unread} unread)`}>
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden animate-fade-in">
          <p className="border-b border-ink-100 px-4 py-3 text-sm font-semibold dark:border-ink-800">Notifications</p>
          <ul className="max-h-80 overflow-y-auto">
            {items.map(n => (
              <li key={n.id} className="border-b border-ink-100 px-4 py-3 text-sm last:border-0 dark:border-ink-800">
                <p className="font-medium text-ink-900 dark:text-white">{n.title}</p>
                <p className="muted">{n.message}</p>
                <p className="mt-1 text-xs muted">{fmtDate(n.created_at)}</p>
              </li>
            ))}
            {!items.length && <li className="px-4 py-6 text-center text-sm muted">You're all caught up.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 8); h(); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "text-brand-700 dark:text-brand-400" : "text-ink-600 hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-400"}`;
  const doLogout = () => { logout(); nav("/"); };

  return (
    <header className={`sticky top-0 z-50 border-b transition-all ${scrolled ? "border-ink-200/80 bg-white/90 shadow-sm backdrop-blur-lg dark:border-ink-800 dark:bg-ink-950/90" : "border-transparent bg-white dark:bg-ink-950"}`}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Notifications />
              <div className="relative">
                <button className="btn-ghost gap-2 px-2" onClick={() => setMenu(!menu)} aria-expanded={menu}>
                  <Avatar name={user.name} size={30} /><span className="max-w-[8rem] truncate">{user.name.split(" ")[0]}</span><ChevronDown size={16} />
                </button>
                {menu && (
                  <div className="card absolute right-0 z-50 mt-2 w-56 p-1.5 animate-fade-in">
                    <p className="px-3 py-2 text-xs muted">Signed in as <span className="font-semibold capitalize text-ink-800 dark:text-ink-100">{user.role}</span></p>
                    <Link to={dashboardPath(user)} className="btn-ghost w-full justify-start"><LayoutDashboard size={16} />Dashboard</Link>
                    <button onClick={doLogout} className="btn-ghost w-full justify-start text-rose-600 dark:text-rose-400"><LogOut size={16} />Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          {user && <Notifications />}
          <button className="btn-ghost p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-ink-200 bg-white px-4 pb-5 pt-2 animate-fade-in dark:border-ink-800 dark:bg-ink-950 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map(l => <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>{l.label}</NavLink>)}
          </nav>
          <div className="mt-3 flex items-center justify-between"><span className="text-sm muted">Theme</span><ThemeToggle showLabels /></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link to={dashboardPath(user)} className="btn-primary">Dashboard</Link>
                <button onClick={doLogout} className="btn-secondary">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary">Sign In</Link>
                <Link to="/signup" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
