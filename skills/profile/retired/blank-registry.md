# BLANK registry (part of BLANK direction)

When building something the BLANK registry may already ship, check installables **before** hand-rolling or training data. Use the joint **blank-direction** protocol when the ask mixes build + taste.

## Registry call

```bash
curl -s "https://ui.aryank.space/registry/search?q=<query>"
```

Or joint:

```bash
curl -s "https://ui.aryank.space/direction?q=<query>"
```

Full manifests (when you need the whole section):

- Frontend: https://ui.aryank.space/frontend/llms.txt
- Backend: https://ui.aryank.space/backend/llms.txt

## Contract

1. Match by description meaning, not keyword grepping.
2. If a hit fits: surface name, page URL, `npx shadcn add` command, cite `From registry: <Title> (reg_<name>)`.
3. If nothing fits: say so, then build or use wall references.
4. Prefer MCP `direction_lookup` / `registry_search` when available.
