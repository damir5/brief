function shellEscape(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export async function runPrompt(llmCommand: string, prompt: string): Promise<string> {
  const promptFile = await Deno.makeTempFile({ prefix: "brief-prompt-", suffix: ".txt" });
  try {
    await Deno.writeTextFile(promptFile, prompt);
    const expanded = llmCommand
      .replaceAll("{prompt_file}", shellEscape(promptFile))
      .replaceAll("{prompt}", shellEscape(prompt));
    const command = expanded.includes("{prompt}") || expanded.includes("{prompt_file}")
      ? expanded
      : `${expanded} ${shellEscape(prompt)}`;

    const result = await new Deno.Command("/bin/sh", {
      args: ["-lc", command],
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!result.success) {
      const stderr = new TextDecoder().decode(result.stderr).trim();
      throw new Error(`LLM command failed: ${stderr}`);
    }
    return new TextDecoder().decode(result.stdout).trim();
  } finally {
    try {
      await Deno.remove(promptFile);
    } catch {
      // ignore temp cleanup failures
    }
  }
}
