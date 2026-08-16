# Publication Checklist

Use this when creating the GitHub repository.

## Repository

Name:

```text
awesome-agentic-engineering
```

Description:

```text
Production-ready templates, evals, scorecards, and failure modes for shipping AI agents that survive real users.
```

Visibility:

```text
public
```

Homepage:

```text
https://github.com/<owner>/awesome-agentic-engineering
```

Topics:

```text
ai-agent
agentic-ai
llm
evals
mcp
production
scorecard
developer-tools
prompt-injection
ai-engineering
```

## After Push

- [ ] Confirm README renders correctly.
- [ ] Confirm `assets/scorecard.svg` appears near the top.
- [ ] Confirm GitHub Actions CI starts.
- [ ] Add the topics above. The publish script tries to do this automatically.
- [ ] Pin the repository on the GitHub profile.
- [ ] Create the first three issues:
  - Add real-world production failure cases
  - Add research-agent example
  - Add scorecard badge generator
- [ ] Start star monitoring automation. The publish script writes `.star-watch.json` as the first local snapshot.

## Star Milestones

- 100 stars: first useful signal
- 500 stars: strong niche validation
- 1,000 stars: high-signal portfolio project
- 5,000 stars: category authority

Default monitoring target:

```text
1,000 stars
```

## Publish Command

After GitHub CLI authentication is working:

```bash
scripts/publish-github.sh
```

Or choose a different repository name:

```bash
scripts/publish-github.sh my-repo-name
```

The script also:

- pushes `main`
- applies recommended topics
- creates starter labels
- creates three starter issues if they do not already exist
- records the initial star snapshot with `bin/star-watch.js`
