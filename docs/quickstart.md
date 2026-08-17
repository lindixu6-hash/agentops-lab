# Five-Minute CI Gate

[English](quickstart.md) | [简体中文](quickstart.zh-CN.md)

Generate an Agent Card and GitHub Actions workflow without cloning this
repository:

```bash
npm exec --yes \
  --package=github:lindixu6-hash/awesome-agentic-engineering#v0 \
  -- agentic-init \
  --profile draft-only \
  --name "Support Drafting Agent"
```

The zero-dependency command creates:

```text
agent-card.json
.github/workflows/agent-readiness.yml
```

No Node.js or npm? Download the two generated files for your profile:

| Profile | Agent Card | Workflow |
| --- | --- | --- |
| `read-only` | [Download JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/read-only/agent-card.json) | [Download YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/read-only/agent-readiness.yml) |
| `draft-only` | [Download JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/draft-only/agent-card.json) | [Download YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/draft-only/agent-readiness.yml) |
| `state-changing` | [Download JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/state-changing/agent-card.json) | [Download YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/state-changing/agent-readiness.yml) |

Save the selected JSON as `agent-card.json` and the YAML as
`.github/workflows/agent-readiness.yml`. These downloads are generated from the
same initializer contract and checked for byte equality in CI. Every generated
card also declares the
[canonical Agent Card Schema](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/agent-card.schema.json)
for editor and CI validation.

The generated workflow pins the third-party `actions/checkout` step to the
reviewed v7.0.1 commit SHA. The readiness gate uses this project's moving
`@v0` stable channel so compatible fixes can reach existing consumers; pin
that step to a release tag or commit SHA if your repository requires fully
immutable dependencies.

This repository's own CI, Pages, and Star Watch workflows also pin every
third-party Action to a full commit SHA. Dependabot checks those GitHub Actions
references weekly, but an update still requires review and CI. Local
`uses: ./` steps execute the checked-out commit; same-repository `@v0` calls
exist only to smoke-test the public moving channel.

Dependabot ignores major checkout/setup-node upgrades for the v0.14 provenance
workflows because those older SHAs are part of a published attested identity.
Upgrading them requires a new producer/verifier evidence run, not an automatic
dependency-only PR. Current v7 references can still receive minor and patch
updates.

Choose one profile:

| Profile | Use when |
| --- | --- |
| `read-only` | Every tool only reads scoped data |
| `draft-only` | The Agent may write an isolated draft but cannot publish |
| `state-changing` | A tool can change an external system and requires approval |

## The First Run Should Fail

The generated card is deliberately not production-ready:

- all ten score areas start at `0`;
- every user, owner, workflow, non-goal, and tool purpose contains a `TODO`;
- one explicit launch blocker remains;
- the workflow enables strict blocker failure.

This prevents a starter template from becoming false readiness evidence. The
first CI run should report:

```text
Score: 0/20
Profile passed: false
Launch blockers: 1
```

## Make the Gate Meaningful

1. Replace every `TODO` with a bounded, reviewable statement.
2. Replace the placeholder tool with the real capability and effect.
3. Add non-goals that prohibit authority the Agent must not have.
4. Score each area from 0 to 2 based on evidence, not intent.
5. Link eval fixtures, traces, approval records, budgets, and recovery tests.
6. Remove the starter blocker only after every requirement is actually met.

The
[10-gate production readiness guide](https://lindixu6-hash.github.io/awesome-agentic-engineering/guide/)
explains what counts as evidence for each score.

## Existing Files Are Protected

`agentic-init` checks both generated paths before writing either one. If
`agent-card.json` or `.github/workflows/agent-readiness.yml` already exists,
the command exits without modifying either file.

`--force` overwrites both paths and is intentionally explicit:

```bash
agentic-init --profile read-only --force
```

Review and commit existing files before using it. The command never edits
other repository files.
