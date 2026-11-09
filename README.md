# brief

Structured summarization for extracted articles and transcripts.

## Usage

```bash
cat article.md | ./brief summarize --title "Example" --source-url https://example.com
cat transcript.txt | ./brief summarize --title "Episode" --source-type youtube --instructions "focus on product implications"
```

The default output is JSON containing `TLDR` and `Research Brief` sections. Set `BRIEF_LLM_CMD` or pass `--llm-command` to control the LLM backend.

## Podcast mode

```bash
cat transcript.txt | ./brief summarize --mode podcast --title "Episode"
```

Podcast mode expects transcript lines that start with an `[hh:mm:ss]` label, which is what
the local pipeline sends. It returns `{ tldr, key_points, quotes, topics }`, keeps the
labels as `at` (or `null`), and tells the model to leave out chit-chat, pleasantries and
ads. The article mode is unchanged.

## Install

```bash
ln -sf "$(pwd)/brief" ~/.local/bin/brief
```

The wrapper resolves its real location, so it works both from this directory and through a symlink.
