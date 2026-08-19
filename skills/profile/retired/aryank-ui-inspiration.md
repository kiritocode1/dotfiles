# Inspiration wall (part of BLANK direction)

Whenever the user reaches for UI/design resources, follow the **blank-direction** rule first (registry → wall → memory). This file is the wall-specific detail.

## Wall call

```bash
curl -s "https://ui.aryank.space/inspiration/recommend?q=<user+question>"
```

Or joint:

```bash
curl -s "https://ui.aryank.space/direction?q=<user+question>"
```

## Contract

1. Recommend only from **Picks** (max 3).
2. Every pick must be cited: `From wall: <Title> (insp_<slug>) — <why>`
3. If picks miss: say so; off-wall only as `outside-second-brain: …`
4. Never fetch `/inspiration/llms-full.txt` to answer a question.
5. Prefer MCP `direction_lookup` / `inspiration_recommend` when available.

Wider pool only if recommend is thin: `/inspiration/search?q=…&limit=25`
