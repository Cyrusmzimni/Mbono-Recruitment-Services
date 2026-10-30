import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { q, one } from "../db/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { makeUpload, uploadDir } from "../uploads.js";
import { notify } from "../email.js";
import { publicUser } from "./public.js";

export const candidateRouter = Router();
candidateRouter.use(authenticate, authorize("candidate"));

const profileFields = ["name", "email", "phone", "location", "headline", "bio", "skills", "experience", "education", "cv_path"];
export const completion = (u: any) => Math.round((profileFields.filter(f => u?.[f] && String(u[f]).trim()).length / profileFields.length) * 100);

candidateRouter.get("/dashboard", async (req, res) => {
  const id = req.user!.id;
  const user = await one("SELECT * FROM users WHERE id = $1", [id]);
  const apps = await q("SELECT a.*, j.title, j.company, j.location FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.candidate_id = $1 ORDER BY a.created_at DESC", [id]);
  const saved = await q("SELECT COUNT(*) AS c FROM saved_jobs WHERE user_id = $1", [id]);
  const interviews = await q(
    "SELECT i.*, j.title, j.company FROM interviews i JOIN applications a ON a.id = i.application_id JOIN jobs j ON j.id = a.job_id WHERE a.candidate_id = $1 ORDER BY i.scheduled_at", [id]);
  const statusCounts: Record<string, number> = {};
  for (const a of apps) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  res.json({ applied: apps.length, saved: Number(saved[0]?.c ?? 0), completion: completion(user), interviews, recent: apps.slice(0, 5), statusCounts });
});

// ----- Profile -----
candidateRouter.get("/profile", async (req, res) => {
  const user = await one("SELECT * FROM users WHERE id = $1", [req.user!.id]);
  const certs = await q("SELECT id, title, file_name, created_at FROM certifications WHERE user_id = $1 ORDER BY id DESC", [req.user!.id]);
  res.json({ ...publicUser(user), completion: completion(user), certifications: certs });
});

candidateRouter.put("/profile", async (req, res) => {
  const allowed = ["name", "phone", "location", "headline", "bio", "skills", "experience", "education"];
  const sets: string[] = []; const vals: unknown[] = [];
  for (const k of allowed) if (k in (req.body ?? {})) { vals.push(String(req.body[k] ?? "").slice(0, 4000)); sets.push(`${k} = $${vals.length}`); }
  if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
  if ("name" in req.body && !String(req.body.name).trim()) return res.status(400).json({ error: "Name is required." });
  vals.push(req.user!.id);
  const user = await one(`UPDATE users SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals);
  res.json({ ...publicUser(user), completion: completion(user) });
});

candidateRouter.post("/cv", (req, res) => {
  makeUpload("cv").single("cv")(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message.includes("too large") ? "File must be 5 MB or smaller." : err.message });
    if (!req.file) return res.status(400).json({ error: "Please choose a CV file." });
    const old = await one("SELECT cv_path FROM users WHERE id = $1", [req.user!.id]);
    if (old?.cv_path) fs.rm(path.join(uploadDir, old.cv_path), () => {});
    const user = await one("UPDATE users SET cv_path = $1, cv_name = $2 WHERE id = $3 RETURNING *", [req.file.filename, req.file.originalname, req.user!.id]);
    res.json({ ...publicUser(user), completion: completion(user) });
  });
});

candidateRouter.delete("/cv", async (req, res) => {
  const old = await one("SELECT cv_path FROM users WHERE id = $1", [req.user!.id]);
  if (old?.cv_path) fs.rm(path.join(uploadDir, old.cv_path), () => {});
  await q("UPDATE users SET cv_path = NULL, cv_name = NULL WHERE id = $1", [req.user!.id]);
  res.json({ ok: true });
});

candidateRouter.post("/certifications", (req, res) => {
  makeUpload("cert").single("file")(req, res, async err => {
    if (err) return res.status(400).json({ error: err.message.includes("too large") ? "File must be 5 MB or smaller." : err.message });
    if (!req.file) return res.status(400).json({ error: "Please choose a file." });
    const title = String(req.body?.title || req.file.originalname).slice(0, 200);
    const cert = await one("INSERT INTO certifications (user_id, title, file_path, file_name) VALUES ($1,$2,$3,$4) RETURNING id, title, file_name, created_at",
      [req.user!.id, title, req.file.filename, req.file.originalname]);
    res.status(201).json(cert);
  });
});

candidateRouter.delete("/certifications/:id", async (req, res) => {
  const c = await one("SELECT * FROM certifications WHERE id = $1 AND user_id = $2", [Number(req.params.id), req.user!.id]);
  if (!c) return res.status(404).json({ error: "Not found." });
  fs.rm(path.join(uploadDir, c.file_path), () => {});
  await q("DELETE FROM certifications WHERE id = $1", [c.id]);
  res.json({ ok: true });
});

// ----- Applications -----
candidateRouter.get("/applications", async (req, res) => {
  res.json(await q(
    "SELECT a.*, j.title, j.company, j.location, j.closing_date FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.candidate_id = $1 ORDER BY a.created_at DESC",
    [req.user!.id]));
});

candidateRouter.post("/applications", async (req, res) => {
  const jobId = Number(req.body?.jobId);
  const job = await one("SELECT * FROM jobs WHERE id = $1", [jobId]);
  if (!job || job.status !== "open") return res.status(404).json({ error: "This vacancy is no longer open." });
  if (job.closing_date < new Date().toISOString().slice(0, 10)) return res.status(400).json({ error: "This vacancy has closed." });
  if (await one("SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2", [jobId, req.user!.id]))
    return res.status(409).json({ error: "You have already applied for this job." });
  const me = await one("SELECT cv_path FROM users WHERE id = $1", [req.user!.id]);
  if (!me?.cv_path) return res.status(400).json({ error: "Please upload your CV in your profile before applying." });
  const app = await one("INSERT INTO applications (job_id, candidate_id, cover_letter) VALUES ($1,$2,$3) RETURNING *", [jobId, req.user!.id, String(req.body?.coverLetter ?? "").slice(0, 4000)]);
  await notify(req.user!.id, req.user!.email, "Application submitted", `Your application for ${job.title} at ${job.company} was received.`);
  if (job.recruiter_id) {
    const r = await one("SELECT id, email FROM users WHERE id = $1", [job.recruiter_id]);
    if (r) await notify(r.id, r.email, "New application", `${req.user!.name} applied for ${job.title}.`);
  }
  res.status(201).json(app);
});

candidateRouter.delete("/applications/:id", async (req, res) => {
  await q("DELETE FROM applications WHERE id = $1 AND candidate_id = $2 AND status = 'Submitted'", [Number(req.params.id), req.user!.id]);
  res.json({ ok: true });
});

candidateRouter.get("/interviews", async (req, res) => {
  res.json(await q(
    "SELECT i.*, j.title, j.company, a.status FROM interviews i JOIN applications a ON a.id = i.application_id JOIN jobs j ON j.id = a.job_id WHERE a.candidate_id = $1 ORDER BY i.scheduled_at",
    [req.user!.id]));
});

// ----- Saved jobs -----
candidateRouter.get("/saved", async (req, res) => {
  res.json(await q("SELECT j.* FROM saved_jobs s JOIN jobs j ON j.id = s.job_id WHERE s.user_id = $1 ORDER BY s.created_at DESC", [req.user!.id]));
});
candidateRouter.post("/saved/:jobId", async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (await one("SELECT job_id FROM saved_jobs WHERE user_id = $1 AND job_id = $2", [req.user!.id, jobId])) {
    await q("DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2", [req.user!.id, jobId]);
    return res.json({ saved: false });
  }
  await q("INSERT INTO saved_jobs (user_id, job_id) VALUES ($1,$2)", [req.user!.id, jobId]);
  res.json({ saved: true });
});
