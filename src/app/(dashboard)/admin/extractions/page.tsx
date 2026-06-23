"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, Clock, Eye, ThumbsUp, ThumbsDown, Cpu } from "lucide-react";

interface ExtractionJob {
  id: string;
  status: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  extractedData: string | null;
  validationErrors: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  sourcePage: { id: string; url: string };
}

export default function ExtractionsPage() {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/extractions");
      if (res.ok) setJobs(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const approveJob = async (id: string) => {
    try {
      await fetch(`/api/admin/extractions/${id}/approve`, { method: "POST" });
      await fetchJobs();
    } catch { /* ignore */ }
  };

  const rejectJob = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await fetch(`/api/admin/extractions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await fetchJobs();
    } catch { /* ignore */ }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      rejected: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-muted"}`}>{status}</span>;
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading extractions...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Extraction Jobs</h1>
        <p className="text-muted-foreground">{jobs.length} extractions</p>
      </div>

      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <Cpu className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{j.sourcePage.url.replace(/^https?:\/\/(www\.)?/, "")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusBadge(j.status)}
                    {j.model && <span className="text-xs text-muted-foreground font-mono">{j.model}</span>}
                    {j.promptTokens && (
                      <span className="text-xs text-muted-foreground">{j.promptTokens + (j.completionTokens ?? 0)} tokens</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {j.status === "completed" && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); approveJob(j.id); }}
                      className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900 text-green-600" title="Approve">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); rejectJob(j.id); }}
                      className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-600" title="Reject">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </>
                )}
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {expandedId === j.id && j.extractedData && (
              <div className="border-t p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Extracted Data</h4>
                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-80 font-mono">
                  {JSON.stringify(JSON.parse(j.extractedData), null, 2)}
                </pre>
                {j.validationErrors && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-orange-600 mb-1">Validation Issues</h4>
                    <pre className="text-xs bg-orange-50 dark:bg-orange-950 p-3 rounded overflow-auto max-h-40 font-mono">
                      {JSON.stringify(JSON.parse(j.validationErrors), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border rounded-lg">
            No extraction jobs yet. Crawl pages first, then run the extract CLI.
          </div>
        )}
      </div>
    </div>
  );
}
