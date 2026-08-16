# Ethical Star Growth Playbook

The goal is not to inflate stars. The goal is to make the project genuinely worth saving, sharing, and revisiting.

## Positioning

One-line promise:

```text
Production-ready templates, evals, and failure modes for AI agents that survive real users.
```

Audience:

- Engineers building LLM apps
- Founders shipping AI agents
- Platform teams reviewing tool access
- Security-minded MCP users
- Developer advocates looking for practical agent material

## Star Triggers

People star repositories when they think:

- "I need this later."
- "This saves me from writing my own checklist."
- "This makes me look smarter if I share it."
- "This is early in a trend I care about."
- "This repo is maintained and will keep improving."

Design every update around one of those triggers.

## Weekly Content Loop

Every week, ship one useful artifact:

- Week 1: Production Agent Scorecard
- Week 2: 10 failure modes from real agents
- Week 3: MCP safety checklist
- Week 4: Coding agent eval fixture pack
- Week 5: Support agent redaction checklist
- Week 6: Cost-control guide
- Week 7: Human approval UX examples
- Week 8: Agent incident review template

Each artifact should include:

- A short README section
- A reusable template or checklist
- One social post
- One issue inviting examples

## Launch Channels

Use channels where builders already look for practical tools:

- Hacker News
- Reddit communities for LLMs, LocalLLaMA, MachineLearning, and programming
- X and LinkedIn
- V2EX
- 掘金
- 知乎
- 即刻
- Discord and Slack communities for AI builders

## Outreach Script

Use this with people who build LLM apps:

```text
I am collecting practical production patterns for AI agents: evals, tool permissions, memory boundaries, failure modes, and launch checklists.

If you have a real failure story or checklist item, I would love to include it with attribution:

<repo-url>
```

Do not ask for stars directly. Ask for feedback, examples, and corrections.

## Milestones

### 100 stars

Proof that positioning works.

Actions:

- Add contributor names
- Pin 3 good first issues
- Publish the first failure-mode article

### 500 stars

Proof that the repo is useful beyond friends and direct network.

Actions:

- Add a lightweight web scorecard
- Add badges for score ranges
- Collect 10 production case studies

### 1,000 stars

High-signal portfolio asset.

Actions:

- Publish "State of Production AI Agents" report
- Invite maintainers
- Add newsletter or waitlist for deeper material

### 5,000 stars

Category authority.

Actions:

- Turn the scorecard into an annual benchmark
- Publish templates as a small package
- Offer workshops or advisory work

## Monitoring

Check daily:

```bash
node bin/star-watch.js owner/repo --state .star-watch.json --target 1000 --text
```

Track:

- Stars
- Forks
- Issues opened
- PRs opened
- Referring posts
- Which README sections people mention

If star growth stalls, add a new useful artifact instead of reposting the same pitch.
