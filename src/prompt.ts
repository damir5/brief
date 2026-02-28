import { countWords } from "./chunk.ts";

export function buildNotesPrompt(
  chunk: string,
  title: string,
  instructions: string,
  index: number,
  total: number,
): string {
  return [
    "You are preparing source notes for a later synthesis step.",
    "Be factual and concise.",
    `Title: ${title}`,
    `Chunk: ${index + 1}/${total}`,
    instructions ? `Extra instructions: ${instructions}` : "",
    "",
    "Return markdown with these headings only:",
    "## Claims",
    "## Evidence",
    "## References",
    "## Open Questions",
    "",
    chunk,
  ].filter(Boolean).join("\n");
}

export function buildSummaryPrompt(params: {
  title: string;
  sourceUrl: string | null;
  sourceType: string;
  instructions: string;
  tier: "short" | "medium" | "long";
  notes: string;
  tldrWords: string;
  briefWords: string;
}): string {
  return [
    "Summarize the source into two sections: TLDR and Research Brief.",
    "Return valid JSON with this exact shape:",
    '{"tldr":{"coreTakeaway":"...","markdown":"..."},"researchBrief":{"thesis":"...","markdown":"..."}}',
    "The markdown must preserve headings and bullets.",
    "Do not wrap the JSON in code fences.",
    `Title: ${params.title}`,
    `Source type: ${params.sourceType}`,
    params.sourceUrl ? `Source URL: ${params.sourceUrl}` : "",
    `Length tier: ${params.tier}`,
    `TLDR target length: ${params.tldrWords}`,
    `Research Brief target length: ${params.briefWords}`,
    params.instructions ? `Extra instructions: ${params.instructions}` : "",
    "",
    "TLDR must include: ## TLDR, ### Core takeaway, ### Key points, and ### Why it matters for medium/long sources.",
    "Research Brief must include: ## Research Brief, ### Thesis, ### Claims and evidence, ### Caveats / limits, ### Notable references, ### Open questions.",
    "",
    params.notes,
  ].filter(Boolean).join("\n");
}

export function lengthBudgets(text: string): {
  tier: "short" | "medium" | "long";
  tldrWords: string;
  briefWords: string;
} {
  const words = countWords(text);
  if (words < 1200) {
    return { tier: "short", tldrWords: "120-180 words", briefWords: "400-700 words" };
  }
  if (words <= 4000) {
    return { tier: "medium", tldrWords: "220-350 words", briefWords: "700-1200 words" };
  }
  return { tier: "long", tldrWords: "400-600 words", briefWords: "1200-1800 words" };
}
