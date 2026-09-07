# Plan: Field Events — Information Form

## Status

`ok`

## Requirement

Source: `start-content_source.json` (ref: `docs/spec/spec-field-events-information.md`),
"Field Events: Information Form" — a standalone, greenfield example on the `opt_automated`
entity. It asks for one new flat JavaScript web resource, `opt_automated_operations.js`,
registered on the Main form named **Information** (formId
`369b7486-f8c5-4b5e-a11e-947ed36503f9`), with exactly two direct field `onchange`
registrations:

- `opt_length` → `OptruaAutomatedSdk.onLengthChange` — a warning form notification
  (`opt-length-threshold`) shown only when the field's value is strictly greater than 100,
  cleared at 100 or below, working whether `opt_length` is text or numeric.
- `opt_newcolumn` → `OptruaAutomatedSdk.onNewColumnChange` — a required-value form
  notification (`opt-newcolumn-required`) shown when the field is empty, cleared when it has
  a value.

The requirement's own "Exact Registration Contract" section already specifies the resource
name, namespace, target form, and both registrations verbatim — this plan adopts that
contract rather than re-deriving it, since it agrees exactly with what the bundle's naming
and event-registration grammar would independently produce (see Design decisions below).

## Live state

Read from `docs/tasks/field-events-information-00f08d0e/metadata/opt_automated.json`
(`mode: entity`, fetched against `https://optrua-dev.crm.dynamics.com`):

- **Entity**: `opt_automated` exists (`exists: true`). Primary name attribute is
  `opt_newcolumn` (`String`, `requiredLevel: ApplicationRequired`). `opt_length` is a
  `String` column, `requiredLevel: Recommended` — confirming FR-8's concern is real: the
  column is text today, not numeric, so `onLengthChange` must parse/compare correctly
  regardless.
- **Forms**: the entity has an ambiguous "Information" name across three form types (Card,
  QuickView, Main) plus a "Card" type also literally named "Information". The metadata's own
  warning flags this and scopes the cross-reference to the **Main** form
  (`369b7486-f8c5-4b5e-a11e-947ed36503f9`), which is what "Main form named Information" in the
  requirement means. That Main form's `fieldsPresent` includes both `opt_length` and
  `opt_newcolumn`, so both target controls exist on the target form.
- **`formCrossReference`** for that Main form: `formLibraries: []`, `events: []` — the form
  has no web resource of any kind registered today. `webResources: []` at the entity level
  confirms nothing is deployed to extend. This is a first-time attachment, not an extension.
  (The inventory is form-scoped by construction — a resource no form references would be
  invisible here — but the entity-level `webResources: []` plus the explicit
  `formCrossReference.conclusion` together make it very unlikely anything relevant is hidden
  from this read; the writing skill's live name probe is what finally settles it.)
- **No competing automation**: `plugins: {}`, `customApis: []`, `businessRules: []`,
  `flows: []`, `classicWorkflows: []` are all empty for this entity — nothing server-side
  already enforces either the length threshold or the required-value UX, and nothing would
  conflict with adding them client-side.
- **Publisher prefix**: `docs/tasks/.../solution-prepare-result.json` records
  `publisher_prefix: "opt"` for solution `workflow05`, agreeing with the `publisher_prefix=opt`
  input. No conflict, so Step 2's resolution query was skipped per the skill's own rule for a
  supplied prefix.

## Design decisions

- **New resource, not an extension.** The live `formCrossReference` shows zero existing
  libraries or events on the target form, so there is nothing to extend — `origin: new` is
  the only option the live state supports, and it also matches the requirement's own AD-1
  (option B chosen explicitly, standalone example, no assumed prior deployment).
- **Namespace `OptruaAutomatedSdk`.** Derived per `naming-and-structure.md`'s grammar
  `{ClientName}{EntityName}Sdk`: the client root comes from the first host label of
  `optrua-dev.crm.dynamics.com` (`optrua`, with the recognized `-dev` environment suffix
  stripped and only the first character capitalized → `Optrua`), and the entity segment from
  `opt_automated` split at its first underscore (`automated` → `Automated`). This yields
  `OptruaAutomatedSdk`, exactly what the requirement's contract already names — confirming
  the requirement's namespace choice rather than introducing a different one.
- **Two field `onchange` registrations, nothing else.** Per `event-registration.md`'s
  direct-field-binding pattern and the requirement's explicit Out of Scope (no `onload`,
  no `onsave`, no other field). `events[]` in the spec and `registrations[]` in
  `event-registrations.yaml` both carry exactly these two entries, matching the requirement's
  Exact Registration Contract verbatim.
- **Both notifications are form-level, not field-level tooltips**, per the requirement's own
  DD-1 and consistent with `client-api.md`'s stable-ID set/clear semantics — `setNotification`
  with a fixed ID is idempotent, which is what FR-6/FR-7 (down-transition through exactly 100)
  and FR-12 (clearing on value present) both depend on.
- **`opt_newcolumn` is already `ApplicationRequired` at the platform level** (it is the primary
  name attribute) — this was checked against `implementation-decisions.md`'s "custom
  save-block notification on an already-required field" concern before proceeding. That
  concern applies to a **save-time** block where the native required-field validation
  preempts a custom notification the user needs to see at save. Here, `onNewColumnChange` is
  an `onchange`-time notification only (BD-2 explicitly rules out any form-level `onsave`
  handler in this example), so it renders immediately as the user edits the field, well before
  any save-time native validation would run. The acceptance criteria (AC-4) only requires the
  notification to appear/clear on change, not to survive or govern the save itself, so this
  does not trigger the blocking condition — it is recorded here as a checked assumption, not
  left implicit.
- **`sourceFile` chosen as `src/Resources/scripts/opt_automated_operations.js`.** The
  repository has no existing web resource source tree to follow (no `src/` directory present
  anywhere in this worktree), so the bundle's documented default layout — a `scripts/` folder
  under a project resource root — was used rather than inventing a new convention.

## Deployment order

Single-resource change: `index.json` lists exactly one entry, `opt_automated_operations.js`.
There is no shared utility and no second resource, so there is no ordering dependency to
express — the one-entry list is written per the schema's own rule that a single-resource plan
still gets a manifest.

## Assumptions

- The webresource bundle resolved at `~/.fts-kit/okfs/webresource/` (the second of the three
  documented lookup locations); `$FTS_KIT_OKFS` was unset and the plugin-relative `okfs/`
  directory does not exist in this skill installation. Guidance was applied from the resolved
  bundle, not in degraded mode.
- `origin: new` and the "no existing registrations" conclusion rest on a form-scoped
  inventory read (Step 3's documented limitation): a resource no form references would not
  appear in it. The entity-level `webResources: []` and the explicit
  `formCrossReference.conclusion` in the metadata both corroborate "nothing deployed," but the
  writing skill's live name probe for `opt_automated_operations.js` is what finally confirms
  no resource of that exact name already exists before it is created.
- The target Main form's display name "Information" was matched via the metadata's own
  disambiguation (`formId 369b7486-...`, `type: Main`) rather than re-derived independently;
  this plan trusts that prior resolution rather than re-querying the forms endpoint.
- `opt_length`'s live column type (`String`) was read directly from the metadata rather than
  inferred — FR-8's text-or-numeric requirement is confirmed as a real, current condition, not
  a hypothetical the writing skill can treat as unlikely.

## Out of scope

- **Server-side enforcement of the length threshold or the required value.** Both
  notifications here are client-side UX only; nothing in this plan adds a plug-in, Custom
  API, or business rule to enforce either rule for API-driven or integration-driven writes
  that bypass the form. The requirement's own Non-Functional Requirements section does not
  ask for this, but it is worth naming as unmet server-side enforcement if that turns out to
  matter later.
- **Any ribbon, ribbon button, PCF/code component, entity schema change, security-role
  change, plug-in, flow, or business rule.** None of these are implicated by this
  requirement at all — it is a pure two-registration client-side example — so there is
  nothing of this kind to record as outstanding.
