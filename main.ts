#!/usr/bin/env -S deno run -A

import { parseArgs } from "@std/cli/parse-args";
import { summarizeSource } from "./src/summarize.ts";

function usage(): string {
  return [
    "brief - structured source summarization",
    "",
    "Usage:",
    "  brief summarize --title <title> [--source-url <url>] [--source-type web|youtube|audio] [--instructions <text>] [--llm-command <cmd>] [--format json|markdown]",
    "",
    "Reads source text from stdin.",
  ].join("\n");
}

export async function main(cliArgs = Deno.args) {
  const [command, ...argv] = cliArgs;
  if (!command || command === "help" || command === "-h" || command === "--help") {
    console.log(usage());
    Deno.exit(0);
  }

  if (command !== "summarize") {
    console.error(`Unknown command: ${command}`);
    console.error(usage());
    Deno.exit(1);
  }

  const args = parseArgs(argv, {
    string: ["title", "source-url", "source-type", "instructions", "llm-command", "format"],
    default: {
      "source-type": "web",
      format: "json",
      "llm-command": Deno.env.get("BRIEF_LLM_CMD") ?? "picobot agent -m {prompt}",
    },
  });

  const title = args.title;
  if (typeof title !== "string" || !title.trim()) {
    console.error("--title is required");
    Deno.exit(1);
  }

  const body = await new Response(Deno.stdin.readable).text();
  if (!body.trim()) {
    console.error("stdin is empty");
    Deno.exit(1);
  }

  const result = await summarizeSource({
    title,
    sourceUrl: typeof args["source-url"] === "string" ? args["source-url"] : null,
    sourceType: (args["source-type"] as "web" | "youtube" | "audio") ?? "web",
    instructions: typeof args.instructions === "string" ? args.instructions : "",
    llmCommand: String(args["llm-command"]),
    text: body,
  });

  if (args.format === "markdown") {
    console.log(result.sections.tldr.markdown.trim());
    console.log("");
    console.log(result.sections.researchBrief.markdown.trim());
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
