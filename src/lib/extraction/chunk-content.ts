const DEFAULT_CHUNK_SIZE = 16_000;
const DEFAULT_OVERLAP = 2_000;
export const MAX_CHUNKS_PER_PASS = 5;

export function chunkContent(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length && chunks.length < MAX_CHUNKS_PER_PASS) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const breakAt = text.lastIndexOf("\n\n", end);
      if (breakAt > start + chunkSize * 0.5) end = breakAt;
    }

    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks.filter(Boolean);
}

/** Prefer chunks that mention the target card name. */
export function filterChunksForCard(chunks: string[], cardName: string): string[] {
  const tokens = cardName
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((t) => t.length > 3);

  if (tokens.length === 0) return chunks;

  const relevant = chunks.filter((chunk) => {
    const lower = chunk.toLowerCase();
    return tokens.some((t) => lower.includes(t));
  });

  return relevant.length > 0 ? relevant : chunks;
}
