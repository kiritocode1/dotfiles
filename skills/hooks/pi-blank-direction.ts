/**
 * Pi extension: runs the blank-direction gate on every tool call.
 *
 * Pi has no settings-file hooks, so this extension builds the Claude-style event the
 * gate reads and acts on its answer. A gate exit of 2 blocks the call with the gate's
 * reason; anything else lets it run, so a broken gate never stops work. bin/install
 * links this file into ~/.pi/agent/extensions/, where pi auto-discovers it.
 */
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// The link lives in ~/.pi; the gate sits beside the real file in the dotfiles repo.
const GATE = join(dirname(realpathSync(fileURLToPath(import.meta.url))), "blank-direction-gate");

type GateEvent = {
  session_id: string;
  hook_event_name: "PreToolUse" | "PostToolUse" | "PostToolUseFailure";
  tool_name: string;
  tool_input: unknown;
  tool_response?: unknown;
};

/** Exit code and stderr of one gate run. Spawn failures count as "let it run". */
function runGate(mode: "gate" | "mark", event: GateEvent): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    const child = spawn(GATE, [mode], { stdio: ["pipe", "ignore", "pipe"] });
    let reason = "";
    child.stderr.on("data", (chunk) => (reason += chunk));
    child.on("error", () => resolve({ code: 0, reason: "" }));
    child.on("close", (code) => resolve({ code: code ?? 0, reason: reason.trim() }));
    child.stdin.end(JSON.stringify(event));
  });
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    const { code, reason } = await runGate("gate", {
      session_id: `pi-${ctx.sessionManager.getSessionId()}`,
      hook_event_name: "PreToolUse",
      tool_name: event.toolName,
      tool_input: event.input,
    });
    if (code === 2) return { block: true, reason };
  });

  pi.on("tool_result", async (event, ctx) => {
    await runGate("mark", {
      session_id: `pi-${ctx.sessionManager.getSessionId()}`,
      hook_event_name: event.isError ? "PostToolUseFailure" : "PostToolUse",
      tool_name: event.toolName,
      tool_input: event.input,
      tool_response: event.content,
    });
  });
}
