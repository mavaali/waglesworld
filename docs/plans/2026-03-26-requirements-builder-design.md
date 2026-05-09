# Design: Requirements Builder Skill

## Problem

Mid-implementation drift. Brainstorming captures the "what" and "why" at a high level, but doesn't produce structured user stories with acceptance criteria and edge cases. Without those, scope creeps and edge cases get discovered too late.

## Solution

A standalone skill that interviews you about a feature, then produces a structured requirements doc with user stories, acceptance criteria, edge cases, and explicit "NOT in scope" boundaries. Composes with brainstorming (can warm-start from a design doc) but works independently too.

## How It Works

### Trigger

- "requirements", "user stories", "build requirements for X"
- After brainstorming: "now build the stories"

### Input Modes

- **Cold start** — describe a feature directly
- **Warm start** — point at a brainstorming design doc. Skill reads it, skips answered questions, focuses on gaps.

First action: check for recent design doc in `docs/plans/`. If found, ask whether to use it as context.

### Interview (one question at a time)

**Phase 1: Understanding (3-5 questions)**
- Who is the user? (can be multiple types)
- What outcome do they want?
- What triggers this flow?
- What does "done" look like from the user's perspective?
- Hard constraints? (tech, time, platform)

Multiple choice preferred. Warm start pre-fills and skips.

**Phase 2: Checklist Sweep (fixed categories, always asked)**

| Category | Example prompt |
|----------|---------------|
| Happy path | "Walk me through the ideal flow step by step" |
| Empty/null states | "What happens when there's no data yet?" |
| Error states | "What fails? What does the user see?" |
| Boundaries | "What's NOT in scope? What should this explicitly never do?" |
| Edge cases | "What's the weird input? The power user abuse case?" |
| Data | "What's created, read, updated, or deleted?" |

"Skip" moves to next category. But it always asks.

### Output

File: `docs/plans/YYYY-MM-DD-<topic>-requirements.md`

```markdown
# Requirements: <Feature Name>

## Context
One paragraph — what and why. Link to design doc if exists.

## Users
Who this is for.

## User Stories
Per story:
- **Story:** As a [user], I want [X] so that [Y]
- **Acceptance criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Edge cases:**
  - What happens when [weird thing]
- **Error handling:**
  - When [X fails], user sees [Y]

## NOT In Scope
- Thing — why deferred

## Open Questions
Unresolved items from interview.
```

After writing: "Ready to load these into tasks?" If yes, each story becomes a TodoWrite item.

## NOT In Scope

- Epic/dependency mapping — solo dev, not needed
- Priority ordering — handle that in implementation planning
- Templating for different project types — YAGNI until proven otherwise

## What Already Exists

- `brainstorming` skill — premise-challenging, design exploration. This skill sits downstream.
- `writing-plans` skill — implementation plans. This skill sits upstream.
- Neither produces structured user stories with acceptance criteria.
