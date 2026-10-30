import { Router } from "express";
import { q, one, withApplicants } from "../db/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { notify } from "../email.js";
import { publicUser } from "./public.js";

export const recruiterRouter = Router();
recruiterRouter.use(authenticate, authorize("recruiter", "admin"));

export const STATUSES = ["Submitted", "Under Review", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"];
const jobFields = ["title", "company", "location", "province", "employment_type", "industry", "salary_min", "salary_max", "description", "requirements", "closing_date", "status", "featured"];

/** Admins see everything; recruiters only their own jobs. */
const scope = (req: any, alias = "j") => req.user.role === "admin" ? { sql: "TRUE", p: [] as unknown[] } : { sql: `${alias}.recruiter_id = $1`, p: [req.user.id] };

recruiterRouter.get("/dashboard", async (req, res) => {
  const s = scope(req);
  const jobs = await q(`SELECT j.* FROM jobs j WHERE ${s.sql}`, s.p);
  const apps = await q(`SELECT a.*, j.title, u.name AS candidate_name FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id WHERE ${s.sql} ORDER BY a.created_at DESC`, s.p);
  const interviews = await q(
    `SELECT i.*, j.title, u.name AS candidate_name FROM interviews i JOIN applications a ON a.id = i.application_id JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id WHERE ${s.sql} ORDER BY i.scheduled_at`, s.p);
  const now = new Date().toISOString().slice(0, 16);
  res.json({
    activeJobs: jobs.filter(j => j.status === "open").length,
    totalJobs: jobs.length,
    applications: apps.length,
    shortlisted: apps.filter(a => a.status === "Shortlisted").length,
    upcomingInterviews: interviews.filter(i => i.scheduled_at >= now),
    recent: apps.slice(0, 6),
  });
});

// ----- Vacancies CRUD -----
recruiterRouter.get("/jobs", async (req, res) => {
  const s = scope(req);
  res.json(await withApplicants(await q(`SELECT j.* FROM jobs j WHERE ${s.sql} ORDER BY j.created_at DESC, j.id DESC`, s.p)));
});

function clean(body: any, partial = false) {
  const out: Record<string, unknown> = {};
  for (const k of jobFields) if (k in (body ?? {})) out[k] = body[k];
  if (!partial) for (const k of ["title", "company", "location", "province", "employment_type", "industry", "description", "closing_date"])
    if (!String(out[k] ?? "").trim()) throw new Error(`Please fill in ${k.replace("_", " ")}.`);
  if ("salary_min" in out) out.salary_min = Math.max(0, Number(out.salary_min) || 0);
  if ("salary_max" in out) out.salary_max = Math.max(0, Number(out.salary_max) || 0);
  if (out.salary_min && out.salary_max && Number(out.salary_min) > Number(out.salary_max)) throw new Error("Minimum salary cannot be above maximum salary.");
  if ("featured" in out) out.featured = Boolean(out.featured);
  if ("status" in out && !["open", "closed"].includes(String(out.status))) throw new Error("Status must be open or closed.");
  return out;
}

recruiterRouter.post("/jobs", async (req, res) => {
  try {
    const me = await one("SELECT company_name FROM users WHERE id = $1", [req.user!.id]);
    const d = clean({ company: me?.company_name, ...req.body });
    if (req.user!.role !== "admin") delete d.featured;
    d.recruiter_id = req.user!.id;
    const keys = Object.keys(d);
    const job = await one(`INSERT INTO jobs (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`, Object.values(d));
    res.status(201).json(job);
  } catch (e) { res.status(400).json({ error: (e as Error).message }); }
});

async function ownJob(req: any, id: number) {
  const job = await one("SELECT * FROM jobs WHERE id = $1", [id]);
  if (!job) return null;
  if (req.user.role !== "admin" && job.recruiter_id !== req.user.id) return null;
  return job;
}

recruiterRouter.put("/jobs/:id", async (req, res) => {
  try {
    const job = await ownJob(req, Number(req.params.id));
    if (!job) return res.status(404).json({ error: "Vacancy not found." });
    const d = clean(req.body, true);
    if (req.user!.role !== "admin") delete d.featured;
    const keys = Object.keys(d);
    if (!keys.length) return res.json(job);
    const updated = await one(`UPDATE jobs SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = $${keys.length + 1} RETURNING *`, [...Object.values(d), job.id]);
    res.json(updated);
  } catch (e) { res.status(400).json({ error: (e as Error).message }); }
});

recruiterRouter.delete("/jobs/:id", async (req, res) => {
  const job = await ownJob(req, Number(req.params.id));
  if (!job) return res.status(404).json({ error: "Vacancy not found." });
  await q("DELETE FROM jobs WHERE id = $1", [job.id]);
  res.json({ ok: true });
});

// ----- Applications -----
recruiterRouter.get("/applications", async (req, res) => {
  const s = scope(req);
  const p = [...s.p]; let extra = "";
  if (req.query.jobId) { p.push(Number(req.query.jobId)); extra += ` AND a.job_id = $${p.length}`; }
  if (req.query.status) { p.push(String(req.query.status)); extra += ` AND a.status = $${p.length}`; }
  res.json(await q(
    `SELECT a.*, j.title, j.company, u.name AS candidate_name, u.email AS candidate_email, u.phone AS candidate_phone, u.headline, u.skills, u.location AS candidate_location, u.cv_name, u.id AS candidate_user_id
     FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id WHERE ${s.sql}${extra} ORDER BY a.created_at DESC`, p));
});

async function ownApp(req: any, id: number) {
  const app = await one("SELECT a.*, j.title, j.company, j.recruiter_id, u.email, u.name FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id WHERE a.id = $1", [id]);
  if (!app || (req.user.role !== "admin" && app.recruiter_id !== req.user.id)) return null;
  return app;
}

recruiterRouter.patch("/applications/:id/status", async (req, res) => {
  const status = String(req.body?.status ?? "");
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const app = await ownApp(req, Number(req.params.id));
  if (!app) return res.status(404).json({ error: "Application not found." });
  await q("UPDATE applications SET status = $1, updated_at = now() WHERE id = $2", [status, app.id]);
  await notify(app.candidate_id, app.email, `Application update: ${status}`, `Your application for ${app.title} at ${app.company} is now "${status}".`);
  res.json({ ok: true, status });
});

recruiterRouter.post("/applications/:id/interview", async (req, res) => {
  const { scheduledAt, mode = "Video call", location = "", notes = "" } = req.body ?? {};
  if (!scheduledAt) return res.status(400).json({ error: "Please choose a date and time." });
  const app = await ownApp(req, Number(req.params.id));
  if (!app) return res.status(404).json({ error: "Application not found." });
  const interview = await one("INSERT INTO interviews (application_id, scheduled_at, mode, location, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *", [app.id, scheduledAt, mode, location, notes]);
  await q("UPDATE applications SET status = 'Interview', updated_at = now() WHERE id = $1", [app.id]);
  const when = new Date(scheduledAt).toLocaleString("en-ZA", { dateStyle: "full", timeStyle: "short" });
  await notify(app.candidate_id, app.email, "Interview invitation",
    `You are invited to an interview for ${app.title} at ${app.company}.\nWhen: ${when}\nType: ${mode}${location ? `\nWhere/link: ${location}` : ""}${notes ? `\nNotes: ${notes}` : ""}`);
  res.status(201).json(interview);
});

recruiterRouter.get("/interviews", async (req, res) => {
  const s = scope(req);
  res.json(await q(`SELECT i.*, j.title, u.name AS candidate_name, u.email AS candidate_email FROM interviews i JOIN applications a ON a.id = i.application_id JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id WHERE ${s.sql} ORDER BY i.scheduled_at`, s.p));
});

// ----- Candidate database search -----
recruiterRouter.get("/candidates", async (req, res) => {
  const term = String(req.query.q ?? "").toLowerCase().trim();
  const loc = String(req.query.location ?? "").toLowerCase().trim();
  const p: unknown[] = []; let where = "role = 'candidate' AND status = 'active'";
  if (term) { p.push(`%${term}%`); where += ` AND (LOWER(name) LIKE $${p.length} OR LOWER(COALESCE(skills,'')) LIKE $${p.length} OR LOWER(COALESCE(headline,'')) LIKE $${p.length})`; }
  if (loc) { p.push(`%${loc}%`); where += ` AND LOWER(COALESCE(location,'')) LIKE $${p.length}`; }
  const rows = await q(`SELECT id, name, email, phone, location, headline, skills, experience, education, cv_name, cv_path FROM users WHERE ${where} ORDER BY name`, p);
  res.json(rows.map(r => ({ ...r, has_cv: !!r.cv_path, cv_path: undefined })));
});

// ----- Company profile -----
recruiterRouter.get("/company", async (req, res) => {
  res.json(publicUser(await one("SELECT * FROM users WHERE id = $1", [req.user!.id])));
});
recruiterRouter.put("/company", async (req, res) => {
  const { company_name, company_website, company_industry, company_description, phone, location, name } = req.body ?? {};
  if (!String(company_name ?? "").trim()) return res.status(400).json({ error: "Company name is required." });
  const u = await one(
    "UPDATE users SET company_name = $1, company_website = $2, company_industry = $3, company_description = $4, phone = $5, location = $6, name = COALESCE($7, name) WHERE id = $8 RETURNING *",
    [company_name, company_website ?? "", company_industry ?? "", company_description ?? "", phone ?? "", location ?? "", name || null, req.user!.id]);
  res.json(publicUser(u));
});
