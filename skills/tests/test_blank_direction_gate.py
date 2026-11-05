"""The gate reads each agent's own hook payload and applies the same rules to all of them.

Payload shapes come from captured events: Codex 0.163 (apply_patch, mcp__blank_direction__*),
Grok (camelCase envelope plus snake aliases, its own tool names), and the event the OpenCode
plugin and Pi extension in hooks/ build from their APIs.
"""

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

GATE = Path(__file__).resolve().parents[1] / "hooks" / "blank-direction-gate"
COMPONENT = "https://ui.aryank.space/components/word-highlight-scroll"
BACKEND = "https://ui.aryank.space/backend/effect-webhook-dispatcher"


class GateTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.env = {**os.environ, "TMPDIR": tmp.name}
        self.env.pop("BLANK_DIRECTION_GATE", None)

    def run_gate(self, mode, session, tool, tool_input, response=None, **extra):
        event = {"session_id": session, "hook_event_name": "PreToolUse" if mode == "gate" else "PostToolUse",
                 "tool_name": tool, "tool_input": tool_input, **extra}
        if response is not None:
            event["tool_response"] = response
        return subprocess.run([str(GATE), mode], input=json.dumps(event), capture_output=True, text=True, env=self.env)

    def search(self, session, tool, section, returned):
        self.run_gate("mark", session, tool, {"query": "word reveal", "section": section},
                      {"content": [{"type": "text", "text": returned}]})

    def test_codex_patch_to_ui_file_needs_our_components_opened(self):
        patch = {"command": "*** Begin Patch\n*** Add File: app/hero.tsx\n+x\n*** End Patch"}
        self.assertEqual(self.run_gate("gate", "c1", "apply_patch", patch).returncode, 2)
        self.search("c1", "mcp__blank_direction__registry_search", "components", COMPONENT)
        blocked = self.run_gate("gate", "c1", "apply_patch", patch)
        self.assertEqual(blocked.returncode, 2)
        self.assertIn("word-highlight-scroll", blocked.stderr)
        self.run_gate("mark", "c1", "Bash", {"command": "npx shadcn@latest add @compronents/word-highlight-scroll"}, "ok")
        self.assertEqual(self.run_gate("gate", "c1", "apply_patch", patch).returncode, 0)

    def test_codex_patch_body_is_not_a_shell_command(self):
        patch = {"command": "*** Begin Patch\n*** Add File: README.md\n+npm install left-pad\n*** End Patch"}
        self.search("c2", "mcp__blank_direction__registry_search", "all", "")
        self.assertEqual(self.run_gate("gate", "c2", "apply_patch", patch).returncode, 0)

    def test_grok_install_is_blocked_with_a_whole_json_reason(self):
        grok = {"hookEventName": "pre_tool_use", "toolName": "run_terminal_command"}
        blocked = self.run_gate("gate", "g1", "run_terminal_command", {"command": "pnpm add zod"}, **grok)
        self.assertEqual(blocked.returncode, 2)
        reply = json.loads(blocked.stdout)
        self.assertEqual(reply["decision"], "deny")
        self.assertIn("direction_discover", reply["reason"])  # a later line Grok would drop from stderr

    def test_grok_mcp_name_counts_as_a_search(self):
        self.search("g2", "blank-direction__registry_search", "all", "")
        self.assertEqual(self.run_gate("gate", "g2", "run_terminal_command", {"command": "pnpm add zod"}).returncode, 0)

    def test_opencode_write_uses_file_path_key(self):
        self.search("o1", "blank_direction_registry_search", "components", COMPONENT)
        blocked = self.run_gate("gate", "o1", "write", {"filePath": "/repo/src/Hero.tsx", "content": "x"})
        self.assertEqual(blocked.returncode, 2)
        self.assertIn("open our own components", blocked.stderr)

    def test_pi_backend_edit_needs_a_backend_block_read(self):
        self.search("p1", "mcp__blank_direction__registry_search", "backend", BACKEND)
        write = {"path": "src/server/webhooks.ts", "content": "export {}"}
        self.assertEqual(self.run_gate("gate", "p1", "write", write).returncode, 2)
        source = "/Users/me/Desktop/CREATE/compronents/src/registry/effect-webhook-dispatcher/index.ts"
        self.run_gate("mark", "p1", "read", {"path": source}, "source")
        self.assertEqual(self.run_gate("gate", "p1", "write", write).returncode, 0)

    def test_effect_import_marks_any_path_as_backend(self):
        self.search("p2", "mcp__blank_direction__registry_search", "components", "")
        edit = {"path": "src/lib/retry.ts", "edits": [{"newText": 'import { Effect } from "effect"'}]}
        blocked = self.run_gate("gate", "p2", "edit", edit)
        self.assertEqual(blocked.returncode, 2)
        self.assertIn("backend blocks", blocked.stderr)

    def test_reading_and_pi_codemode_pass_before_any_search(self):
        # pi reaches MCP through codemode, so blocking it would block the search itself.
        self.assertEqual(self.run_gate("gate", "p3", "codemode", {"code": "await mcp.registry_search()"}).returncode, 0)
        self.assertEqual(self.run_gate("gate", "p3", "read", {"path": "src/a.ts"}).returncode, 0)
        self.assertEqual(self.run_gate("gate", "p3", "grep", {"pattern": "x"}).returncode, 0)
        self.assertEqual(self.run_gate("gate", "p3", "web_search", {"query": "x"}).returncode, 2)

    def test_claude_shape_still_works(self):
        self.assertEqual(self.run_gate("gate", "k1", "Edit", {"file_path": "/a/b.tsx"}).returncode, 2)
        self.assertEqual(self.run_gate("gate", "k1", "Bash", {"command": "ls"}).returncode, 0)


if __name__ == "__main__":
    unittest.main()
