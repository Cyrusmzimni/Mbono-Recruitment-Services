import { BarChart3, FileText, ThumbsDown, ThumbsUp, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Alert, Bars, Columns, Spinner, StatCard } from "../../components/ui";
import { PageHead } from "./Shell";

export function AnalyticsBreakdown({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="CVs received" value={data.cvsReceived} icon={FileText} tone="blue" />
        <StatCard label="Approvals" value={data.approvals} icon={ThumbsUp} tone="violet" hint="Shortlisted, offered or hired" />
        <StatCard label="Rejections" value={data.rejections} icon={ThumbsDown} tone="rose" />
        <StatCard label="Avg. time to fill" value={data.averageDaysToFill == null ? "—" : `${data.averageDaysToFill} days`} icon={Timer} hint={`${data.filledPositions} positions filled`} />
        <StatCard label="Peak hiring month" value={data.peakHiringMonth} icon={BarChart3} tone="amber" hint="Based on vacancy posting dates" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6"><h2 className="mb-5 font-semibold">Vacancies posted by month</h2><Columns data={data.jobsByHiringMonth} /></div>
        <div className="card p-6"><h2 className="mb-5 font-semibold">Applications by status</h2><Bars data={data.applicationsByStatus} color="bg-violet-600" /></div>
        <div className="card p-6"><h2 className="mb-5 font-semibold">Candidate gender (voluntary)</h2><Bars data={data.demographics.gender} color="bg-sky-600" /></div>
        <div className="card p-6"><h2 className="mb-5 font-semibold">Candidate disability status (voluntary)</h2><Bars data={data.demographics.disability} color="bg-amber-600" /></div>
        <div className="card p-6 xl:col-span-2">
          <h2 className="mb-5 font-semibold">Jobs applied for by candidate and company</h2>
          <Bars data={data.applicationsByCandidateCompany} color="bg-brand-600" />
        </div>
      </div>
    </div>
  );
}

export default function RecruiterAnalytics() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/recruiter/analytics").then(setData).catch(e => setError((e as Error).message)); }, []);
  return (
    <>
      <PageHead title="Hiring analytics" sub="Recruitment outcomes and candidate trends for your vacancies." />
      {error ? <Alert>{error}</Alert> : data ? <AnalyticsBreakdown data={data} /> : <Spinner />}
    </>
  );
}
