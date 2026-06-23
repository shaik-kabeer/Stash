"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, RefreshCw, Plus, ExternalLink, Clock, Hash, AlertCircle, CheckCircle } from "lucide-react";

interface SourcePage {
  id: string;
  url: string;
  pageType: string;
  status: string;
  lastCrawledAt: string | null;
  contentHash: string | null;
  bankId: string | null;
  createdAt: string;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourcePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sources");
      if (res.ok) setSources(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const triggerCrawl = async (sourcePageId: string) => {
    setCrawling(sourcePageId);
    try {
      const res = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePageId }),
      });
      if (res.ok) {
        await fetchSources();
      }
    } catch { /* ignore */ }
    setCrawling(null);
  };

  const addSource = async () => {
    if (!newUrl) return;
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      if (res.ok) {
        setNewUrl("");
        setShowAddForm(false);
        await fetchSources();
      }
    } catch { /* ignore */ }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "crawled": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading sources...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Source Pages</h1>
          <p className="text-muted-foreground">{sources.length} sources configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Source
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://www.bank.com/credit-card/..."
            className="flex-1 px-3 py-2 bg-background border rounded-lg text-sm" />
          <button onClick={addSource} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Add</button>
          <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Last Crawled</th>
              <th className="text-left p-3 font-medium">Hash</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-2 max-w-md">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">
                      {s.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-muted">{s.pageType}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(s.status)}
                    <span className="capitalize">{s.status}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {s.lastCrawledAt ? new Date(s.lastCrawledAt).toLocaleDateString() : "Never"}
                </td>
                <td className="p-3">
                  {s.contentHash ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Hash className="w-3 h-3" />{s.contentHash.slice(0, 8)}
                    </span>
                  ) : "—"}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => triggerCrawl(s.id)}
                    disabled={crawling === s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${crawling === s.id ? "animate-spin" : ""}`} />
                    {crawling === s.id ? "Crawling..." : "Crawl"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
