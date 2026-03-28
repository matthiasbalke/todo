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
5. **Tasks** — a checkbox task list grouped by *user-facing feature area* (not by layer like backend/frontend). Each task should be a single, testable unit of work.

Example task grouping: instead of "Backend: add endpoint, Frontend: add UI", group as "User can register a passkey: [ ] store credential, [ ] display registration flow, [ ] write integration test".

## Step 4 — Implement

Work through the tasks in the feature doc one by one. For each task:
- Mark it complete in the doc as you finish it
- Write tests alongside the implementation (not after)
- Follow the conventions in `CLAUDE.md`

Only implement what is specified in the requirements. Do not add features, extra configuration options, or unnecessary abstractions.
