import { createHash } from "crypto";

export interface ChangeResult {
  changed: boolean;
  oldHash: string | null;
  newHash: string;
  contentLength: number;
}

export function computeContentHash(content: string): string {
  const normalized = content
    .replace(/\s+/g, " ")
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, "[DATE]")
    .trim();
  return createHash("sha256").update(normalized).digest("hex");
}

export function detectChange(newContent: string, existingHash: string | null): ChangeResult {
  const newHash = computeContentHash(newContent);
  return {
    changed: existingHash !== newHash,
    oldHash: existingHash,
    newHash,
    contentLength: newContent.length,
  };
}

export function shouldExtract(changeResult: ChangeResult, lastExtractedAt: Date | null): boolean {
  if (changeResult.changed) return true;

  if (!lastExtractedAt) return true;

  const daysSinceExtraction = (Date.now() - lastExtractedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceExtraction > 7) return true;

  return false;
}
