"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  Hash,
  AlertCircle,
  CheckCircle,
  Cpu,
  FileText,
} from "lucide-react";

interface SourcePage {
  id: string;
  url: string;
  pageType: string;
  status: string;
  lastCrawledAt: string | null;
  extractedAt: string | null;
  contentHash: string | null;
  bankId: string | null;
  createdAt: string;
  _count?: { crawlJobs: number; extractionJobs: number };
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourcePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newPageType, setNewPageType] = useState("card_page");
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sources");
      if (res.ok) setSources(await res.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const triggerCrawl = async (sourcePageId: string) => {
    setCrawling(sourcePageId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePageId }),
      });
      const data = await res.json();
      if (res.ok) {
        const warning = data.warning as string | undefined;
        setMessage({
          type: warning ? "error" : "success",
          text: warning
            ? `Crawled ${data.contentLength?.toLocaleString() ?? 0} chars but content looks unusable: ${warning}`
            : `Crawled ${data.contentLength?.toLocaleString() ?? 0} chars in ${(data.durationMs / 1000).toFixed(1)}s. Now click Extract.`,
        });
        await fetchSources();
      } else {
        setMessage({ type: "error", text: data.error ?? "Crawl failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Crawl request failed" });
    }
    setCrawling(null);
  };

  const triggerExtract = async (sourcePageId: string) => {
    setExtracting(sourcePageId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePageId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Extraction ${data.status}: ${data.summary}. View in Extractions.`,
        });
        await fetchSources();
      } else {
        setMessage({ type: "error", text: data.error ?? "Extraction failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Extraction request failed" });
    }
    setExtracting(null);
  };

  const addSource = async () => {
    if (!newUrl) return;
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, pageType: newPageType }),
      });
      if (res.ok) {
        setNewUrl("");
        setShowAddForm(false);
        await fetchSources();
        setMessage({ type: "success", text: "Source added. Click Crawl, then Extract." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to add source" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add source" });
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "crawled":
        return <CheckCircle className="size-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="size-4 text-red-500" />;
      default:
        return <Clock className="size-4 text-yellow-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading sources...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Source Pages</h1>
          <p className="text-muted-foreground">
            {sources.length} sources · Crawl downloads content, Extract parses it with AI
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> Add Source
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {message.text}
          {message.type === "success" && (
            <Link href="/admin/extractions" className="ml-2 font-medium underline">
              Go to Extractions
            </Link>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/50 p-4">
          <div className="min-w-[280px] flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">URL</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.bank.com/credit-card/..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Page type</label>
            <select
              value={newPageType}
              onChange={(e) => setNewPageType(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="card_page">Card page (one card)</option>
              <option value="listing_page">Listing page (multiple cards)</option>
              <option value="offers">Offers page</option>
            </select>
          </div>
          <button onClick={addSource} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            Add
          </button>
          <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-muted-foreground">
            Cancel
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">URL</th>
              <th className="p-3 text-left font-medium">Type</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Crawls</th>
              <th className="p-3 text-left font-medium">Extractions</th>
              <th className="p-3 text-left font-medium">Last Crawled</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((s) => {
              const canExtract = s.status === "crawled";
              return (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex max-w-md items-center gap-2">
                      <Globe className="size-4 shrink-0 text-muted-foreground" />
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-primary"
                      >
                        {s.url.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">{s.pageType}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(s.status)}
                      <span className="capitalize">{s.status}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{s._count?.crawlJobs ?? 0}</td>
                  <td className="p-3 text-muted-foreground">{s._count?.extractionJobs ?? 0}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {s.lastCrawledAt ? new Date(s.lastCrawledAt).toLocaleString() : "Never"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => triggerCrawl(s.id)}
                        disabled={crawling === s.id || extracting === s.id}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:opacity-50"
                        title="Download page content"
                      >
                        <RefreshCw className={`size-3 ${crawling === s.id ? "animate-spin" : ""}`} />
                        Crawl
                      </button>
                      <button
                        onClick={() => triggerExtract(s.id)}
                        disabled={!canExtract || extracting === s.id || crawling === s.id}
                        className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-700 hover:bg-violet-500/20 disabled:opacity-50 dark:text-violet-300"
                        title={canExtract ? "Run AI extraction" : "Crawl first"}
                      >
                        <Cpu className={`size-3 ${extracting === s.id ? "animate-pulse" : ""}`} />
                        {extracting === s.id ? "Extracting..." : "Extract"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sources.length === 0 && (
          <div className="space-y-2 p-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 size-10 opacity-40" />
            <p>No sources yet. Click <strong>Add Source</strong> above, then use <strong>Crawl</strong> in the Actions column.</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Pipeline</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li><strong>Crawl</strong> — downloads and cleans page text</li>
          <li><strong>Card page</strong> — one card, full details (benefits, rewards, redemption, partners)</li>
          <li><strong>Listing page</strong> — discovers multiple cards, deep-extracts each (up to 8)</li>
          <li><strong>Offers page</strong> — merchant offers only</li>
          <li><strong>Admin → Extractions</strong> — review JSON and Approve to publish to Explore/Cards</li>
        </ol>
      </div>
    </div>
  );
}
