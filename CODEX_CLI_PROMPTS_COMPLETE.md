# Codex CLI Prompts - Complete Reference

This catalogue tracks every operational prompt used with the Codex/Claude CLI workflows. It reflects the post-merge state of the Sentia AI Manufacturing project, highlighting any updated scope, expected outputs, and verification steps.

## How to Use This Document

1. Identify the scenario you need (deployment, testing, documentation, etc.).
2. Copy the corresponding prompt block into the CLI session.
3. Follow the expected outcome and verification guidance before closing the task.

## Prompt Directory

| Prompt                                              | Focus Area                                | Status After Merge                                                                         | Expected Outcome                                                                                                                                      | Verification                                                                  |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Prompt 1 - Railway Deployment Analysis              | Diagnose prior 502 errors on Railway      | **Archived:** superseded by Render `render.yaml` blueprint but kept for rollback reference | Produce root-cause analysis for legacy Railway stack                                                                                                  | Checklist satisfied when mitigation plan documented in `DEPLOYMENT-FIX.md`    |
| Prompt 2 - Create Bulletproof Railway Server        | Harden Express server for Railway         | **Archived**                                                                               | Generate `server.railway.js` fallback entry point                                                                                                     | Test by running `node server.railway.js` locally                              |
| Prompt 3 - Update Railway Configuration             | Update Railway deployment files           | **Archived**                                                                               | Emit updated `railway.json`/scripts                                                                                                                   | Validate with `railway up` (legacy)                                           |
| Prompt 4 - Security Vulnerability Assessment        | Review dependency advisories              | **Active**                                                                                 | Actionable list of vulnerable packages with severity and fixes                                                                                        | `pnpm audit` reflects 0 critical/high after remediation                       |
| Prompt 5 - Dependency Update Strategy               | Plan dependency upgrades                  | **Active**                                                                                 | Ordered upgrade plan with impact notes                                                                                                                | Updated plan stored in `DEPENDENCY_UPDATE_PLAN.md`                            |
| Prompt 6 - Security Hardening Implementation        | Apply runtime security controls           | **Active**                                                                                 | Implement CSP, rate limiting, MFA checks                                                                                                              | Lint/test plus manual review of `server/security` modules                     |
| Prompt 7 - Test Suite Analysis                      | Audit Vitest/Playwright coverage          | **Active**                                                                                 | Coverage deltas and missing specs                                                                                                                     | `pnpm run test:run --coverage` >= target                                      |
| Prompt 8 - Enterprise Component Testing             | Generate high-value tests                 | **Queued**                                                                                 | Test stubs for orchestrator, security, integrations                                                                                                   | New specs added alongside implementations                                     |
| Prompt 9 - Quality Gate Validation                  | Enhance quality gate script               | **Queued**                                                                                 | Updated `scripts/quality-gate.js` with new metrics                                                                                                    | Pipeline logs show pass/fail summary                                          |
| Prompt 10 - Documentation Audit                     | Full documentation sweep                  | **Active**                                                                                 | Issue list + doc change plan (this prompt feeds Prompt 13)                                                                                            | Compare doc inventory against `docs/` tree                                    |
| Prompt 11 - API Documentation Generation            | Produce API reference                     | **Queued**                                                                                 | Markdown/Slate-ready endpoint docs                                                                                                                    | `docs/api/` updated                                                           |
| Prompt 12 - Developer Onboarding Guide              | Create onboarding material                | **Complete**                                                                               | Updated `DEVELOPER_ONBOARDING.md`                                                                                                                     | New hires onboard without blockers                                            |
| Prompt 13 - Update Documentation After Merge        | Synchronise docs with original repo merge | **In Progress (this task)**                                                                | Updated `FINAL_IMPLEMENTATION_GUIDE.md`, `DEPLOYMENT_STRATEGY_AND_VERIFICATION.md`, `CODEX_CLI_PROMPTS_COMPLETE.md`, `QUICK_START.md`, `CHANGELOG.md` | Review file diffs + ensure deployment verification list reflects Render stack |
| Prompt 14 - Performance Optimization Implementation | Optimise hot paths                        | **Queued**                                                                                 | Recommendations for bundle size, API latency                                                                                                          | Compare lighthouse metrics pre/post                                           |
| Prompt 15 - Load Testing Setup                      | Configure load testing                    | **Queued**                                                                                 | Playwright/Artillery scenario definitions                                                                                                             | Load report saved in `performance-report.json`                                |

## Prompt Templates (Updated)

### Prompt 4 - Security Vulnerability Assessment

```
Analyze package.json, pnpm-lock.yaml, and security reports to identify outstanding vulnerabilities. For each finding, document:
1. Package and installed version
2. CVE reference and severity
3. Recommended upgrade path (exact version)
4. Risk of breaking changes
5. Required follow-up tests
Return a tabular summary plus remediation checklist.
```

### Prompt 7 - Test Suite Analysis

```
Review tests under /tests and feature-level *.test.jsx files. Highlight:
- Coverage gaps in working-capital, forecasting, orchestration modules
- Snapshot files needing refresh
- Flaky or skipped specs
Recommend new scenarios with file + describe block names. Conclude with command sequence to run coverage locally.
```

### Prompt 10 - Documentation Audit

```
Inspect the /docs directory, root-level handover files, and new CHANGELOG requirements. Identify stale references (Railway vs Render, mock data references, etc.). Return:
- Files requiring updates
- Suggested replacements for outdated deployment steps
- Architecture diagrams to refresh
- Any missing environment variable guidance
```

### Prompt 13 - Update Documentation After Merge

```
Coordinate updates to FINAL_IMPLEMENTATION_GUIDE.md, DEPLOYMENT_STRATEGY_AND_VERIFICATION.md, CODEX_CLI_PROMPTS_COMPLETE.md, QUICK_START.md, and CHANGELOG.md. Ensure all references match the merged feature set (auto-sync manager, Render blueprint, memoised Demand Forecasting, Enterprise AI chatbot updates).
```

### New Prompt - Auto-Sync Diagnostics (Prompt 16)

```
Investigate auto-sync behaviour across Shopify, Xero, Amazon, and Unleashed services. Tasks:
1. Review services/auto-sync-manager.js for schedules and retry logic
2. Identify missing credential handling and logging gaps
3. Recommend observability improvements (metrics, alerts)
4. Provide checklist for validating sync status post-deploy
Output: Markdown report ready to append to DEPLOYMENT_STRATEGY_AND_VERIFICATION.md.
```

## Workflow Notes

- Whenever prompts reference legacy Railway infrastructure, treat them as historical artefacts. Prefer the Render pipeline, but keep legacy documentation for audits.
- Prompts 4-9 feed quarterly compliance verifications. Keep resulting artefacts in `reports/` with timestamped filenames.
- The newly introduced Prompt 16 should run after every credentials change to guarantee cross-service data freshness.

## Verification Log Template

Use this snippet inside PR descriptions when executing prompts:

```
### Codex CLI Prompt Verification
- Prompt used: <number + name>
- Date executed: YYYY-MM-DD
- Artefacts updated: (files/paths)
- Verification evidence: (tests run, screenshots, health checks)
- Residual risks: (optional)
```

Keeping this table accurate ensures future agents can immediately locate the correct automation prompt and understand the expected deliverables.
