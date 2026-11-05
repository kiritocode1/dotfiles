/**
 * OpenCode plugin: runs the blank-direction gate on every tool call.
 *
 * OpenCode has no settings-file hooks, so this plugin builds the Claude-style event the
 * gate reads. A gate exit of 2 throws, which fails the tool call with the gate's reason;
 * anything else lets it run, so a broken gate never stops work. bin/install links this
 * file into ~/.config/opencode/plugins/, where OpenCode auto-discovers it.
 *
 * One default export serves both plugin APIs: OpenCode 2 reads `id` and `setup`,
 * OpenCode 1.18 calls `server`.
 */
import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The link lives in ~/.config; the gate sits beside the real file in the dotfiles repo.
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

async function gate(session: string, tool: string, input: unknown): Promise<void> {
  const { code, reason } = await runGate("gate", {
    session_id: `opencode-${session}`,
    hook_event_name: "PreToolUse",
    tool_name: tool,
    tool_input: input,
  });
  if (code === 2) throw new Error(reason);
}

async function mark(session: string, tool: string, input: unknown, response: unknown, failed: boolean): Promise<void> {
  await runGate("mark", {
    session_id: `opencode-${session}`,
    hook_event_name: failed ? "PostToolUseFailure" : "PostToolUse",
    tool_name: tool,
    tool_input: input,
    tool_response: response,
  });
}

type V2Before = { tool: string; input: unknown; sessionID?: string; callID?: string };
type V2After = { tool?: string; input?: unknown; sessionID?: string; callID?: string } & (
  | { status: "completed"; result: unknown }
  | { status: "error"; error: { message: string } }
);
type V2Context = {
  session?: { id?: string };
  tool: {
    hook(name: "execute.before", cb: (event: V2Before) => Promise<void>): Promise<unknown>;
    hook(name: "execute.after", cb: (event: V2After) => Promise<void>): Promise<unknown>;
  };
};

export default {
  id: "blank-direction-gate",

  async setup(ctx: V2Context) {
    // The after event may not repeat the call's tool and input, so remember them by call.
    const calls = new Map<string, V2Before>();
    // Without a session id, one OpenCode process counts as one session.
    const sessionOf = (e: { sessionID?: string }) => e.sessionID ?? ctx.session?.id ?? `pid-${process.pid}`;
    await ctx.tool.hook("execute.before", async (event) => {
      calls.set(event.callID ?? "last", event);
      await gate(sessionOf(event), event.tool, event.input);
    });
    await ctx.tool.hook("execute.after", async (event) => {
      const key = event.callID ?? "last";
      const before = calls.get(key);
      calls.delete(key);
      const tool = event.tool ?? before?.tool ?? "";
      const input = event.input ?? before?.input ?? {};
      const response = event.status === "completed" ? event.result : event.error.message;
      await mark(sessionOf(event), tool, input, response, event.status === "error");
    });
  },

  async server() {
    return {
      "tool.execute.before": async (input: { tool: string; sessionID: string }, output: { args: unknown }) => {
        await gate(input.sessionID, input.tool, output.args);
      },
      "tool.execute.after": async (
        input: { tool: string; sessionID: string; args: unknown },
        output: { output: string },
      ) => {
        await mark(input.sessionID, input.tool, input.args, output.output, false);
      },
    };
  },
};
