# 15PTS Test Suite v1.0

## What this package does
Adds automated tests to the existing GitHub repository without modifying the published application files. GitHub Actions runs them on pushes, pull requests, or manually.

## Install
1. Download and unzip this package.
2. In your existing 15PTS repository, add `package.json`, the `tests/` folder, and `.github/workflows/tests.yml` at the same relative paths shown in the ZIP.
3. Commit the files to GitHub. Do not replace `app.js`, `points-data.js`, or any existing application files.
4. Open your GitHub repository's **Actions** tab, then **15PTS Regression Tests** to view the run.
5. To run locally with Node.js 20 or newer, execute `npm test` in the repository root.

## Scope and limitations
- 24 synthetic threshold examples exercise the REAL production `ptsFor` function. These are not AKC-certified fixtures and do not verify the accuracy of AKC's published schedule values.
- Additional checks verify invariants and the presence of expected guardrails. Source-pattern checks do not prove end-to-end UI correctness.
- No application source code is modified, and this package does not deploy anything.
- The test runner intentionally fails if the function's signature changes; update the adapter as part of a future refactor.
- This first package does not yet test saved-record editing, title progression, GCH computations, offline synchronization, or historical schedule correctness. Those require validated fixtures and deeper integration testing.
- Passing tests are NOT a certification of AKC compliance.

## Next phase
Add independently verified AKC schedule fixtures and real end-to-end browser tests, then configure branch protection or deployment gating after the test suite is stable.
