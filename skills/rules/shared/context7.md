`ctx7` runs before any WebFetch or WebSearch aimed at documentation. If you are about to look
up a named library, framework, SDK, API, CLI tool, or cloud service, that call is the trigger. It is
not a judgment about whether you already know the answer, and it holds for well-known libraries:
React, Next.js, Prisma, Express, Tailwind, Django, Spring Boot. Covers API syntax, configuration,
version migration, library-specific debugging, setup instructions, and CLI usage.

Measured across 200 transcripts: ctx7 fired 20 times against 298 WebFetch and WebSearch calls. The
rule was being read and skipped, so it is now a precondition on the tools that were winning.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or
general programming concepts. None of those are documentation lookups.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"`. Use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Use the user's full question as the query -- specific and detailed queries return better results than vague single words. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
