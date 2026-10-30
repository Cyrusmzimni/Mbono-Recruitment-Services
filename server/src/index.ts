import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb, dbMode } from "./db/index.js";
import { publicRouter } from "./routes/public.js";
import { candidateRouter } from "./routes/candidate.js";
import { recruiterRouter } from "./routes/recruiter.js";
import { adminRouter } from "./routes/admin.js";
import { commonRouter } from "./routes/common.js";
import { chatRouter } from "./routes/chat.js";

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Brute-force protection on auth and chat endpoints.
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { error: "Too many sign-in attempts. Please try again later." } }));
app.use("/api/chat", rateLimit({ windowMs: 60 * 1000, limit: 30, message: { error: "Too many messages. Please slow down." } }));

app.get("/api/health", (_req, res) => res.json({ ok: true, db: dbMode }));
app.use("/api", publicRouter);
app.use("/api", chatRouter);
app.use("/api/candidate", candidateRouter);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/admin", adminRouter);
app.use("/api", commonRouter);

// Serve the React frontend in production
app.use(express.static(clientDist));

// Handle frontend routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const port = Number(process.env.PORT || 5000);
initDb().then(() => {
  app.listen(port, () => {
    console.log(`\n  MBONO Recruitment API running on http://localhost:${port}`);
    console.log("  Demo accounts: admin@mbono.co.za / Admin@123 | recruiter@mbono.co.za / Recruiter@123 | candidate@mbono.co.za / Candidate@123\n");
  });
}).catch(e => { console.error("Failed to start:", e); process.exit(1); });
