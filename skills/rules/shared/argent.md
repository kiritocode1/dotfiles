# Argent device work

Before native, React Native, simulator, emulator, TV, Electron or Chromium-CDP work, read `/Users/blank/dotfiles/skills/reference/argent.md` and the matching platform skill. It owns availability checks, device selection, interaction safety, profiling and cleanup. `ui-verification` owns browser-versus-device selection.

Prefer running devices. Discover elements before every tap; screenshots are not tap coordinates. Use Argent for covered device operations, not raw simulator commands. If unavailable, report it once and ask whether to continue without it. Do not load device procedures for unrelated work.
