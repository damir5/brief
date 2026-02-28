export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function chooseLengthTier(text: string): "short" | "medium" | "long" {
  const words = countWords(text);
  if (words < 1200) return "short";
  if (words <= 4000) return "medium";
  return "long";
}

export function chunkText(text: string, chunkWords = 1500, overlapWords = 150): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= chunkWords) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = Math.max(0, end - overlapWords);
  }
  return chunks;
}
