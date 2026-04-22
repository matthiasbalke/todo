Fix a bug using a strict TDD workflow: write failing tests first, then fix, then verify. No scope creep.

## Usage

`/bugfix <description>` — fix the described bug
`/bugfix` — describe the bug interactively

## Workflow

**If no description was provided**, ask the user: "What bug should I fix? Please describe the symptom, where it occurs, and any relevant error messages or reproduction steps."

Once you have a clear bug description, follow these steps **in strict order**:

---

### Step 1 — Understand the bug

- Read the relevant source files to understand the affected code paths.
- Identify the root cause (or the most likely candidate if not yet confirmed).
- Identify which layer is affected: backend (Kotlin/Gradle), frontend (SvelteKit/bun), or both.

---

### Step 2 — Write failing test(s) BEFORE touching production code

Write one or more tests that reproduce the bug:

- **Backend:** add tests to the appropriate test class under `backend/src/test/`. Use `AbstractIntegrationTest` for tests that need a real PostgreSQL instance (Testcontainers). Unit tests are preferred when the bug is in pure logic.
- **Frontend:** add Vitest tests under `frontend/src/` near the affected module.
- **E2E (last resort):** only add Playwright tests in `e2e/` if the bug cannot be reproduced at a lower level.

The test must:
- Directly describe the bug symptom in its name (e.g., `"should not promote last owner when only one owner remains"`)
- Fail with the current (unfixed) code — this proves the test is meaningful

---

### Step 3 — Run the new test(s) to confirm they fail

**Backend:**
```bash
./gradlew test --tests "FullClassName"
```

**Frontend:**
```bash
bun run test --reporter=verbose <path-to-test-file>
```

**E2E:**
```bash
bunx playwright test <spec-file>
```

If the test **passes** before the fix, stop and reassess — either the test does not reproduce the bug, or the bug was already fixed elsewhere. Investigate and correct the test before continuing.

---

### Step 4 — Implement the fix

- Make the **minimum code changes** required to fix the bug.
- **Do not** change formatting, style, naming, or anything unrelated to the bug.
- **Do not** refactor surrounding code, even if it looks like it could be improved.
- **Do not** add features or handle edge cases not described in the bug report.
- If you notice unrelated issues while fixing, note them in your final report but do not touch them.

---

### Step 5 — Run all tests

**Backend:**
```bash
./gradlew test
```

**Frontend:**
```bash
bun run test
```

**E2E (only if E2E tests were added or the bug was UI-level):**
```bash
bunx playwright test
```

All tests must pass. If a pre-existing test fails, investigate before concluding the fix is correct — do not suppress or skip failing tests.

---

### Step 6 — Report

Summarize:
1. **Root cause** — what was wrong and why
2. **Tests added** — file path(s) and test name(s)
3. **Production code changed** — file path(s) and what changed (one sentence per change)
4. **Explicitly left unchanged** — anything you noticed but deliberately did not touch

Keep the report concise. No padding.