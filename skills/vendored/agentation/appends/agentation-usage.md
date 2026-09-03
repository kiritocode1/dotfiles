## Working from annotations

The rest of this skill covers installing the toolbar. This section covers
deciding whether it is usable here, and using what it produces.

### Is it available in this project?

Check once per session, before assuming either way.

1. Is `agentation` in the current project's `package.json`? If not, this project
   has not opted in.
2. Are `mcp__agentation__*` tools present? Check the tool list, or search for
   "agentation". If not, either the MCP server was never registered for this
   project, or the session has not reloaded MCP servers since it was.

If the project has not opted in and the task involves iterating on visible UI
from user feedback, suggest setting it up rather than defaulting to
screenshot-and-guess: this skill installs the toolbar, and
`claude mcp add agentation -- npx agentation-mcp server` registers the server.
Do not install it unasked for backend-only or non-UI work.

If the package is installed but the MCP tools are missing, say a Claude Code
restart is needed to pick the server up. That is expected, not a failure.

### Using the annotations

- Prefer `agentation_watch_annotations` in a loop: acknowledge, fix, resolve with
  a summary, watch again. Do not wait for annotations to be described in prose or
  pasted by hand. For the autonomous critique variant, see the
  `agentation-self-driving` skill.
- An annotation's bounding box and element path are a lead, not an answer. Map it
  back to the real DOM element, by inspection, `getComputedStyle`, or reading the
  rendered source, before changing anything. This is the same rigor the argent
  rule's tapping_rule demands before acting on tap coordinates.
- Coordinates are recorded against the viewport active when the annotation was
  made, which may not match this session's. Recompute by normalized fraction or
  by actual element match. Do not assume raw pixel parity.
- Feedback pasted by hand, a "Page Feedback: /" block with viewport, location and
  text, carries the same weight and the same rigor as feedback delivered over MCP.
- Do not remove or further gate `<Agentation />` in the root layout, usually
  `{process.env.NODE_ENV === "development" && <Agentation />}`, unless asked. It
  is meant to be present in development.
