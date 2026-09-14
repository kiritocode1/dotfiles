# Model format and tools

Inspected 2026-09-14 at upstream commit `5da903ca48bfcf2cd737697550bfccbf137c7fea`.
CLI package version `0.39.3`, core schema `0.34.1`, Studio `0.6.11`.
CLI create/get/audit and the Studio model/walkthrough view were exercised locally on 2026-09-14.
The model passed the pinned schema and its call sites executed in a read-only Python build trace.
Check the installed CLI's help when versions differ.

Sources:

- [Project and documentation](https://principal-ai.github.io/subsystem-modeling/)
- [Upstream authoring skill](https://github.com/principal-ai/subsystem-modeling/blob/5da903ca48bfcf2cd737697550bfccbf137c7fea/skills/create-subsystem-model/SKILL.md)
- [Portable schema](https://github.com/principal-ai/subsystem-modeling/blob/5da903ca48bfcf2cd737697550bfccbf137c7fea/packages/subsystems-core/schemas/subsystem-model.schema.json)
- [CLI implementation](https://github.com/principal-ai/subsystem-modeling/blob/5da903ca48bfcf2cd737697550bfccbf137c7fea/packages/principal-studio-cli/src/commands/subsystem-model.ts)
- [Maintenance documentation](https://github.com/principal-ai/subsystem-modeling/tree/5da903ca48bfcf2cd737697550bfccbf137c7fea/site/src/pages/maintainer)

This is a task-specific guide derived from the source, not a copy of its full manual. The project
packages declare Apache-2.0. Retain upstream notices if vendoring their files.

## Use cases

| Need | Build or inspect | Evidence to add |
| --- | --- | --- |
| Understand an old system or onboard someone | Constructs and static topology, then a named execution walkthrough | Entry and exit, inputs, outputs, owners, real source locations, and terminology |
| Assess code usefulness or complexity | Consumer path and the guarantee each component supplies | Requirement, actual callers, usage if available, maintenance/runtime cost, and what removal would change |
| Plan a feature or compare architectures | Separate current and proposed models with matching IDs for retained constructs | New responsibility, reused behavior, changed boundaries, alternatives, and acceptance checks |
| Refactor, migrate, replace a dependency, or remove code | Before/after topology and equivalent walkthroughs | Affected consumers, compatibility, transition states, retained guarantees, and rollback where relevant |
| Debug a bug or incident | Expected walkthrough beside the observed path, with failure and recovery branches as separate stories | Reproduction, relevant logs or traces, triggering state, retries, cancellation, and unresolved hypotheses |
| Investigate performance or cost | Runtime boundaries and the path that repeats or waits | Measured latency, query/request counts, payload size, or cost with the measurement conditions |
| Inspect an API, event, queue, or data pipeline | Process frames, stores, external systems, and ordered producer/consumer steps | Contract, persistence, ordering, fan-out, idempotency, and ownership where the code makes those claims |
| Review authorization or tenant isolation | The relevant boundary crossings and identity/data paths | Actual checks and negative-case evidence; a process frame alone does not prove isolation |
| Plan tests or review a change | Walkthroughs mapped to the changed guarantees | Existing tests, untested branches, smallest meaningful checks, and observed results |
| Maintain documentation across changes | Re-audit existing constructs, relations, boundaries, and walkthrough sites | Changed revision, stale claims, correction proposals, and remaining verification gaps |
| Explain multiple repositories, languages, or runtimes | Repository identity plus module and process frames | Correct root bindings, real declarations, external contracts, and unsupported parser coverage |
| Explain people or agents interacting with code | Explicit authored actors alongside real code constructs | Actor action, handoff, retained state, and where control returns to code |

These are routes through the same model format. Use the relevant rows; do not perform every
investigation for every task. Support both new and old systems without assuming a framework.

## Format

The portable document accepts only `$schema`, `title`, `description`, `components`, `relations`,
and `walkthroughs`. The required top-level fields are `title`, `components`, and `relations`.
Use empty `relations` when no static relationship is needed.

| Item | Required fields | Important optional fields |
| --- | --- | --- |
| Component | `id`, `name`, `construct`, `file`, `purl` | `symbol`, `purpose`, `role`, `proposed`, `process`, `module`, `framework`, `stereotype`, `declaration`, `declarationProvenance` |
| Relation | `id`, `from`, `to`, `relationType` | `refs` with source evidence |
| Walkthrough | `id`, `title`, `steps` | None needed |
| Step | `from`, `to`, `mechanism`, `file`, `line` | `symbol`, `annotation` |

Component and relation IDs must be stable and unique. Endpoints use component IDs, not display
names. Source paths are repository-relative; source lines start at 1. `purl` identifies the actual
repository/package, such as `pkg:github/owner/repo#src/file.ts`. Do not invent a GitHub repository
for local-only code; use an appropriate package identity supported by the current tool.

Closed vocabularies:

- `construct`: `class`, `function`, `method`, `interface`, `type_alias`, `enum`, `store`,
  `external`, `custom_entity`.
- `role`: `entry`, `service`.
- `relationType`: `imports`, `method`, `extends`, `inherits`, `implements`, `mixes_in`,
  `references`.
- Step `mechanism`: `calls`, `uses`, `feeds`, `produces`, `writes`, `reads`, `watches`,
  `registers-into`.

`method` uses a real method symbol such as `ClassName.methodName`. A module-scope registry may be
a `store`. A queue, person, or agent without a declaration can be `custom_entity`, with `entityKind`
and an empty `file`; pure externals can also have an empty `file`. Do not use `external` to disguise
planned in-repository code. Use its intended construct plus `proposed: true`.

`module` groups symbols by source file; `process` groups them by deployment unit. Multi-member
groups draw frames. `framework` and `stereotype` identify framework roles without changing the
underlying construct, such as a React component represented by a function.

Handwritten declarations must use `declarationProvenance: "authored"`. Reserve `"verified"` for
tool-extracted declarations. Purpose and annotation text remain authored explanations, regardless
of the status of source checks. Runtime display edges are derived from walkthrough steps; do not
author an `edges` array or put runtime `calls` in `relations`.

## Authoring example

This is a format example, not evidence that these files exist in a target repository. Replace
all identities and sites with inspected code before using it.

```json
{
  "$schema": "https://principal-ai.dev/schemas/subsystem-model.schema.json",
  "title": "Save a draft",
  "components": [
    {
      "id": "save",
      "name": "saveDraft",
      "construct": "function",
      "file": "src/drafts.ts",
      "purl": "pkg:github/example/app#src/drafts.ts",
      "symbol": "saveDraft",
      "purpose": "Persist the edited draft.",
      "process": "api",
      "module": "src/drafts.ts"
    },
    {
      "id": "write",
      "name": "writeDraft",
      "construct": "function",
      "file": "src/repository.ts",
      "purl": "pkg:github/example/app#src/repository.ts",
      "symbol": "writeDraft",
      "purpose": "Write the draft to storage.",
      "process": "api",
      "module": "src/repository.ts"
    }
  ],
  "relations": [
    {
      "id": "save-imports-write",
      "from": "save",
      "to": "write",
      "relationType": "imports",
      "refs": ["pkg:github/example/app#src/drafts.ts"]
    }
  ],
  "walkthroughs": [
    {
      "id": "save-draft",
      "title": "Save an edited draft",
      "steps": [
        {
          "from": "save",
          "to": "write",
          "mechanism": "calls",
          "file": "src/drafts.ts",
          "line": 12,
          "symbol": "saveDraft",
          "annotation": "Pass the validated draft to storage."
        }
      ]
    }
  ]
}
```

## CLI

Use the known Principal Studio CLI package. An unrelated older `principal-ai` binary may exist;
check its help before reusing it. Prefer an already verified local installation, otherwise use:

```bash
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model --help
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model create --file model.local.json
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model create --file model.local.json --no-open
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model open <model-id>
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model get <model-id>
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model list
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model audit <model-id>
```

The two create commands are alternatives. Do not run both and create duplicate records.
The CLI stores models under `~/.principal/subsystem-models/`. A successful create prints
`{ "ok": true, "graph": ... }`. Save `graph.id`. Its optional Studio dependency currently targets
macOS arm64. `create` can save a model and still fail to open the viewer, so inspect stderr and
the actual opening result separately. Do not report "opened" based on `ok: true` alone.

For local source browsing, derive an unshared host payload from the portable file with `repoRoot`,
or `repoRoots` keyed by repository purl for multiple checkouts. These fields, and the stored ID
and verification results, belong to the host record rather than the portable schema. Avoid
committing absolute local roots to a portable model.

`audit`, `proposals`, `propose`, `accept`, and `reject` require a running Studio HTTP service.
Use `open <model-id>` or `open-studio` to launch it. Do not guess raw bridge endpoints or conflate
the Studio service with a user-facing web preview server.

If Studio already shows the model, select its row or existing tab. In the local 0.39.3/0.6.11 test,
CLI `open` attempted another launch and hit an occupied Studio service port. Selecting the existing
model in the UI worked. On this failure, reuse the running app instead of repeating the launch or
killing the process that owns the port.

```bash
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model proposals <model-id>
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model propose <model-id> --file correction.json
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model accept <model-id> <proposal-id>
npx -y @principal-ai/principal-studio-cli@0.39.3 subsystem-model reject <model-id> <proposal-id>
```

These are separate actions, not a sequence to run automatically. Proposals accept a payload with
`rationale`, `changes`, and optional `finding` and `author`. Inspect the pinned proposal types and
current help for the exact change operation. Never invent an operation or an `update` CLI command.
Check auto-accept before submitting a proposal; apply only corrections within the approved scope.

## Verification limits

The upstream docs are not fully consistent about which audit layers have shipped. Inspect the
actual response and installed version rather than copying a "fully verified" label into the report.

The local test showed why: Studio displayed FULLY VERIFIED while its report had `filesVerified: 4`,
`symbolsVerified: 0`, and four "Graphify cache missing" findings. Count the reported checks and read
the findings even when `needsUpdate` is false. Python AST inspection and an execution trace supplied
separate symbol/call-site evidence for that test; they did not make Graphify verification available.

- Offline create validates and stores a model. It does not prove source correctness.
- When Studio is running, create can use the server path that performs source and site checks.
- Construct checks and supported topology/boundary checks have their own findings. Graphify
  availability, language support, and cache freshness affect coverage. Missing evidence is a gap.
- Walkthrough create/update checks appear in `verification.walkthroughsChecked` and
  `verification.walkthroughsFailed`. Audit support for this layer is incomplete in the inspected
  docs. Do not claim the entire ordered story ran or was checked by `audit`.
- File existence, endpoint validity, or text affinity at a site does not prove execution order,
  successful integration, runtime latency, security, or business usefulness.

Correct failed claims, report unverified claims, and attach real runtime evidence when needed.
After a correction, read the stored model and re-run the relevant checks without replacing stable
IDs. A model correction changes documentation; it does not itself change or verify product code.
