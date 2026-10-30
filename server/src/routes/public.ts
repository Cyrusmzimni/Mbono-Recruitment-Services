import { Router } from "express";
import bcrypt from "bcryptjs";
import { q, one } from "../db/index.js";
import { authenticate, signToken, type Role } from "../middleware/auth.js";
import { sendEmail } from "../email.js";

export const publicRouter = Router();

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const strongPw = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
export const publicUser = (u: any) => { if (!u) return u; const { password_hash, ...rest } = u; return rest; };
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Auth ----------
publicRouter.post("/auth/register", async (req, res) => {
  const { name, email, password, role = "candidate", companyName, phone } = req.body ?? {};
  const settings = Object.fromEntries((await q("SELECT key, value FROM settings")).map(s => [s.key, s.value]));
  if (settings.allow_registrations === "false") return res.status(403).json({ error: "Registrations are currently closed." });
  if (!name?.trim() || !emailOk(email ?? "")) return res.status(400).json({ error: "Please enter your name and a valid email address." });
  if (!strongPw(password ?? "")) return res.status(400).json({ error: "Password must be at least 8 characters and include a letter and a number." });
  if (!["candidate", "recruiter"].includes(role)) return res.status(400).json({ error: "You can register as a candidate or recruiter." });
  if (role === "recruiter" && !companyName?.trim()) return res.status(400).json({ error: "Please enter your company name." });
  const lower = String(email).toLowerCase().trim();
  if (await one("SELECT id FROM users WHERE email = $1", [lower])) return res.status(409).json({ error: "An account with this email already exists." });
  const status = role === "recruiter" && settings.require_recruiter_approval !== "false" ? "pending" : "active";
  const user = await one(
    "INSERT INTO users (name, email, password_hash, role, status, company_name, phone) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [name.trim(), lower, bcrypt.hashSync(password, 10), role, status, companyName ?? null, phone ?? null],
  );
  await sendEmail(lower, "Welcome to MBONO Recruitment Services",
    status === "pending"
      ? `Hi ${name},\n\nThank you for registering as a recruiter. An administrator will review your account and you will receive an email once it is approved.`
      : `Hi ${name},\n\nWelcome to MBONO Recruitment Services! Complete your profile and upload your CV to start applying for jobs.`);
  if (status === "pending") {
    for (const a of await q("SELECT email FROM users WHERE role = 'admin'"))
      await sendEmail(a.email, "New recruiter awaiting approval", `${name} (${companyName}) registered as a recruiter and is waiting for approval.`);
    return res.status(201).json({ pending: true, message: "Your recruiter account was created and is awaiting admin approval." });
  }
  const auth = { id: user.id, role: user.role as Role, name: user.name, email: user.email };
  res.status(201).json({ token: signToken(auth), user: publicUser(user) });
});

publicRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await one("SELECT * FROM users WHERE email = $1", [String(email ?? "").toLowerCase().trim()]);
  if (!user || !bcrypt.compareSync(String(password ?? ""), user.password_hash)) return res.status(401).json({ error: "Incorrect email or password." });
  if (user.status === "pending") return res.status(403).json({ error: "Your recruiter account is awaiting admin approval." });
  if (user.status === "rejected") return res.status(403).json({ error: "Your recruiter application was not approved. Please contact us." });
  if (user.status === "suspended") return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
  const auth = { id: user.id, role: user.role as Role, name: user.name, email: user.email };
  res.json({ token: signToken(auth), user: publicUser(user) });
});

publicRouter.get("/auth/me", authenticate, async (req, res) => {
  const user = await one("SELECT * FROM users WHERE id = $1", [req.user!.id]);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(publicUser(user));
});

publicRouter.post("/auth/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const user = await one("SELECT * FROM users WHERE id = $1", [req.user!.id]);
  if (!user || !bcrypt.compareSync(String(currentPassword ?? ""), user.password_hash)) return res.status(400).json({ error: "Current password is incorrect." });
  if (!strongPw(newPassword ?? "")) return res.status(400).json({ error: "New password must be at least 8 characters with a letter and a number." });
  await q("UPDATE users SET password_hash = $1 WHERE id = $2", [bcrypt.hashSync(newPassword, 10), user.id]);
  res.json({ ok: true });
});

// ---------- Jobs (public search) ----------
export async function searchJobs(f: { q?: string; type?: string; location?: string; industry?: string; salaryMin?: number; salaryMax?: number; featured?: boolean; includeClosed?: boolean }) {
  const where: string[] = [];
  const p: unknown[] = [];
  const add = (sql: string, v: unknown) => { p.push(v); where.push(sql.replace("?", `$${p.length}`)); };
  if (!f.includeClosed) { add("status = ?", "open"); add("closing_date >= ?", today()); }
  if (f.q) { const like = `%${f.q.toLowerCase()}%`; p.push(like); const i = p.length; where.push(`(LOWER(title) LIKE $${i} OR LOWER(company) LIKE $${i} OR LOWER(description) LIKE $${i} OR LOWER(industry) LIKE $${i})`); }
  if (f.type) add("employment_type = ?", f.type);
  if (f.industry) add("industry = ?", f.industry);
  if (f.location) { const like = `%${f.location.toLowerCase()}%`; p.push(like); const i = p.length; where.push(`(LOWER(location) LIKE $${i} OR LOWER(province) LIKE $${i})`); }
  if (f.salaryMin) add("salary_max >= ?", f.salaryMin);
  if (f.salaryMax) add("salary_min <= ?", f.salaryMax);
  if (f.featured) add("featured = ?", true);
  return q(`SELECT * FROM jobs ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY featured DESC, created_at DESC, id DESC`, p);
}

publicRouter.get("/jobs", async (req, res) => {
  const s = (k: string) => (typeof req.query[k] === "string" && req.query[k] ? String(req.query[k]) : undefined);
  res.json(await searchJobs({
    q: s("q"), type: s("type"), location: s("location"), industry: s("industry"),
    salaryMin: Number(s("salaryMin")) || undefined, salaryMax: Number(s("salaryMax")) || undefined, featured: s("featured") === "true",
  }));
});

publicRouter.get("/jobs/filters", async (_req, res) => {
  const jobs = await q("SELECT employment_type, industry, province, location FROM jobs WHERE status = 'open'");
  const uniq = (k: string) => [...new Set(jobs.map(j => j[k]))].sort();
  res.json({ types: uniq("employment_type"), industries: uniq("industry"), provinces: uniq("province"), locations: uniq("location") });
});

publicRouter.get("/jobs/:id", async (req, res) => {
  const job = await one("SELECT * FROM jobs WHERE id = $1", [Number(req.params.id)]);
  if (!job) return res.status(404).json({ error: "Vacancy not found." });
  res.json(job);
});

// ---------- Site content, stats, contact ----------
publicRouter.get("/content", async (_req, res) => {
  res.json(Object.fromEntries((await q("SELECT key, value FROM site_content")).map(r => [r.key, r.value])));
});

publicRouter.get("/stats", async (_req, res) => {
  const n = async (sql: string) => Number((await one(sql))?.c ?? 0);
  res.json({
    candidates: await n("SELECT COUNT(*) AS c FROM users WHERE role = 'candidate'"),
    companies: await n("SELECT COUNT(*) AS c FROM users WHERE role = 'recruiter' AND status = 'active'"),
    jobs: await n("SELECT COUNT(*) AS c FROM jobs WHERE status = 'open'"),
    placements: await n("SELECT COUNT(*) AS c FROM applications WHERE status IN ('Hired','Offered','Interview')"),
  });
});

publicRouter.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body ?? {};
  if (!name?.trim() || !emailOk(email ?? "") || !message?.trim()) return res.status(400).json({ error: "Please fill in your name, a valid email and a message." });
  await q("INSERT INTO contact_messages (name, email, subject, message) VALUES ($1,$2,$3,$4)", [name, email, subject ?? "", message]);
  await sendEmail(email, "We received your message", `Hi ${name},\n\nThanks for contacting MBONO Recruitment Services. Our team will respond within one business day.`);
  for (const a of await q("SELECT email FROM users WHERE role = 'admin'"))
    await sendEmail(a.email, `New contact message: ${subject || "General"}`, `${name} <${email}> wrote:\n\n${message}`);
  res.status(201).json({ ok: true });
});
