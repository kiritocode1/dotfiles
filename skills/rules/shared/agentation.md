<description>
Agentation (https://agentation.com) is the user's preferred UI-feedback channel across all projects, held to the same standing as the `argent` rule for device interaction: not an optional convenience, the default path whenever a project has it available and the work involves iterating on a running UI from user feedback.

Agentation is two pieces:
- `agentation` (npm package): a dev-only toolbar component (`<Agentation />`) the user clicks elements in, annotating them with notes. Produces structured output — CSS selector, element path, bounding box, computed styles.
- `agentation-mcp` (MCP server, `agentation-mcp server`): exposes `agentation_list_sessions`, `agentation_get_session`, `agentation_get_pending`, `agentation_get_all_pending`, `agentation_acknowledge`, `agentation_resolve`, `agentation_dismiss`, `agentation_reply`, `agentation_watch_annotations` so annotations sync to the agent directly instead of the user pasting them in.
</description>

<availability_check>
Run this check once per session, before assuming Agentation is or isn't usable here.

1. Is `agentation` in the current project's `package.json`? If not, this project hasn't opted in yet.
2. Are `mcp__agentation__*` tools present (check the tool list, or ToolSearch "agentation")? If not, either the MCP server was never registered for this project, or it was registered but the session hasn't reloaded MCP servers since.

If the project has NOT opted in yet, and the current task involves iterating on visible UI from user feedback, proactively suggest setting it up (`/agentation` skill installs the toolbar; `claude mcp add agentation -- npx agentation-mcp server` registers the MCP server) rather than defaulting straight to screenshot-and-guess. Don't install it unasked for backend-only or non-UI work.

If the package is installed but the MCP tools aren't loaded, tell the user a Claude Code restart is needed to pick up the MCP server — this is expected, not a failure.
</availability_check>

<priority_rules>
Once `mcp__agentation__*` tools are available in a session:

- Prefer `agentation_watch_annotations` in a loop (acknowledge → fix → resolve with a summary → watch again) over waiting for the user to describe UI issues in prose or paste annotation text manually. See the `agentation-self-driving` skill for the autonomous critique variant of this loop.
- Treat an annotation's bounding box / element path as a lead, not a final answer — map it back to the actual DOM element (via `describe`-style inspection, `getComputedStyle`, or reading the rendered source) before making a change, the same rigor `argent.md`'s tapping_rule requires before acting on tap coordinates. Annotation coordinates are reported against the viewport size active when the annotation was made, which may not match the current session's viewport — recompute by normalized fraction or actual element match, don't assume raw pixel parity.
- If the user pastes annotation-shaped feedback manually (a "Page Feedback: /" block with viewport, location, and feedback text) because the MCP path isn't loaded yet, treat it as equivalent in intent and rigor to what the MCP tools would have delivered directly.
- Don't remove or further gate the toolbar component (`{process.env.NODE_ENV === "development" && <Agentation />}` in the root layout, or equivalent) without being asked — it's meant to always be there in development.
</priority_rules>
