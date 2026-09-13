---
name: cpa-image
description: Generate or edit images with OpenAI GPT Image 2.5 through the existing local CLIProxyAPI account pool. Use for GPT Image 2.5 requests in Pi or Codex, proxy image-tool failures, or image generation when the native tool is unavailable. Preserves saved OAuth accounts and existing client authentication modes.
---

# CPA image generation

Use the existing proxy account pool, not a new login or API subscription. GPT Image 2.5 is an image tool, not a chat-model selection.

## Generate or edit

1. In Pi, use the `cpa_image` tool if available. Pass a prompt and a new output PNG path. For editing, include the existing local file paths in `images`. It returns the saved path and an image preview.
2. If the tool is unavailable, including in Codex, run the shared CLI through the shell tool. The CLI path is `~/.local/bin/cpa-image`. Run `--help` for options. If that link is missing, invoke `node <this-skill-directory>/cpa-image.ts`.

```sh
~/.local/bin/cpa-image generate --prompt 'A blue circle on white' --output ./generated-images/circle.png
~/.local/bin/cpa-image edit --image ./generated-images/circle.png --prompt 'Make the circle orange' --output ./generated-images/orange-circle.png
```

For long prompts use `--prompt-file path.txt`. Input images can be PNG, JPEG, or WebP, up to four files and 20 MiB each. Output is PNG. Existing files are never overwritten. Do not rerun a successful request just to get another path.

3. Read the JSON result, then open the returned `path` with the client's image-reading tool. Show or link the actual file. Do not claim an image exists if the command failed.

Generation and editing consume image quota. Each CLI invocation sends one request with no automatic retry. Cancellation or timeout can leave upstream work running, so do not immediately repeat a timed-out generation.

## Health and recovery

```sh
~/.local/bin/cpa-image health
```

Pi also has `/cpa-image-status`. Health checks read the model list and consume no image-generation quota.

- Missing `CPA_KEY`: use a shell/process that inherits the existing key configured in `~/.zshenv`. Do not print that file or the key. Pi must inherit the key when it starts; `/reload` does not change its process environment.
- Missing Pi tool: `/reload`, then check `/cpa-image-status`. The installer is `install.sh` beside this skill. It supports `--dry-run` and refuses conflicting paths.
- Missing Codex skill: start a new thread or restart the client when convenient, then use `$cpa-image`. Codex discovers this skill from `~/.agents/skills/cpa-image`. This does not enable Codex's native image tool.
- HTTP 401/403: stop and report the authentication failure. Preserve all account files, current client auth modes, and refresh tokens. No logout, login, credential copying, or manual refresh.
- HTTP 429: report quota exhaustion and wait for reset rather than retrying repeatedly.
- Connection/model errors: check the existing CPA service. This skill never restarts services or upgrades the proxy.
- Output already exists: select a new output path. No force-overwrite option exists.

The client code reads only `CPA_KEY` for authorization. It never opens OAuth files or contacts login/refresh endpoints. The existing proxy can still refresh accounts during normal use.

## Maintain and verify

Source is the real directory behind this skill's symlink, under `~/dotfiles/pi/cpa-image` on this machine.

```sh
node --test ~/dotfiles/pi/cpa-image/cpa-image.test.ts
~/dotfiles/pi/cpa-image/install.sh --dry-run
```

For a live check, generate one low-quality image, edit that image to a new path, and inspect both PNGs. Compare account/config fingerprints privately when changing the integration; never include tokens or raw upstream error bodies in reports.
