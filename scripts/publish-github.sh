#!/usr/bin/env bash
set -euo pipefail

repo_name="${1:-awesome-agentic-engineering}"
description="Production-ready templates, evals, scorecards, and failure modes for shipping AI agents that survive real users."
topics=(
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
)

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
name_with_owner="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "Configuring repository topics..."
topic_flags=()
for topic in "${topics[@]}"; do
  topic_flags+=(--add-topic "$topic")
done

if ! gh repo edit "$name_with_owner" "${topic_flags[@]}" >/dev/null; then
  echo "Warning: Could not set topics automatically. Add them manually from PUBLICATION.md."
fi

echo "Ensuring starter labels exist..."
gh label create "failure-case" --repo "$name_with_owner" --color "d73a4a" --description "Real AI agent production failure case" --force >/dev/null
gh label create "resource" --repo "$name_with_owner" --color "0075ca" --description "Useful resource or reference" --force >/dev/null
gh label create "good first issue" --repo "$name_with_owner" --color "7057ff" --description "Good for first-time contributors" --force >/dev/null
gh label create "growth" --repo "$name_with_owner" --color "0e8a16" --description "Launch and distribution work" --force >/dev/null

create_issue_once() {
  local title="$1"
  local label="$2"
  local body="$3"

  if gh issue list --repo "$name_with_owner" --state all --search "$title in:title" --json title --jq '.[].title' | grep -Fxq "$title"; then
    echo "Issue already exists: $title"
    return
  fi

  gh issue create --repo "$name_with_owner" --title "$title" --body "$body" --label "$label" >/dev/null
  echo "Created issue: $title"
}

create_issue_once \
  "Add real-world production failure cases" \
  "failure-case" \
  "Collect short, practical failure cases using the format in CONTRIBUTING.md. Good first cases: silent failure, memory drift, prompt injection, tool abuse, and cost explosion."

create_issue_once \
  "Add research-agent example" \
  "good first issue" \
  "Add examples/research-agent.card.json using the Agent Card schema and scorecard fields."

create_issue_once \
  "Add scorecard badge generator" \
  "growth" \
  "Create a small script that turns a scorecard result into a Markdown badge, for example production-candidate, limited-beta, prototype, or demo-only."

echo "Recording initial star snapshot..."
node bin/star-watch.js "$repo_url" --state .star-watch.json --target 1000 --text || true

echo ""
echo "Published: $repo_url"
echo ""
echo "Topics:"
printf '%s\n' "${topics[@]}"
echo ""
echo "Check stars:"
echo "node bin/star-watch.js $repo_url --state .star-watch.json --target 1000 --text"
