# Aryan voice skill and agent hook

The 50 visible-copy examples were approved in Plannotator. Aryan then requested a discoverable skill with an AGENTS.md hook.
The original voice guide now lives in the skill unchanged, alongside the 50 source-verified examples.
Skill validation, example verification, installed links, generated rules, and size limits pass.

```text
Agent hook -> aryan-voice -> Voice guide + 50 examples
```

| File | Before | After |
| --- | --- | --- |
| `skills/rules/core/aryan-voice.md` | Full voice guide | Short instruction to load the skill before writing |
| `skills/rules/core/aryan-voice.grok.md` | Short reply guidance | Same skill hook |
| `skills/skills/aryan-voice/SKILL.md` | Absent | Discoverable entrypoint with task-specific reference routing |
| `skills/skills/aryan-voice/references/voice-guide.md` | Absent | Original full guide, preserved byte-for-byte |
| `skills/skills/aryan-voice/references/website-component-examples.md` | Absent | 50 approved visible-copy examples and an index |
| Generated and installed agent rules | Full or abbreviated voice instructions | Generated skill hook |

Skill discovery links are installed for Codex, Claude, shared agents, Grok, and pi. No application code, memory files, or unrelated dotfiles changes were edited. Nothing was committed or pushed.

