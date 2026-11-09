import { chooseLengthTier, chunkText } from "./chunk.ts";
import { extractJsonObject } from "./json.ts";
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
  const summary = extractJsonObject<{
    tldr: { coreTakeaway: string; markdown: string };
    researchBrief: { thesis: string; markdown: string };
  }>(rawSummary);

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
