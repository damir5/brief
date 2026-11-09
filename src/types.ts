export interface SummarizeSourceOptions {
  title: string;
  sourceUrl: string | null;
  sourceType: "web" | "youtube" | "audio";
  instructions: string;
  llmCommand: string;
  text: string;
}

export interface PodcastSummaryOptions {
  title: string;
  sourceUrl: string | null;
  instructions: string;
  llmCommand: string;
  // Transcript lines, each starting with its [hh:mm:ss] label.
  text: string;
}

export interface PodcastSummaryPoint {
  text: string;
  at: string | null;
}

export interface PodcastSummary {
  tldr: string;
  keyPoints: PodcastSummaryPoint[];
  quotes: PodcastSummaryPoint[];
  topics: string[];
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
