# Browser demo videos with webreel

<description>
Use [webreel](https://webreel.dev/) when the requested artifact is a repeatable browser demo video, product walkthrough, tutorial, changelog clip, or Plannotator evidence for a browser behavior change. It runs JSON-scripted steps in headless Chrome and writes MP4, GIF, or WebM with cursor motion, keystroke overlays, and sound effects.

Keep ordinary web QA in Agent Browser. Keep native, React Native, simulator, emulator, Electron, and CDP screen recording in Argent. A successful webreel recording proves that its scripted browser path ran. It does not replace interactive QA.
</description>

<availability>
webreel requires Node.js 18 or newer. Use the project-local package through `npx`; do not require a global install.

```bash
node -v
npx webreel --help
```

If the package cannot download, report the package-manager or network error. Do not substitute an unrelated recorder and call the result webreel.
</availability>

<workflow>
1. Start or reuse the app. For a local app, use its named portless URL.
2. Create or reuse `webreel.config.json`. Add the schema and name each video after the user flow rather than its page.
3. Keep deterministic setup in the config or test fixture. State which data and integrations are simulated.
4. Run `npx webreel validate -c <config>`, then `npx webreel record -c <config> <name> --dry-run`. Inspect the resolved URL, viewport, steps, and output before opening the browser.
5. Run `npx webreel record -c <config> <name>`. Omit `<name>` only when the request covers every video in the config.
6. Confirm the output file exists and is non-empty. Report the config path, video name, output path, format, and failures.

Use committed configs for flows meant to be repeated in CI or after UI changes. The `-c` flag is optional only when the config is `webreel.config.json` in the current directory. For Plannotator, keep the config and output under `.plannotator/<change>/`. Record the proposed preview before approval, then rerun the same named flow at the same viewport after implementation. Label the second video Verified implementation and exercise the flow interactively too.
</workflow>

<config>
Start from the official v1 schema:

```json
{
  "$schema": "https://webreel.dev/schema/v1.json",
  "outDir": "./videos",
  "baseUrl": "https://myapp.localhost",
  "viewport": { "width": 1440, "height": 900 },
  "videos": {
    "feature-walkthrough": {
      "url": "/feature",
      "output": "feature-walkthrough.mp4",
      "steps": []
    }
  }
}
```

Choose selectors and visible text from the running page rather than guessing. Keep the viewport and output format explicit when visual comparison or review depends on them.
</config>

<recovery>
webreel downloads Chrome and FFmpeg into `~/.webreel` on first use. Use `validate` and `--dry-run` to separate config errors from browser or encoder errors. If dependency download fails, retry the same recording once. Existing binaries can be selected through `CHROME_PATH`, `CHROME_HEADLESS_PATH`, and `FFMPEG_PATH`.

Do not delete `~/.webreel` or substitute another recorder without approval. Preserve the failed command and error in the final report if the retry fails.
</recovery>
