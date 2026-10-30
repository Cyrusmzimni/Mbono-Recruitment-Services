import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { q, one } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import { uploadDir } from "../uploads.js";

/** Routes for any signed-in user: notifications and secure file downloads. */
export const commonRouter = Router();
commonRouter.use(authenticate);

commonRouter.get("/notifications", async (req, res) => {
  res.json(await q("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 30", [req.user!.id]));
});
commonRouter.post("/notifications/read", async (req, res) => {
  await q("UPDATE notifications SET is_read = true WHERE user_id = $1", [req.user!.id]);
  res.json({ ok: true });
});

// CVs: the candidate themself, recruiters and admins may download.
commonRouter.get("/files/cv/:userId", async (req, res) => {
  const uid = Number(req.params.userId);
  if (req.user!.role === "candidate" && req.user!.id !== uid) return res.status(403).json({ error: "Not allowed." });
  const u = await one("SELECT cv_path, cv_name FROM users WHERE id = $1", [uid]);
  const file = u?.cv_path && path.join(uploadDir, path.basename(u.cv_path));
  if (!file || !fs.existsSync(file)) return res.status(404).json({ error: "CV not found." });
  res.download(file, u.cv_name);
});

commonRouter.get("/files/cert/:id", async (req, res) => {
  const c = await one("SELECT * FROM certifications WHERE id = $1", [Number(req.params.id)]);
  if (!c || (req.user!.role === "candidate" && c.user_id !== req.user!.id)) return res.status(404).json({ error: "File not found." });
  const file = path.join(uploadDir, path.basename(c.file_path));
  if (!fs.existsSync(file)) return res.status(404).json({ error: "File not found." });
  res.download(file, c.file_name);
});
