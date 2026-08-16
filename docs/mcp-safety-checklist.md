# MCP Server Safety Checklist

Use this checklist before connecting an agent to an MCP server or any external tool server.

## Identity And Scope

- [ ] The server owner is known.
- [ ] The server purpose is narrow and documented.
- [ ] The server is pinned to a trusted version or source.
- [ ] The server has a clear data access boundary.

## Tool Permissions

- [ ] Read tools and write tools are separated.
- [ ] Destructive tools require approval.
- [ ] External communication tools require approval.
- [ ] File system access is restricted to expected paths.
- [ ] Network access is restricted when possible.

## Data Handling

- [ ] Secrets are never returned in tool output.
- [ ] Sensitive fields are redacted by default.
- [ ] Retrieved content is treated as untrusted data.
- [ ] Logs do not store sensitive payloads unnecessarily.

## Reliability

- [ ] Tool errors are structured.
- [ ] Timeouts are defined.
- [ ] Retries are bounded.
- [ ] Long-running tasks have progress reporting.

## Review

- [ ] The agent has evals for malicious tool output.
- [ ] The server has a rollback or disable path.
- [ ] The server has an owner for incidents.
- [ ] Changes to tool schemas trigger evals.
