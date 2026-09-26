# Browser demo videos with webreel

Use webreel for repeatable browser demo videos, tutorials, walkthroughs, changelog clips and Plannotator evidence for browser behavior changes. Keep ordinary web QA in Agent Browser. Keep native, React Native, device, Electron and CDP recording in Argent.

For local apps, record the named portless URL. Create or reuse `webreel.config.json` with `$schema: "https://webreel.dev/schema/v1.json"`, an explicit viewport, named videos and output paths. Use selectors and visible text from the running page.

Run the named flow through validation, recording and file inspection:

```bash
npx webreel validate -c <config>
npx webreel record -c <config> <name> --dry-run
npx webreel record -c <config> <name>
```

Omit `<name>` only when every configured video is requested. For Plannotator, keep the config and video under `.plannotator/<change>/`; record the proposal, then rerun the same named flow and viewport after implementation. Confirm the output exists and is non-empty. Report the config, video name, output path, format, simulated data and failures. If Chrome or FFmpeg setup fails, retry once and report the exact error. Never delete `~/.webreel` without approval.
