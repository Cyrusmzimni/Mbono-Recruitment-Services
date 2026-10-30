import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type Role = "admin" | "recruiter" | "candidate";
export interface AuthUser { id: number; role: Role; name: string; email: string }
declare global { namespace Express { interface Request { user?: AuthUser } } }

const secret = () => process.env.JWT_SECRET || "dev-only-secret-change-me";

export function signToken(u: AuthUser) {
  return jwt.sign(u, secret(), { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any });
}

/** Verifies the Bearer JWT and attaches req.user. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Please sign in." });
  try {
    const p = jwt.verify(h.slice(7), secret()) as AuthUser;
    req.user = { id: p.id, role: p.role, name: p.name, email: p.email };
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

/** Role-based access control: only the listed roles may continue. */
export const authorize = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to do this." });
  next();
};
