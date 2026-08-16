#!/usr/bin/env node

const [, , repoArg] = process.argv;

function parseRepo(input) {
  if (!input) {
    throw new Error("Pass a repo as owner/name or https://github.com/owner/name.");
  }

  const trimmed = input.trim().replace(/\/$/, "");
  const urlMatch = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (urlMatch) {
    return `${urlMatch[1]}/${urlMatch[2]}`;
  }

  if (/^[^/\s]+\/[^/\s]+$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error("Repo must be owner/name or https://github.com/owner/name.");
}

async function getRepo(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "awesome-agentic-engineering-star-watch"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${repo}.`);
  }

  return response.json();
}

try {
  const repo = parseRepo(repoArg || process.env.GITHUB_REPOSITORY || "");
  const data = await getRepo(repo);
  const stars = data.stargazers_count;
  const forks = data.forks_count;
  const openIssues = data.open_issues_count;
  const pushedAt = data.pushed_at;

  console.log(JSON.stringify({
    repo,
    stars,
    forks,
    open_issues: openIssues,
    pushed_at: pushedAt,
    checked_at: new Date().toISOString()
  }, null, 2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
