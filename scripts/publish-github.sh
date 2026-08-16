#!/usr/bin/env bash
set -euo pipefail

repo_name="${1:-awesome-agentic-engineering}"
description="Production-ready templates, evals, scorecards, and failure modes for shipping AI agents that survive real users."

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not installed. Install gh or use the GitHub web UI."
  exit 1
fi

gh auth status >/dev/null

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already exists:"
  git remote get-url origin
  git push -u origin main
else
  gh repo create "$repo_name" \
    --public \
    --description "$description" \
    --source=. \
    --remote=origin \
    --push
fi

repo_url="$(gh repo view --json url --jq .url)"

echo ""
echo "Published: $repo_url"
echo ""
echo "Recommended topics:"
echo "ai-agent agentic-ai llm evals mcp production scorecard developer-tools prompt-injection ai-engineering"
echo ""
echo "Check stars:"
echo "node bin/star-watch.js $repo_url"
