# GPT Image 2.5 in Pi and Codex

The upgraded proxy generates images, but Pi has no local image tool and Codex has no configured proxy-image workflow.
Add a Pi tool and a shared CLI/skill for both clients, using the existing CPA key and account pool.
Prove client discovery, one Pi generation, one CLI edit, and unchanged credential fingerprints.

```text
Pi tool -------> shared image client -> existing CPA -> saved accounts
Codex skill ---> shared image client
```

## Files

All source lives in `~/dotfiles/pi/cpa-image/`, not the moneybees application.

| File | Today | After |
| --- | --- | --- |
| `cpa-image.ts` | Missing | Node 24 CLI and shared request function for health, generation, and editing |
| `pi-extension.ts` | Missing | Registers `cpa_image` and a read-only `/cpa-image-status` command, returns image previews and saved paths |
| `cpa-image.test.ts` | Missing | Focused tests for requests, invalid responses, cancellation, and refusing file overwrite |
| `SKILL.md` | Missing | Shared Pi/Codex workflow, exact CLI commands, credential safety and error recovery |
| `install.sh` | Missing | Idempotent links to `~/.local/bin/cpa-image`, `~/.agents/skills/cpa-image`, and `~/.pi/agent/extensions/cpa-image.ts`, with `--dry-run` and conflict checks |
| `../README.md` | Describes Pi setup | Adds the image-tool install and verification commands |

## Real choices

1. Use the existing static `CPA_KEY` and fixed local proxy endpoint. No login code, direct ChatGPT API, token-file access, or provider changes. If the environment key is missing, report that rather than copying credentials into source.

```ts
const apiKey = process.env.CPA_KEY;
if (!apiKey) throw new Error("CPA image key missing. Start from a shell with CPA_KEY configured.");
// Send only to the existing loopback proxy. Refuse redirects.
fetch("http://127.0.0.1:8317/v1/images/generations", {
  method: "POST", redirect: "error", signal,
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "gpt-image-2.5", prompt, n: 1, response_format: "b64_json", output_format: "png" }),
});
```

2. Generate when no input images are supplied, otherwise send the local files as multipart `image[]` fields to `/v1/images/edits`. Validate PNG output, save with exclusive creation and private permissions, and refuse to overwrite an existing file. Use unique default output paths. No automatic retries that could repeat a charged generation. Bound requests and propagate cancellation. Do not print raw error bodies that might contain account data.

```ts
pi.registerTool({
  name: "cpa_image",
  description: "Generate or edit images with GPT Image 2.5 through the existing account pool.",
  // Prompt, optional input image paths, optional output PNG path, quality and size.
  async execute(_id, params, signal, _update, ctx) {
    const result = await createCpaImage({ ...params, cwd: ctx.cwd, signal });
    return {
      content: [
        { type: "text", text: `Saved ${result.path}` },
        { type: "image", source: { type: "base64", mediaType: "image/png", data: result.base64 } },
      ],
      details: { path: result.path, model: "gpt-image-2.5" },
    };
  },
});
```

3. Codex uses its documented shared user-skill discovery at `~/.agents/skills`. The skill runs `cpa-image` via its shell tool and opens the returned PNG. This gives image generation without changing `requires_openai_auth = false`. It does not enable Codex's native image tool or imitate its UI.

```sh
cpa-image health
cpa-image generate --prompt 'A blue circle on white' --output ./circle.png
cpa-image edit --image ./circle.png --prompt 'Make the circle orange' --output ./orange-circle.png
```

## Verification and account preservation

- Keep fresh private backups/fingerprints of proxy account files, Codex auth/config, and Pi auth/config if present. Never restore stale tokens over refreshed credentials.
- Run focused offline tests, load the extension in a fresh Pi process, and confirm the tool/command and shared skill load without errors.
- Exercise the Pi tool through a disposable client run and edit the saved image using the shared CLI. These checks consume a small amount of image/chat quota.
- Verify Codex discovers the skill and can run the read-only health command through its existing provider. Stop if its chat quota blocks the client check; report the limit without modifying accounts.
- Compare credential/config hashes and inspect the saved images.
- Existing Pi sessions need `/reload`; Codex may need a new thread or app restart for skill discovery. Do not terminate active sessions automatically.

## Not doing

No provider/auth-mode switch, logout/login, manual token refresh, model-catalog rewrite, proxy restart, MCP server, EasyCLIProxyAPI migration, or changes to moneybees. Preserve `codex-pool.ts` and all existing chat-model settings. The proxy may refresh credentials during ordinary requests; the new tool never does so itself.

## References used

- Installed Pi `docs/extensions.md`, `docs/skills.md`, and `examples/extensions/hello.ts` establish registration, image result structure, and discovery.
- https://developers.openai.com/codex/skills/ establishes shared user-skill discovery.
- BLANK discovery returned no suitable installable for this task. Zero BLANK source influences. outside-second-brain: installed Pi APIs and Node built-ins, no additional package needed.
