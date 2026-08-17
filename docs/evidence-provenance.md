# Attested Eval Evidence Provenance

[English](evidence-provenance.md) | [简体中文](evidence-provenance.zh-CN.md)

The OpenAI Agents SDK eval has a separate producer and verifier path. The
producer executes the runtime and signs one deterministic bundle. A reusable
workflow pinned by commit SHA downloads that bundle, verifies its GitHub
artifact attestation, safely extracts it, and evaluates its source-bound
manifest with an older immutable verifier.

Public evidence:

- [Attested producer/verifier run](https://github.com/lindixu6-hash/awesome-agentic-engineering/actions/runs/31981738763)
- Producer bundle artifact: `openai-agents-provenance-bundle`
- Verifier artifact: `openai-agents-verification-evidence`
- Bundle SHA-256:
  `81671c0e9589e65413e13b7ca7a19d3453166ae783cb5ae3feb4b46565256521`

## Trust Layout

```text
producer commit 2255540
  ├─ runs @openai/agents@0.16.1 against 8 fixtures
  ├─ creates 34 evidence files + provenance-manifest.json
  ├─ creates deterministic openai-agents-evidence.tar.gz
  ├─ signs the bundle with GitHub OIDC + Sigstore
  └─ uploads one producer artifact
                  │
                  ▼
reusable verifier pinned to commit 8d4b435
  ├─ checks out verifier code pinned to commit 34b1235
  ├─ downloads exactly one expected bundle
  ├─ verifies signer workflow, signer SHA, source SHA/ref, and hosted runner
  ├─ proves a modified bundle and wrong source digest fail verification
  ├─ rejects unsafe archive paths
  ├─ verifies every file hash and five trusted-input hashes
  ├─ validates all Eval Results and rejects any fail result
  └─ uploads independent verification evidence
```

The producer cannot replace verifier code during this run. The caller uses:

```yaml
uses: lindixu6-hash/awesome-agentic-engineering/.github/workflows/verify-eval-evidence.yml@8d4b435f66f58a570b65dd8b4952bf7e1e2dd62f
```

That reusable workflow checks out the manifest verifier from:

```text
34b12355a27a647adfb5b09578234a19ee076f0f
```

All external Actions in both workflows are also pinned to full commit SHAs.

## Bound Values

`provenance-manifest.json` binds:

- repository, commit SHA, Git ref, workflow ref, and workflow SHA;
- the exact OpenAI Agents lockfile and adapter source;
- the fixture pack;
- the Eval Result validator and JSON Schema;
- every response, assertion, tool trace, policy trace, result, and summary
  file;
- total, passing, and failing result counts.

The published manifest records 34 evidence files and 8/8 passing results. It
does not discard or rewrite failures: the verifier rejects a manifest that
contains any failing Eval Result.

## Attestation Verification

The verifier enforces:

```bash
gh attestation verify openai-agents-evidence.tar.gz \
  --repo lindixu6-hash/awesome-agentic-engineering \
  --signer-workflow \
    github.com/lindixu6-hash/awesome-agentic-engineering/.github/workflows/provenance-eval.yml \
  --signer-digest 225554029a583c014f1ea8f0e45a25267638bd8a \
  --source-digest 225554029a583c014f1ea8f0e45a25267638bd8a \
  --source-ref refs/heads/main \
  --deny-self-hosted-runners
```

The verified certificate and transparency-log record bind:

- the `Attested OpenAI Agents Eval` workflow path;
- commit and workflow digest
  `225554029a583c014f1ea8f0e45a25267638bd8a`;
- `refs/heads/main`;
- a GitHub-hosted runner;
- the public repository identity;
- workflow run `31981738763`;
- the bundle digest above;
- a Rekor transparency-log timestamp.

## Negative Evidence

The reusable verifier must observe both failures:

1. append one byte to the signed bundle and confirm attestation verification
   fails;
2. verify the original bundle against an all-zero source digest and confirm
   identity verification fails.

Local tests also reject:

- any changed evidence file;
- a mismatched source commit;
- a suite containing a failing Eval Result.

## What This Proves

For this exact run, a GitHub-hosted workflow with the declared identity signed
the declared bundle digest, and a SHA-pinned reusable verifier observed the
same bundle, source identity, trusted inputs, evidence hashes, and Eval
Results.

## What This Does Not Prove

- It does not prove the Agent, model, policy, or SDK is generally safe.
- It does not prove the attested files are semantically correct.
- It does not prove future runs produce the same result.
- It does not prevent a repository administrator from changing a later
  producer workflow or verifier reference.
- The repository's `main` branch was not protected when this evidence was
  generated. The attestation proves workflow and commit identity, not
  independent code review or branch-governance enforcement.
- The producer workflow still chooses which bytes to build and attest.
  GitHub-signed certificate fields and transparency timestamps are stronger
  than producer-controlled predicate metadata.
- This is not a SLSA level claim. A stronger design would move the build and
  signing operation into an independently governed reusable builder.

Treat this as a narrow provenance statement: **this trusted verifier observed
these exact artifacts from this exact workflow and commit**.
