# brief

Structured summarization for extracted articles and transcripts.

## Usage

```bash
cat article.md | ./brief summarize --title "Example" --source-url https://example.com
cat transcript.txt | ./brief summarize --title "Episode" --source-type youtube --instructions "focus on product implications"
```

The default output is JSON containing `TLDR` and `Research Brief` sections. Set `BRIEF_LLM_CMD` or pass `--llm-command` to control the LLM backend.
