---
name: disk-cleanup
description: Free disk space on this Mac without losing anything that matters. Deletes only what rebuilds itself (node_modules, .next and similar project folders, app and tool caches through Mole), skips projects with a running process, and lists everything else (Downloads, recordings, SDKs, simulator runtimes, apps, agent transcripts, .plannotator reviews) for the user to pick. Never touches browser logins, cookies, keychains, iCloud, .git, .env or private keys. Use when the disk is full or low, when asked to free space, clean up, remove caches or unused programs, or before a large install or build.
---

# Disk cleanup

One CLI, three tiers. Tier 1 is deleted without asking. Tier 3 is only listed until the user picks rows.

```sh
node ~/.claude/skills/disk-cleanup/cleanup.ts scan              # read-only, about 90 s
node ~/.claude/skills/disk-cleanup/cleanup.ts clean             # tier 1
node ~/.claude/skills/disk-cleanup/cleanup.ts remove <path>...  # tier 3 rows the user picked
```

Every command takes `--json` and `--help`; `clean` and `remove` take `--dry-run`. Exit codes: 0 ok,
1 error, 2 refused (nothing was deleted).

| Tier | What | Who deletes it |
| --- | --- | --- |
| 1. Rebuildable | `node_modules`, `.next`, `.turbo`, `.expo`, `.svelte-kit`, `.nuxt`, `.parcel-cache`, `DerivedData` under the roots in `config.json`; caches through `mo clean`; `pnpm store prune` | `clean`, no questions |
| 2. Skipped by Mole | caches of apps that are open, or that need sudo | the next `clean` after the app is closed |
| 3. Yours | Downloads, Cap recordings, Android SDK and emulators, simulator runtimes, `.plannotator` folders, agent transcripts, the largest apps | only after the user picks: `remove`, `mo uninstall` for apps, `xcrun simctl runtime delete <id>` for runtimes |

## Procedure

1. Run `scan`. Report free space, the tier 1 total, which projects were skipped and why, and the
   tier 3 table.
2. Run `clean`. It needs no confirmation; that was agreed. Report the GB freed from its last line.
3. Show the tier 3 table and ask which rows to delete. Say what each row is in plain words. Point
   out rows that hold personal files (Downloads, recordings, transcripts) rather than tools.
4. Delete only the rows the user named, with the command shown in the row. Report the GB freed.

## What it never deletes

The script refuses these on its own; do not work around a refusal with `rm`:

- Chrome and Helium profiles: logins, cookies, Web Data, extensions. Only their cache folders may go.
- `~/Library/Keychains`, `~/.ssh`, `~/Library/Mobile Documents` (iCloud), and any folder that contains them.
- `.git`, `.env*`, `*.key`, and `*.pem` files that hold a private key, or a folder holding one. A
  `~/Downloads` holding a server key is refused; tell the user to move the key first.
- `dist`, `build`, `target`, `.vercel` and `.wrangler`. These can hold source, a project link or local
  database data.
- Any project with a process whose working folder is inside it, such as a dev server or an agent.

## Notes

- Mole (`brew install mole`) runs with stdin closed, which it treats as non-interactive: user caches
  only, no prompts. System caches need sudo and are skipped. Without Mole, `clean` still deletes the
  project folders and says the caches were not cleaned.
- Deleted `node_modules` come back with the project's install command. Mention it when a skipped
  project's dev server is the reason space stayed used.
- Add project roots or folder names in `config.json`. Run `node --test cleanup.test.ts` after
  changing the protection rules.
