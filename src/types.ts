export interface SummarizeSourceOptions {
  title: string;
  sourceUrl: string | null;
  sourceType: "web" | "youtube" | "audio";
  instructions: string;
  llmCommand: string;
  text: string;
}

export interface SummaryResult {
  title: string;
  sourceUrl: string | null;
  sourceType: "web" | "youtube" | "audio";
  lengthTier: "short" | "medium" | "long";
  sections: {
    tldr: {
      coreTakeaway: string;
      markdown: string;
    };
    researchBrief: {
      thesis: string;
      markdown: string;
    };
  };
  references: Array<{ label: string; url: string }>;
}
