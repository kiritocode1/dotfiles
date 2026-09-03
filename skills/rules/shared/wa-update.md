# WhatsApp updates

`wa send "..."` messages the owner's phone. The destination is configured, so
never ask for the number. The `wa-update` skill carries the exit codes and the
rest of the contract.

The `wa-auto` hook, not you, handles three triggers: the owner writing `wa me`,
a turn over five minutes ending while they are away from this terminal, and
Claude Code blocking on their input. Do not duplicate those. If the hook puts a
`wa me` instruction in your turn, follow it.

Yours to judge: they asked to be notified about this specific task. One wrap-up,
never a drip, nothing routine.

If `wa watch` started this session, your stdout is the reply. Do not run `wa send`.
