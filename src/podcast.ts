import { chunkText } from "./chunk.ts";
import { extractJsonObject } from "./json.ts";
import { runPrompt } from "./llm.ts";
import { PodcastSummary, PodcastSummaryOptions } from "./types.ts";

// Transcripts arrive as "[hh:mm:ss] text" lines, so the model can copy a label instead of
// doing arithmetic. A label it invents is dropped rather than trusted.
const LABEL = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/;

export function atSeconds(at: string | null): number | null {
  if (!at) return null;
  const parts = at.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function buildPodcastNotesPrompt(
  chunk: string,
  title: string,
  instructions: string,
  index: number,
  total: number,
): string {
  return [
    "You are taking notes on one part of a podcast transcript for a later summary.",
    "Keep only what carries information: claims, findings, numbers, names, products, recommendations, decisions, disagreements.",
    "Drop chit-chat, greetings, pleasantries, ads and sponsor reads, banter, and repeated small talk.",
    "Start every bullet with the [hh:mm:ss] label of the line it comes from, copied exactly.",
    `Episode: ${title}`,
    `Part: ${index + 1}/${total}`,
    instructions ? `Extra instructions: ${instructions}` : "",
    "",
    "Return markdown bullets only, each starting with its label. No preamble.",
    "",
    chunk,
  ].filter(Boolean).join("\n");
}

export function buildPodcastSummaryPrompt(params: {
  title: string;
  sourceUrl: string | null;
  instructions: string;
  notes: string;
}): string {
  return [
    "Summarize a podcast episode for someone who has not listened to it.",
    "Use only the notes below. Leave out chit-chat, pleasantries and ads completely; never mention them.",
    "Return valid JSON with this exact shape:",
    '{"tldr":"...","key_points":[{"text":"...","at":"hh:mm:ss"}],"quotes":[{"text":"...","at":"hh:mm:ss"}],"topics":["..."]}',
    "tldr: 2-3 sentences with the main point of the episode.",
    "key_points: 5-10 of the most important points or findings, most important first, one sentence each.",
    "at: a [hh:mm:ss] label copied from the notes where that point is discussed, or null when there is none.",
    "quotes: up to 3 short verbatim quotes worth remembering, or an empty array.",
    "topics: up to 5 short topic labels.",
    "Do not wrap the JSON in code fences.",
    `Episode: ${params.title}`,
    params.sourceUrl ? `Source: ${params.sourceUrl}` : "",
    params.instructions ? `Extra instructions: ${params.instructions}` : "",
    "",
    params.notes,
  ].filter(Boolean).join("\n");
}

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

function timed(value: unknown, max: number): { text: string; at: string | null }[] {
  if (!Array.isArray(value)) return [];
  const rows: { text: string; at: string | null }[] = [];
  for (const item of value) {
    const body = text((item as { text?: unknown })?.text, 500);
    if (!body) continue;
    const label = text((item as { at?: unknown })?.at, 12);
    rows.push({ text: body, at: label && LABEL.test(`[${label}]`) ? label : null });
    if (rows.length >= max) break;
  }
  return rows;
}

export function normalizePodcastSummary(raw: unknown): PodcastSummary {
  const value = (raw ?? {}) as Record<string, unknown>;
  const topics = Array.isArray(value.topics)
    ? value.topics.map((t) => text(t, 60)).filter((t): t is string => !!t).slice(0, 5)
    : [];
  return {
    tldr: text(value.tldr, 2000) ?? "",
    keyPoints: timed(value.key_points, 10),
    quotes: timed(value.quotes, 3),
    topics,
  };
}

export async function summarizePodcast(
  options: PodcastSummaryOptions,
): Promise<PodcastSummary> {
  const chunks = chunkText(options.text);
  const notes: string[] = [];
  for (let index = 0; index < chunks.length; index++) {
    if (chunks.length === 1) {
      notes.push(chunks[index]);
      continue;
    }
    notes.push(
      await runPrompt(
        options.llmCommand,
        buildPodcastNotesPrompt(
          chunks[index],
          options.title,
          options.instructions,
          index,
          chunks.length,
        ),
      ),
    );
  }
  const raw = await runPrompt(
    options.llmCommand,
    buildPodcastSummaryPrompt({
      title: options.title,
      sourceUrl: options.sourceUrl,
      instructions: options.instructions,
      notes: notes.join("\n\n---\n\n"),
    }),
  );
  return normalizePodcastSummary(extractJsonObject(raw));
}
