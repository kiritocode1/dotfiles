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
