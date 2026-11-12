import { q } from "./db/index.js";

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("en-ZA", { month: "short" }));

const tally = (rows: any[], key: string) => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[key] ?? "").trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export async function recruitmentAnalytics(scopeSql = "TRUE", params: unknown[] = []) {
  const jobs = await q(
    `SELECT j.id, j.industry, j.status, j.closing_date, j.created_at FROM jobs j WHERE ${scopeSql}`,
    params,
  );
  const apps = await q(
    `SELECT a.id, a.candidate_id, a.status, a.created_at, a.updated_at, a.hired_at,
            j.id AS job_id, j.title, j.company, j.created_at AS job_created_at,
            u.name AS candidate_name, u.gender, u.disability_status
     FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.candidate_id
     WHERE ${scopeSql}`,
    params,
  );
  const today = new Date().toISOString().slice(0, 10);
  const jobsByHiringMonth = MONTHS.map((label, month) => ({
    label,
    value: jobs.filter(j => new Date(j.created_at).getMonth() === month).length,
  }));
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({
      label: d.toLocaleString("en-ZA", { month: "short" }),
      value: apps.filter(a => new Date(a.created_at).toISOString().slice(0, 7) === key).length,
    });
  }

  const filledByJob = new Map<number, { start: number; end: number }>();
  for (const a of apps.filter(app => app.status === "Hired")) {
    const start = new Date(a.job_created_at).getTime();
    const end = new Date(a.hired_at ?? a.updated_at).getTime();
    const prior = filledByJob.get(Number(a.job_id));
    if (!prior || end < prior.end) filledByJob.set(Number(a.job_id), { start, end });
  }
  const fillDurations = [...filledByJob.values()].map(({ start, end }) => {
    return (end - start) / 86400000;
  }).filter(days => Number.isFinite(days) && days >= 0);

  const candidateCompanies = new Map<string, { candidate: string; company: string; jobs: Set<number> }>();
  const candidates = new Map<number, any>();
  for (const a of apps) {
    candidates.set(Number(a.candidate_id), a);
    const key = `${a.candidate_id}:${a.company}`;
    const entry = candidateCompanies.get(key) ?? { candidate: a.candidate_name, company: a.company, jobs: new Set<number>() };
    entry.jobs.add(Number(a.job_id));
    candidateCompanies.set(key, entry);
  }

  const peakHiringMonth = jobsByHiringMonth.reduce((peak, month) =>
    month.value > peak.value ? month : peak, { label: "No data", value: 0 });

  return {
    applications: apps.length,
    cvsReceived: apps.length,
    approvals: apps.filter(a => ["Shortlisted", "Offered", "Hired"].includes(a.status)).length,
    rejections: apps.filter(a => a.status === "Rejected").length,
    filledPositions: filledByJob.size,
    averageDaysToFill: fillDurations.length
      ? Math.round(fillDurations.reduce((sum, days) => sum + days, 0) / fillDurations.length * 10) / 10
      : null,
    activeVacancies: jobs.filter(j => j.status === "open" && j.closing_date >= today).length,
    totalJobs: jobs.length,
    applicationsByStatus: tally(apps, "status"),
    applicationsByMonth: months,
    jobsByIndustry: tally(jobs, "industry"),
    jobsByHiringMonth,
    peakHiringMonth: peakHiringMonth.value ? peakHiringMonth.label : "No data",
    demographics: {
      gender: tally([...candidates.values()].map(a => ({ value: a.gender })), "value"),
      disability: tally([...candidates.values()].map(a => ({ value: a.disability_status })), "value"),
    },
    applicationsByCandidateCompany: [...candidateCompanies.values()]
      .map(entry => ({ label: `${entry.candidate} · ${entry.company}`, value: entry.jobs.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  };
}
