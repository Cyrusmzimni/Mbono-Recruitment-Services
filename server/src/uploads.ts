import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

export const uploadDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowed: Record<string, string[]> = {
  cv: [".pdf", ".doc", ".docx"],
  cert: [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"],
};

export const makeUpload = (kind: "cv" | "cert") => multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${kind}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed[kind].includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error(`Allowed file types: ${allowed[kind].join(", ")}`));
  },
});
