import { assertEquals } from "@std/assert";
import {
  atSeconds,
  buildPodcastNotesPrompt,
  normalizePodcastSummary,
} from "./podcast.ts";

Deno.test("atSeconds reads the labels the model copies from a transcript", () => {
  assertEquals(atSeconds("01:02:03"), 3723);
  assertEquals(atSeconds("12:34"), 754);
  assertEquals(atSeconds("00:00"), 0);
  assertEquals(atSeconds(null), null);
  assertEquals(atSeconds("later"), null);
  assertEquals(atSeconds("-1:00"), null);
});

Deno.test("normalizePodcastSummary keeps usable points and drops invented labels", () => {
  const summary = normalizePodcastSummary({
    tldr: "  Two findings.  ",
    key_points: [
      { text: "First", at: "00:10:00" },
      { text: "Second", at: "around ten minutes" },
      { text: "", at: "00:20:00" },
      { text: "Third" },
    ],
    quotes: [{ text: "A quote", at: "00:30:00" }],
    topics: ["ai", "", "tools"],
  });
  assertEquals(summary.tldr, "Two findings.");
  assertEquals(summary.keyPoints, [
    { text: "First", at: "00:10:00" },
    { text: "Second", at: null },
    { text: "Third", at: null },
  ]);
  assertEquals(summary.quotes, [{ text: "A quote", at: "00:30:00" }]);
  assertEquals(summary.topics, ["ai", "tools"]);
});

Deno.test("the notes prompt asks for information only and keeps the labels", () => {
  const prompt = buildPodcastNotesPrompt("[00:01:00] Hello", "Show", "", 0, 2);
  assertEquals(prompt.includes("Drop chit-chat"), true);
  assertEquals(prompt.includes("[hh:mm:ss]"), true);
  assertEquals(prompt.includes("Part: 1/2"), true);
});
