import { useCallback, useEffect, useState } from "react";
import { api, type Job } from "./api";
import { useAuth } from "./auth";
import { useNavigate } from "react-router-dom";

/** Saved (favourite) jobs for the signed-in candidate. */
export function useSaved() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [ids, setIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (user?.role !== "candidate") { setIds(new Set()); return; }
    api<Job[]>("/candidate/saved").then(j => setIds(new Set(j.map(x => x.id)))).catch(() => {});
  }, [user]);
  const toggle = useCallback(async (job: Job) => {
    if (!user) return nav(`/signin?next=/vacancies`);
    if (user.role !== "candidate") return alert("Only candidates can save jobs.");
    const r = await api<{ saved: boolean }>(`/candidate/saved/${job.id}`, { method: "POST" });
    setIds(prev => { const n = new Set(prev); r.saved ? n.add(job.id) : n.delete(job.id); return n; });
  }, [user, nav]);
  return { ids, toggle };
}
