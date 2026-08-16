# Roadmap

This roadmap tracks shipped, verifiable artifacts rather than aspirational
feature counts.

## Shipped

### v0.1: Scorecard foundation

- [x] 20-point production-readiness scorecard
- [x] Agent Card, Eval Plan, and Launch Checklist templates
- [x] Machine-readable Agent Card schema
- [x] Zero-dependency score CLI

### v0.2: Public product surface

- [x] English and Chinese README
- [x] Bilingual web scorecard with shareable URLs and JSON export
- [x] README badge generator
- [x] Node 24 GitHub Action readiness gate
- [x] Source-linked production incident library
- [x] MCP server safety checklist

### v0.3: Explicit release blockers

- [x] Independent score and launch-blocker gates
- [x] Combined pass result and machine-readable blocker outputs
- [x] Public `@v0` smoke tests
- [x] First external adopter on a separate repository

### v0.4: Prompt-injection fixtures

- [x] Eight framework-neutral JSONL fixtures
- [x] Direct, indirect, tool-output, exfiltration, and benign-control coverage
- [x] JSON Schema and zero-dependency fixture validator
- [x] English and Chinese fixture documentation

### v0.5: Non-coding Agent example

- [x] Human-approved operations triage Agent Card
- [x] Read-only diagnosis separated from state-changing tools
- [x] Approval required for external messages, deletes, and production changes

### v0.6: CI trust-boundary regression

- [x] Sixth bilingual, source-linked vulnerability case
- [x] Gemini CLI workspace-trust and allowlist regressions
- [x] Automated structure and impact-boundary checks

## Current Priorities

- [Machine-readable eval result contract and validator](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/11)
- [Risk-tiered readiness profiles](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/12)
- Wire the prompt-injection fixtures into real consumer eval runners.
- Add source-linked incidents only when they introduce a distinct control or
  regression, not to inflate a case count.
- Add external adopters with public CI evidence.

## Contribution Principles

High-value contributions should:

- produce a reusable artifact, test, or source-linked case;
- separate observed evidence from interpretation;
- keep launch blockers and limitations visible;
- include English and Chinese navigation when adding a user-facing workflow;
- avoid fabricated benchmarks, unsafe payload execution, and engagement
  exchange.
