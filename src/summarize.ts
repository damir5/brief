import { chooseLengthTier, chunkText } from "./chunk.ts";
import { runPrompt } from "./llm.ts";
import {
  buildNotesPrompt,
  buildSummaryPrompt,
  lengthBudgets,
} from "./prompt.ts";
import { SummarizeSourceOptions, SummaryResult } from "./types.ts";

function collectReferences(
  text: string,
  sourceUrl: string | null,
): Array<{ label: string; url: string }> {
  const urls = Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((match) =>
    match[0]
  );
  const unique = Array.from(
    new Set([...(sourceUrl ? [sourceUrl] : []), ...urls]),
  ).slice(0, 12);
  return unique.map((url, index) => ({
    label: index === 0 && sourceUrl === url
      ? "Original source"
      : `Reference ${index + 1}`,
    url,
  }));
}

function extractJsonPayload(
  raw: string,
): {
  tldr: { coreTakeaway: string; markdown: string };
  researchBrief: { thesis: string; markdown: string };
} {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "")
    .replace(
      /\s*```$/,
      "",
    );
  const lines = trimmed.split("\n");
  for (let start = 0; start < lines.length; start++) {
    const candidate = lines.slice(start).join("\n").trim();
    if (!candidate.startsWith("{")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // keep scanning upward
    }
  }
  return JSON.parse(trimmed);
}

export async function summarizeSource(
  options: SummarizeSourceOptions,
): Promise<SummaryResult> {
  const chunks = chunkText(options.text);
  const notes = [];
  for (let index = 0; index < chunks.length; index++) {
    if (chunks.length === 1) {
      notes.push(chunks[index]);
      continue;
    }
    notes.push(
      await runPrompt(
        options.llmCommand,
        buildNotesPrompt(
          chunks[index],
          options.title,
          options.instructions,
          index,
          chunks.length,
        ),
      ),
    );
  }

  const budgets = lengthBudgets(options.text);
  const rawSummary = await runPrompt(
    options.llmCommand,
    buildSummaryPrompt({
      title: options.title,
      sourceUrl: options.sourceUrl,
      sourceType: options.sourceType,
      instructions: options.instructions,
      tier: budgets.tier,
      notes: notes.join("\n\n---\n\n"),
      tldrWords: budgets.tldrWords,
      briefWords: budgets.briefWords,
    }),
  );
  const summary = extractJsonPayload(rawSummary);

  return {
    title: options.title,
    sourceUrl: options.sourceUrl,
    sourceType: options.sourceType,
    lengthTier: chooseLengthTier(options.text),
    sections: {
      tldr: summary.tldr,
      researchBrief: summary.researchBrief,
    },
    references: collectReferences(options.text, options.sourceUrl),
  };
}
