"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

interface ExtractionJob {
  id: string;
  status: string;
  model: string | null;
  extractedData: string | null;
  validationErrors: string | null;
  createdAt: string;
  sourcePage: { id: string; url: string };
}

export default function ValidationQueuePage() {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/extractions?status=completed");
      if (res.ok) {
        const all: ExtractionJob[] = await res.json();
        setJobs(all.filter((j) => j.validationErrors));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const approve = async (id: string) => {
    await fetch(`/api/admin/extractions/${id}/approve`, { method: "POST" });
    await fetchJobs();
  };

  const reject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    await fetch(`/api/admin/extractions/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    await fetchJobs();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading validation queue...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validation Queue</h1>
        <p className="text-muted-foreground">{jobs.length} extractions needing review</p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center border rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium">All Clear</h3>
          <p className="text-muted-foreground mt-1">No extractions need validation right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => {
            let warnings: string[] = [];
            let errors: string[] = [];
            try {
              const parsed = JSON.parse(j.validationErrors || "{}");
              warnings = parsed.warnings || [];
              errors = parsed.errors || [];
            } catch { /* ignore */ }

            return (
              <div key={j.id} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium truncate max-w-lg">{j.sourcePage.url.replace(/^https?:\/\/(www\.)?/, "")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(j.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approve(j.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => reject(j.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                      <button onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
                        className="p-1.5 rounded-md hover:bg-muted"><Eye className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                          <XCircle className="w-3 h-3 mt-0.5 shrink-0" /> {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {expandedId === j.id && j.extractedData && (
                  <div className="border-t p-4 bg-muted/20">
                    <pre className="text-xs font-mono bg-background p-3 rounded overflow-auto max-h-80">
                      {JSON.stringify(JSON.parse(j.extractedData), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
