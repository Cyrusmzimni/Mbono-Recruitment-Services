import { Router } from "express";
import bcrypt from "bcryptjs";
import { q, one, withApplicants } from "../db/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { notify, sendEmail } from "../email.js";
import { publicUser } from "./public.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorize("admin"));

const count = async (sql: string, p: unknown[] = []) => Number((await one(sql, p))?.c ?? 0);

adminRouter.get("/analytics", async (_req, res) => {
  const users = await q("SELECT role, status, created_at FROM users");
  const jobs = await q("SELECT industry, status, closing_date FROM jobs");
  const apps = await q("SELECT status, created_at FROM applications");
  const by = (rows: any[], k: string) => Object.entries(rows.reduce((m: Record<string, number>, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})).map(([label, value]) => ({ label, value })).sort((a, b) => (b.value as number) - (a.value as number));
  // Applications per month over the last 6 months
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({ label: d.toLocaleString("en-ZA", { month: "short" }), value: apps.filter(a => new Date(a.created_at).toISOString().slice(0, 7) === key).length });
  }
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    totalUsers: users.length,
    totalRecruiters: users.filter(u => u.role === "recruiter").length,
    totalCandidates: users.filter(u => u.role === "candidate").length,
    pendingRecruiters: users.filter(u => u.role === "recruiter" && u.status === "pending").length,
    activeVacancies: jobs.filter(j => j.status === "open" && j.closing_date >= today).length,
    applications: apps.length,
    contactMessages: await count("SELECT COUNT(*) AS c FROM contact_messages"),
    applicationsByStatus: by(apps, "status"),
    jobsByIndustry: by(jobs, "industry"),
    applicationsByMonth: months,
  });
});

// ----- Users / recruiters / candidates -----
adminRouter.get("/users", async (req, res) => {
  const p: unknown[] = []; const w: string[] = [];
  if (req.query.role) { p.push(String(req.query.role)); w.push(`role = $${p.length}`); }
  if (req.query.status) { p.push(String(req.query.status)); w.push(`status = $${p.length}`); }
  if (req.query.q) { p.push(`%${String(req.query.q).toLowerCase()}%`); w.push(`(LOWER(name) LIKE $${p.length} OR LOWER(email) LIKE $${p.length} OR LOWER(COALESCE(company_name,'')) LIKE $${p.length})`); }
  const rows = await q(`SELECT * FROM users ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY created_at DESC, id DESC`, p);
  res.json(rows.map(publicUser));
});

adminRouter.post("/users", async (req, res) => {
  const { name, email, password, role, companyName } = req.body ?? {};
  if (!name || !email || !password || !["admin", "recruiter", "candidate"].includes(role)) return res.status(400).json({ error: "Name, email, password and a valid role are required." });
  if (await one("SELECT id FROM users WHERE email = $1", [String(email).toLowerCase()])) return res.status(409).json({ error: "Email already in use." });
  const u = await one("INSERT INTO users (name, email, password_hash, role, status, company_name) VALUES ($1,$2,$3,$4,'active',$5) RETURNING *",
    [name, String(email).toLowerCase(), bcrypt.hashSync(password, 10), role, companyName ?? null]);
  res.status(201).json(publicUser(u));
});

adminRouter.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.id && (req.body?.role && req.body.role !== "admin" || req.body?.status && req.body.status !== "active"))
    return res.status(400).json({ error: "You cannot demote or suspend your own account." });
  const sets: string[] = []; const vals: unknown[] = [];
  if (req.body?.role) { if (!["admin", "recruiter", "candidate"].includes(req.body.role)) return res.status(400).json({ error: "Invalid role." }); vals.push(req.body.role); sets.push(`role = $${vals.length}`); }
  if (req.body?.status) { if (!["active", "pending", "rejected", "suspended"].includes(req.body.status)) return res.status(400).json({ error: "Invalid status." }); vals.push(req.body.status); sets.push(`status = $${vals.length}`); }
  if (req.body?.name) { vals.push(req.body.name); sets.push(`name = $${vals.length}`); }
  if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
  vals.push(id);
  const u = await one(`UPDATE users SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals);
  if (!u) return res.status(404).json({ error: "User not found." });
  res.json(publicUser(u));
});

adminRouter.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.id) return res.status(400).json({ error: "You cannot delete your own account." });
  await q("DELETE FROM users WHERE id = $1", [id]);
  res.json({ ok: true });
});

adminRouter.post("/recruiters/:id/:decision", async (req, res) => {
  const decision = req.params.decision;
  if (!["approve", "reject"].includes(decision)) return res.status(400).json({ error: "Use approve or reject." });
  const status = decision === "approve" ? "active" : "rejected";
  const u = await one("UPDATE users SET status = $1 WHERE id = $2 AND role = 'recruiter' RETURNING *", [status, Number(req.params.id)]);
  if (!u) return res.status(404).json({ error: "Recruiter not found." });
  if (status === "active") await notify(u.id, u.email, "Recruiter account approved", "Your recruiter account has been approved. You can now sign in and post vacancies.");
  else await sendEmail(u.email, "MBONO Recruitment: recruiter application", `Hi ${u.name},\n\nUnfortunately your recruiter application was not approved. Please contact us for more information.`);
  res.json(publicUser(u));
});

// ----- Vacancies (all) -----
adminRouter.get("/jobs", async (_req, res) => {
  res.json(await withApplicants(await q("SELECT j.*, u.name AS recruiter_name FROM jobs j LEFT JOIN users u ON u.id = j.recruiter_id ORDER BY j.created_at DESC, j.id DESC")));
});

// ----- Reports (CSV) -----
const csv = (rows: any[]) => {
  if (!rows.length) return "No data\n";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k] instanceof Date ? r[k].toISOString() : r[k])).join(","))].join("\n");
};
adminRouter.get("/reports/:type", async (req, res) => {
  const reports: Record<string, string> = {
    users: "SELECT id, name, email, role, status, location, company_name, created_at FROM users ORDER BY id",
    vacancies: "SELECT j.id, j.title, j.company, j.location, j.province, j.employment_type, j.industry, j.salary_min, j.salary_max, j.closing_date, j.status FROM jobs j ORDER BY j.id",
    applications: "SELECT a.id, j.title AS job, j.company, u.name AS candidate, u.email, a.status, a.created_at FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id ORDER BY a.id",
  };
  const sql = reports[req.params.type];
  if (!sql) return res.status(404).json({ error: "Unknown report." });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="mbono-${req.params.type}-report-${new Date().toISOString().slice(0, 10)}.csv"`);
  const rows = await q(sql);
  res.send(csv(req.params.type === "vacancies" ? await withApplicants(rows) : rows));
});

// ----- Website content & system settings -----
adminRouter.put("/content", async (req, res) => {
  for (const [k, v] of Object.entries(req.body ?? {})) {
    if (await one("SELECT key FROM site_content WHERE key = $1", [k])) await q("UPDATE site_content SET value = $1 WHERE key = $2", [String(v), k]);
    else await q("INSERT INTO site_content (key, value) VALUES ($1,$2)", [k, String(v)]);
  }
  res.json(Object.fromEntries((await q("SELECT key, value FROM site_content")).map(r => [r.key, r.value])));
});
adminRouter.get("/settings", async (_req, res) => {
  res.json(Object.fromEntries((await q("SELECT key, value FROM settings")).map(r => [r.key, r.value])));
});
adminRouter.put("/settings", async (req, res) => {
  for (const [k, v] of Object.entries(req.body ?? {})) {
    if (await one("SELECT key FROM settings WHERE key = $1", [k])) await q("UPDATE settings SET value = $1 WHERE key = $2", [String(v), k]);
    else await q("INSERT INTO settings (key, value) VALUES ($1,$2)", [k, String(v)]);
  }
  res.json(Object.fromEntries((await q("SELECT key, value FROM settings")).map(r => [r.key, r.value])));
});

adminRouter.get("/messages", async (_req, res) => res.json(await q("SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC")));
adminRouter.get("/emails", async (_req, res) => res.json(await q("SELECT * FROM email_log ORDER BY created_at DESC, id DESC LIMIT 100")));
