"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, AlertCircle, Loader2, Globe, Timer } from "lucide-react";

interface CrawlJob {
  id: string;
  status: string;
  method: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
  sourcePage: { id: string; url: string };
}

export default function CrawlJobsPage() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchJobs = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/admin/crawl-jobs" : `/api/admin/crawl-jobs?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setJobs(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    const icons: Record<string, React.ReactNode> = {
      completed: <CheckCircle className="w-3 h-3" />,
      running: <Loader2 className="w-3 h-3 animate-spin" />,
      failed: <AlertCircle className="w-3 h-3" />,
      queued: <Clock className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-muted"}`}>
        {icons[status]} {status}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading crawl jobs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crawl Jobs</h1>
        <p className="text-muted-foreground">{jobs.length} jobs</p>
      </div>

      <div className="flex gap-2">
        {["all", "completed", "running", "failed", "queued"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Source</th>
              <th className="text-left p-3 font-medium">Method</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-2 max-w-sm">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-xs">{j.sourcePage.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-muted font-mono">{j.method}</span>
                </td>
                <td className="p-3">{statusBadge(j.status)}</td>
                <td className="p-3 text-muted-foreground">
                  {j.durationMs ? (
                    <span className="flex items-center gap-1 text-xs"><Timer className="w-3 h-3" />{(j.durationMs / 1000).toFixed(1)}s</span>
                  ) : "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(j.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  {j.error ? (
                    <span className="text-xs text-red-500 truncate block max-w-xs" title={j.error}>{j.error.slice(0, 60)}</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No crawl jobs found</div>
        )}
      </div>
    </div>
  );
}
