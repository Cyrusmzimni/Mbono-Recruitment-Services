import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { newDb } from "pg-mem";
import { seed } from "./seed.js";

const here = path.dirname(fileURLToPath(import.meta.url));

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };
let pool: Queryable;
export let dbMode: "postgres" | "in-memory" = "in-memory";

/** Run a parameterised SQL query ($1, $2 ...) and return the rows. */
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}
export async function one<T = any>(text: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(text, params))[0];
}

export async function initDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    pool = new pg.Pool({ connectionString: url });
    dbMode = "postgres";
  } else {
    // Zero-setup mode: a PostgreSQL-compatible engine that runs in memory.
    const mem = newDb({ autoCreateForeignKeyIndices: true });
    const { Pool } = mem.adapters.createPg();
    pool = new Pool();
    dbMode = "in-memory";
  }
  const schema = fs.readFileSync(path.join(here, "schema.sql"), "utf8");
  for (const stmt of schema.split(";").map(s => s.trim()).filter(Boolean)) await pool.query(stmt);
  const count = await one<{ c: string }>("SELECT COUNT(*) AS c FROM users");
  if (Number(count?.c ?? 0) === 0) await seed();
  console.log(`[db] connected (${dbMode === "postgres" ? "PostgreSQL" : "in-memory PostgreSQL (pg-mem)"})`);
}

/** Adds an "applicants" count to each job (kept in JS so it works on both PostgreSQL and pg-mem). */
export async function withApplicants<T extends { id: number }>(jobs: T[]) {
  const apps = await q<{ job_id: number }>("SELECT job_id FROM applications");
  const m = new Map<number, number>();
  for (const a of apps) m.set(a.job_id, (m.get(a.job_id) ?? 0) + 1);
  return jobs.map(j => ({ ...j, applicants: m.get(j.id) ?? 0 }));
}
