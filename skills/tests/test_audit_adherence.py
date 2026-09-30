"""Fixture checks for the privacy-safe task-adherence candidate extractor."""

import importlib.machinery
import json
import tempfile
import unittest
from pathlib import Path

MODULE = importlib.machinery.SourceFileLoader(
    "audit_adherence", str(Path(__file__).resolve().parents[1] / "bin" / "audit-adherence")
).load_module()


class AdherenceAuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def pi_session(self, rows):
        path = self.root / ".pi/agent/sessions/project/session.jsonl"
        path.parent.mkdir(parents=True, exist_ok=True)
        path = path.with_name("2026-09-20T00-00-00.jsonl")
        path.write_text("\n".join(json.dumps(row) for row in rows))
        return path

    def test_discovery_precedes_edit_and_followup_is_not_automatically_a_failure(self):
        path = self.pi_session([
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Build a new dashboard with TOKEN_PRIVATE"}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "toolCall", "name": "bash", "arguments": {"command": "curl https://ui.aryank.space/direction/discover"}}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "toolCall", "name": "write", "arguments": {"path": "src/page.tsx"}}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "text", "text": "Done"}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Wrong result"}]}},
        ])
        rows = list(MODULE.tasks(path, "pi", "2026-09-21"))
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["discovery_before_choice"])
        self.assertTrue(rows[0]["correction_followup"])
        self.assertNotIn("TOKEN_PRIVATE", json.dumps(rows))
        self.assertTrue(rows[0]["unknown"])

    def test_discovery_after_edit_fails_ordering_and_narrow_task_is_excluded(self):
        path = self.pi_session([
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Build a new component"}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "toolCall", "name": "edit", "arguments": {"path": "src/a.tsx"}}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "toolCall", "name": "bash", "arguments": {"command": "direction_discover"}}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "assistant", "content": [{"type": "text", "text": "done"}]}},
            {"type": "message", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Fix the broken component"}]}},
        ])
        rows = list(MODULE.tasks(path, "pi", "2026-09-21"))
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0]["discovery_before_choice"])
        self.assertFalse(rows[0]["correction_followup"])

    def test_claude_image_attachment_does_not_split_a_task(self):
        path = self.root / ".claude/projects/project/example.jsonl"
        path.parent.mkdir(parents=True)
        path.write_text("\n".join(json.dumps(row) for row in [
            {"type": "user", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Design a new page"}]}},
            {"type": "user", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "[Image: source: /tmp/picture.png]"}]}},
            {"type": "assistant", "timestamp": "2026-09-20", "message": {"role": "assistant", "stop_reason": "end_turn", "content": [{"type": "text", "text": "done"}]}},
        ]))
        self.assertEqual(len(list(MODULE.gather(self.root, "2026-09-21"))), 1)

    def test_codex_function_call_is_counted(self):
        path = self.root / ".codex/sessions/2026/09/20/rollout.jsonl"
        path.parent.mkdir(parents=True)
        path.write_text("\n".join(json.dumps(row) for row in [
            {"type": "response_item", "timestamp": "2026-09-20", "payload": {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Build a new dashboard"}]}},
            {"type": "response_item", "timestamp": "2026-09-20", "payload": {"type": "function_call", "name": "exec_command", "arguments": '{"cmd":"direction_discover"}'}},
            {"type": "response_item", "timestamp": "2026-09-20", "payload": {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": "done"}]}},
        ]))
        rows = list(MODULE.gather(self.root, "2026-09-21"))
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["discovery_before_choice"])

    def test_incomplete_task_and_child_session_are_excluded(self):
        self.pi_session([{"type": "message", "timestamp": "2026-09-20", "message": {"role": "user", "content": [{"type": "text", "text": "Design a new page"}]}}])
        self.assertEqual(list(MODULE.gather(self.root, "2026-09-21")), [])
        child = self.root / ".pi/agent/sessions/project/child/run-0/session.jsonl"
        child.parent.mkdir(parents=True)
        child.write_text("{}\n")
        self.assertEqual(list(MODULE.gather(self.root, "2026-09-21")), [])


if __name__ == "__main__":
    unittest.main()
