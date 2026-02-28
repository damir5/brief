import { assertEquals } from "@std/assert";
import { chooseLengthTier, chunkText, countWords } from "./chunk.ts";
import { lengthBudgets } from "./prompt.ts";

Deno.test("countWords counts whitespace-delimited words", () => {
  assertEquals(countWords("a b  c"), 3);
});

Deno.test("chooseLengthTier follows thresholds", () => {
  assertEquals(chooseLengthTier("word ".repeat(100)), "short");
  assertEquals(chooseLengthTier("word ".repeat(2000)), "medium");
  assertEquals(chooseLengthTier("word ".repeat(5000)), "long");
});

Deno.test("chunkText splits large inputs with overlap", () => {
  const chunks = chunkText("word ".repeat(4000), 1500, 150);
  assertEquals(chunks.length > 1, true);
});

Deno.test("lengthBudgets return per-tier targets", () => {
  assertEquals(lengthBudgets("word ".repeat(800)).tier, "short");
  assertEquals(lengthBudgets("word ".repeat(2000)).tier, "medium");
  assertEquals(lengthBudgets("word ".repeat(5000)).tier, "long");
});
