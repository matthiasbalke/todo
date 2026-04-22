You are acting as a Senior Software Engineer. Your task is to plan and implement the feature: **$ARGUMENTS**

## Step 1 — Understand the context

Before writing a single line of code, read and internalize:
- `docs/requirements.md` — what the product needs to do
- `docs/security.md` — security requirements and constraints
- `CLAUDE.md` — tech stack, architecture decisions, and conventions
- Any existing feature docs in `docs/features/` that are related

## Step 2 — Design a good solution

Think carefully. Don't just pick the first solution that comes to mind. Ask yourself:
- Does this approach satisfy all relevant requirements in `docs/requirements.md`?
- Does it meet the security constraints in `docs/security.md`?
- Is it consistent with the existing architecture decisions in `CLAUDE.md`?
- Is it the simplest solution that fully solves the problem?
- What are the edge cases and failure modes?

## Step 3 — Write the feature doc

Create `docs/features/<feature-name>.md` (use the feature name from $ARGUMENTS, kebab-cased). The doc must contain:

1. **Overview** — one paragraph describing what the feature does and why
2. **Design decisions** — key choices made and why (alternatives considered)
3. **Security considerations** — how the feature meets the relevant security requirements
4. **Implementation plan** — a numbered list of concrete implementation steps
5. **Tasks** — do not add a task list to the feature doc. Instead, update `docs/tasks.md`:
    - **Edit** tasks that need to change due to updated feature requirements
    - **Check off** tasks that are already done
    - **Add** tasks that are missing

   Tasks must be grouped by *user-facing feature area* (not by layer like backend/frontend). Each task should be a single, testable unit of work.

   Example task grouping: instead of "Backend: add endpoint, Frontend: add UI", group as "User can register a passkey: [ ] store credential, [ ] display registration flow, [ ] write integration test".

## Step 4 — Implement

Before writing any code, switch to a feature branch:

```bash
git checkout -b feat/<feature-name>
```

Do not commit on `main`.

Work through the tasks in the feature doc one by one. For each task:
- Mark it complete in the doc as you finish it
- Write tests alongside the implementation (not after); tests must cover all positive paths, all negative paths, all branches, and common edge cases
- Follow the conventions in `CLAUDE.md`

Only implement what is specified in the requirements. Do not add features, extra configuration options, or unnecessary abstractions.

## Step 5 — Test

Run tests incrementally as you implement each layer. Do not defer testing to the end.

### Type-check and lint (after every file change)

After each file is written or modified, run the type-checker and linter for the affected layer:

- **Frontend:** `bun run check` (svelte-check + TypeScript)
- **Backend:** `./gradlew check` (ktlint + compilation)

Fix every error and warning before moving on to the next task. Do not accumulate warnings to clean up later.

### After backend changes

Every time you finish a backend task (new endpoint, service change, etc.), run the backend unit and integration tests immediately:

```bash
cd backend && ./gradlew test
```

Scope to the changed package when iterating: `./gradlew test --tests "com.github.matthiasbalke.todo.<package>.*"`

Fix all failures before moving on to the next task.

### After frontend changes

Every time you finish a frontend task (new component, store change, API call, etc.), run the frontend unit tests immediately:

```bash
cd frontend && bun run test --run
```

Fix all failures before moving on to the next task.

### E2E tests (after the full feature is complete)

Only run E2E tests once all backend and frontend unit tests pass. Use the project's full-stack test script, which builds Docker images, starts all services, and runs Playwright:

```bash
./run-e2e-tests.sh
```

Or manually:
```bash
docker compose up --build -d nginx
cd e2e && bunx playwright test
```

If E2E tests fail, fix the issues. Do not consider the feature done until all three test suites pass.