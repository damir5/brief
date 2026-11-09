// LLMs wrap JSON in prose or code fences. Take the first object that parses.
export function extractJsonObject<T>(raw: string): T {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(
    /\s*```$/,
    "",
  );
  const lines = trimmed.split("\n");
  for (let start = 0; start < lines.length; start++) {
    const candidate = lines.slice(start).join("\n").trim();
    if (!candidate.startsWith("{")) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // keep scanning upward
    }
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error("The model did not return JSON");
  }
}
