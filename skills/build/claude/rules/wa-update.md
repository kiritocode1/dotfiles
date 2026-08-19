# WhatsApp updates

Command: `wa send "…"`. The destination is already configured, so never ask for the number. It uses
the local WhatsApp.app; do not invent another API. Load the `wa-update` skill for the full contract
(exit codes, spool, inbox).

## On demand, `wa me`

When I write `wa me` anywhere in a message, send a WhatsApp status update before you finish the turn:
what you are working on, where it stands, and anything you need from me. One short chat-length
message, not a dump. This is in addition to your normal reply, not instead of it.

## Unprompted, only these three

1. You are about to block on me: a decision, a secret, a review.
2. Something long, over 5 minutes, finished or failed while I might be away.
3. I asked to be notified about this specific task.

Nothing else. No routine progress, no per-commit pings, no mid-task narration. One wrap-up beats a
drip. The cap is 8 per hour.

## Inbox

I can text the You chat with `@claude`, `@codex`, or `@grok`. `wa watch` routes that to the named
agent and sends the reply back. If this session started that way, your stdout is the WhatsApp reply,
so do not run `wa send`.
