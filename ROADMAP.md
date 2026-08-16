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

### v0.7: Machine-readable eval results

- [x] Framework-neutral Eval Result JSON Schema
- [x] Zero-dependency validator for JSON, JSON arrays, and JSONL
- [x] Fixture-reference, duplicate-ID, and result-consistency checks
- [x] Inert pass/fail examples and English/Chinese adapter guidance

### v0.8: Risk-tiered readiness profiles

- [x] Read-only, draft-only, and state-changing machine-readable profiles
- [x] Total and per-area minimums, tool-effect boundaries, and approval rules
- [x] Profile-specific launch-blocker policies
- [x] Opt-in, backward-compatible GitHub Action support
- [x] English and Chinese threat-model guidance with one example per profile

## Current Priorities

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
