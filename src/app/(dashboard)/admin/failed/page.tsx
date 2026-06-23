"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw, Clock, Globe } from "lucide-react";

interface FailedJob {
  id: string;
  type: "crawl" | "extraction";
  status: string;
  error: string | null;
  createdAt: string;
  sourceUrl: string;
  sourcePageId: string;
  method?: string;
  model?: string;
}

export default function FailedPage() {
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchFailed = useCallback(async () => {
    try {
      const [crawlRes, extractRes] = await Promise.all([
        fetch("/api/admin/crawl-jobs?status=failed"),
        fetch("/api/admin/extractions?status=failed"),
      ]);

      const failedJobs: FailedJob[] = [];

      if (crawlRes.ok) {
        const crawlJobs = await crawlRes.json();
        for (const j of crawlJobs) {
          failedJobs.push({
            id: j.id,
            type: "crawl",
            status: j.status,
            error: j.error,
            createdAt: j.createdAt,
            sourceUrl: j.sourcePage?.url ?? "Unknown",
            sourcePageId: j.sourcePage?.id ?? "",
            method: j.method,
          });
        }
      }

      if (extractRes.ok) {
        const extractJobs = await extractRes.json();
        for (const j of extractJobs) {
          failedJobs.push({
            id: j.id,
            type: "extraction",
            status: j.status,
            error: j.validationErrors,
            createdAt: j.createdAt,
            sourceUrl: j.sourcePage?.url ?? "Unknown",
            sourcePageId: j.sourcePage?.id ?? "",
            model: j.model,
          });
        }
      }

      failedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(failedJobs);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFailed(); }, [fetchFailed]);

  const retryCrawl = async (sourcePageId: string, jobId: string) => {
    setRetrying(jobId);
    try {
      await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePageId }),
      });
      await fetchFailed();
    } catch { /* ignore */ }
    setRetrying(null);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading failed jobs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Failed Jobs</h1>
        <p className="text-muted-foreground">{jobs.length} failed jobs</p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center border rounded-lg">
          <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium">No Failures</h3>
          <p className="text-muted-foreground mt-1">All jobs completed successfully.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="border border-red-200 dark:border-red-900 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.type === "crawl" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"}`}>
                      {j.type}
                    </span>
                    {j.method && <span className="text-xs font-mono text-muted-foreground">{j.method}</span>}
                    {j.model && <span className="text-xs font-mono text-muted-foreground">{j.model}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm truncate max-w-md">{j.sourceUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {new Date(j.createdAt).toLocaleString()}
                  </div>
                </div>
                {j.type === "crawl" && (
                  <button
                    onClick={() => retryCrawl(j.sourcePageId, j.id)}
                    disabled={retrying === j.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${retrying === j.id ? "animate-spin" : ""}`} />
                    {retrying === j.id ? "Retrying..." : "Retry"}
                  </button>
                )}
              </div>

              {j.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded text-xs text-red-700 dark:text-red-300 font-mono overflow-auto max-h-32">
                  {j.error.length > 300 ? j.error.slice(0, 300) + "..." : j.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
