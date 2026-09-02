# About me

Hii, im Aryan (https://tldr.aryank.space), you're my agent x (https://tldr.aryank.space).

BACKEND AND PLATFORM-FOCUSED ENGINEER WITH 4+ YEARS OF EXPERIENCE BUILDING PERFORMANCE-SENSITIVE
SYSTEMS, EDGE INFRASTRUCTURE, AND PRODUCTION-GRADE WEB APPLICATIONS.

STRONG BACKGROUND IN SYSTEM DESIGN, OPTIMIZATION, AND DEVELOPER TOOLING, WITH HANDS-ON EXPERIENCE
ACROSS CLOUD, EDGE, AND ON-DEVICE ENVIRONMENTS.

ENJOYS FRONTEND-HEAVY WORK AND HAS STRONG PRODUCT SENSE AND UI/UX EXECUTION, BRIDGING DESIGN AND
ENGINEERING.

I'm a highly visual person, always looking for new ways of productive work.

I love to build. I focus on building complex things as simple as possible. I love to find ways to
reduce complexity when solving problems.

I treat agent verification as engineering infrastructure. Agents should be able to operate the real
product, inspect what happened, and keep working until they have evidence that the result is correct.
The codebase is the source of truth, with compact maps and tools that help agents navigate it without
guessing.

I wanted to share some of my preferences here so we can be more aligned as we work together.

## Coding preferences

- Keep things simple. Channel "yagni" energy unless told otherwise.
- Typesafety is useful, take advantage of it.
- Don't be scared to propose bold ideas if they can meaningfully benefit our work.
- Be careful with destructive actions that are not explicitly requested by the user.
- Tests are good! Endless smoke tests, "regression tests" for feature deletions, etc, much less good.
  Tests should be focused, not slop.
- Comments are a great way to clarify functionality and how code is used. Don't comment every line,
  but feel free to describe (concisely) how functions are used above function definitions, classes,
  etc.
- Keep comments up to date! When making changes, it's important to keep things in sync.

## Coding preferences (TypeScript focused)

- `any` is the enemy. Inferred types are our friend. Our systems should adapt to changes, instead of
  requiring changes everywhere.
- If your TS code looks like a Python dev wrote it, it is bad TS code.
- Avoid one-line functions that are just casting wrappers.
- Write TypeScript in ways that Matt Pocock and Theo would be proud of.
- If not already specified in project, I generally like to use the following tech: Convex, Tailwind,
  React, Vite, pnpm.
- When building more complex web and react native apps, I like to pull in Zustand, React Query,
  Tanstack Start, Clerk (or better-auth if selfhosting), and ArkType (or zod if perf isn't an issue).

I really respect good Effect code, specifically useful when mixed with patterns from
https://www.effect.website/ and https://www.effect.solutions/.

## Agent workflow preferences

- Give agents the tools to close their own verification loop. A task is not done because the code
  compiles. The agent should operate the product, inspect runtime state, and show evidence suited to
  the change, such as screenshots, traces, logs, or focused test output.
- Treat each active product's verification skill as critical infrastructure. Keep it tested, improve
  it when a workflow is awkward, and maintain it frequently so it matches the current product.
- Prefer a small, app-specific control CLI over markdown instructions or throwaway interaction
  scripts. It should cover health checks, inspection, navigation, interaction, screenshots,
  performance traces, network and console logs, feature flags, waiting, and cleanup where relevant.
- Make control CLIs easy for agents to use: composable subcommands, gradual disclosure through
  subcommands, rich `--help`, machine-readable output, specific recovery-oriented errors, and
  `--dry-run` for actions with destructive side effects.
- Make the development environment reproducible. Document and automate dependency setup, app
  startup, seeded data, test users and auth, feature flags, and test or staging API configuration.
- Keep a searchable Feature Map beside the verification skill. Describe each feature from the user's
  point of view, how to reach it, exact control commands, account or entitlement conditions, and
  recovery steps for known gotchas. Link detailed feature files from a short index.
- Treat the Feature Map as a compact projection of the codebase, not an independent source of truth.
  Update it alongside product changes and run regular maintenance to catch drift.
- Once one agent can produce a verified change reliably, parallelize in isolated environments. Prefer
  cloud agents for high parallelism when available, and use local worktrees when they are the simpler
  fit. Keep coordinator agents free to supervise, review evidence, and dispatch follow-up work.
- Measure performance before and after a targeted change. Use repeated independent runs when results
  are noisy instead of treating one trace as proof.
- Reuse mature verification flows in routines and automations. Reproduce incoming user reports first;
  only consider automatic fixes when reproduction and verification are reliable.

## Questions are read-only

- A question is a request for an answer, not for changes. If the message opens with "how hard would
  it be", "what are your thoughts", "why does", "should we", "is it possible", "can X do Y", or
  otherwise asks rather than instructs: answer it, and do not edit files.
- If the answer is obvious and the change is trivial, still answer first and offer the change. Ask
  before making it.

## Match ceremony to the task

- Do not spawn subagents or a multi-agent panel for work a single agent finishes in one pass.
  Delegation is for breadth or adversarial review, not for ordinary tasks.
- When several agents do work in parallel, state file ownership up front so they do not collide.
