# Web Resource Plan — Default "order:" Title on New Automated Records

## Status

`ok` — spec, `index.json`, and `event-registrations.yaml` written to
`docs/tasks/dataverse-requirements-specification-db3fc47d/spec/`. `resource_count: 1`.

## Requirement

Source: `start-content_source.json` (normalized requirement, title "Dataverse Requirements
Specification: Default \"order:\" Title on New Automated Records"), grounded against
`https://optrua-dev.crm.dynamics.com`.

When a user opens a brand-new `opt_automated` record on "Automated form", the `onload`
handler must set `opt_title` to the literal text `order:` — overwrite unconditionally on
create, never touch it on any other form type (FR-1, FR-2). This is additive inside the
already-deployed `OptruaAutomatedSdk.formOnLoad` function; nothing already in that function
body is read, summarized, or altered (FR-3). Separately, "Automated form"'s `onload` event
node was found live with `active="false"` even though its `Handler` element is
`enabled="true"`, so the existing handler (and the new logic riding inside it) is not
confirmed to run today; this specification corrects that one event's activation (FR-4) and
leaves `onsave` — also `active="false"` — untouched (FR-5), per explicit user scoping.

## Live State

Read from `docs/tasks/dataverse-requirements-specification-db3fc47d/metadata/opt_automated.json`
(unified inventory envelope, facets `entity`, `forms`, `web-resources`, `plugins`, `processes`):

- **Entity**: `opt_automated` ("Automated") exists. `opt_title` (String, "Title",
  `RequiredLevel: None`) exists exactly as the requirement describes; the primary name
  attribute is the unrelated `opt_newcolumn`.
- **Forms**: `data.facets.forms.data.forms[]` lists "Automated form" (Main,
  `f517761c-5e4c-f111-bec6-7ced8d6feee8`) and "Information" (Main, Card, QuickViewForm). Only
  "Automated form" carries `opt_title` and is the target form; "Information" is out of scope
  and untouched.
- **Form usage**: `data.facets.forms.data.formUsage.libraries[]` shows `opt_automated_main_operations.js`
  already loaded by "Automated form". `formUsage.handlers[]` shows two registrations on that
  form: `onload` → `OptruaAutomatedSdk.formOnLoad` and `onsave` → `OptruaAutomatedSdk.formOnSave`,
  both `enabled: true`, `passContext: true`. This inventory facet reports handler-`enabled`
  state, not the FormXml `<event active="...">` flag; the `active="false"` finding on the
  `onload` event node is carried over from the requirement's own live FormXml read and was not
  re-verified independently in this planning pass.
- **Web resources**: `data.facets.web-resources.data.webResources[]` confirms
  `opt_automated_main_operations.js` (`webResourceId 3db7b0d2-9dab-f111-aaac-0022480b1bfa`,
  type JavaScript, unmanaged) with `usedByForms[]` naming "Automated form"
  (`f517761c-5e4c-f111-bec6-7ced8d6feee8`). This rules out treating the resource as `new`: it
  is extended, not duplicated. Per the bundle's `implementation-decisions.md`, an entity-scoped
  inventory's web-resource facet is form-scoped by construction — a resource no form
  references would be invisible to it — but that blind spot does not apply here since the
  resource in question is precisely the one this form already loads; the match is direct, not
  inferred.
- **Plugins / processes**: read but not load-bearing for this change; no automation on
  `opt_automated` overlaps with a client-side `opt_title` default. Confirms this is purely a
  UI-convenience default with no server-side counterpart already covering it.
- **Handler body**: `OptruaAutomatedSdk.formOnLoad`'s current source was deliberately not
  downloaded or read in this planning pass — the requirement (AU-3) records this as an explicit
  user instruction to preserve existing behavior exactly and proceed without reading it first.
  This means the registration-presence evidence above (handler already wired, `enabled: true`)
  is not itself proof that the CREATE-only `opt_title` default already exists in that function;
  it plainly does not, since the requirement states the field is currently left empty on create.
  The writing step must download the live content before editing (per `deployment-gotchas.md`'s
  wholesale-content-PATCH hazard) and is not relieved of that read by anything recorded here.

## Design Decisions

- **Extend, don't duplicate** (`origin: existing`). `opt_automated_main_operations.js` is
  already the sole library on "Automated form" and already owns `onload`. A second `onload`
  handler function would add a redundant registration and execution-order coupling for no
  benefit — `implementation-decisions.md`, "Extend or add?". `context.reuseRefs[]` in the spec
  points at the two inventory entries that proved it.
- **One resource, one spec entry, single-entry `index.json`.** No shared utility is introduced
  and nothing else consumes this script, so there is no ordering dependency to encode beyond
  the mandatory one-entry manifest.
- **Only the `onload` event appears in `events[]` and in `event-registrations.yaml`.** `onsave`
  is deployed, working, and explicitly out of scope (FR-5); the wiring contract states only
  requested intent, per `references/event-registrations-schema.yaml`, so restating `onsave`
  would assert a change to it that was never asked for. The `onload` entry does double duty: it
  is both the pre-existing registration (unchanged in name/handler/passExecutionContext) and
  the vehicle by which deployment's FormXml patch is expected to leave that event node
  `active="true"`, correcting the inactive state FR-4 asks for.
- **No new namespace.** `OptruaAutomatedSdk` already matches the bundle's derivation grammar
  for `optrua-dev.crm.dynamics.com` + `opt_automated` (client root `Optrua`, entity segment
  `Automated`) exactly, so the deployed namespace is reused verbatim rather than superseded —
  `naming-and-structure.md`.
- **`removes: []`.** Nothing is being deleted from the deployed resource; FR-3 is explicit that
  the addition is purely additive.
- **`sourceFile` path chosen fresh.** No existing web-resource source tree was found in this
  repository (only `docs/` and `README.md` exist at the repo root), so
  `src/Resources/scripts/opt-automated-main-operations.js` was chosen following the spec
  contract's documented convention (`scripts/` folder under a resource root) rather than an
  established project layout, since none exists yet.

## Deployment Order

Single resource, single entry — no ordering dependency applies. `index.json` still carries the
full `{publisherPrefix, webResources: [...]}` manifest shape rather than a bare name list, per
the schema.

## Assumptions

- The `webresource` bundle resolved successfully at `~/.fts-kit/okfs/webresource/` (no
  `FTS_KIT_OKFS` override was set). This plan is not degraded.
- `publisher_prefix` was supplied as `opt` and used as-is; Step 2's solution-based resolution
  query was skipped per the skill's own rule. The requirement's own grounding independently
  observed `opt_` on every target entity, field, and web-resource name, so the supplied value
  and the live naming are consistent, but this was not re-verified against a `solutions` query
  in this run.
- The `onload` event node's live `active="false"` state (versus the `Handler` element's
  `enabled="true"`) was not independently re-confirmed by this planning pass; it is carried
  forward from the requirement document's own recorded live FormXml read. The deployment step
  is what will actually re-assert `active="true"` and its own verification is what settles
  whether the correction took.
- `OptruaAutomatedSdk.formOnLoad`'s current body was not read in this pass (deliberate, per
  AU-3) — the writing step must read the deployed content before editing, and that read (not
  anything in this plan) is what determines exactly where the additive FR-1/FR-2 logic is
  inserted and confirms no existing statement needs to move.
- No target solution was named by the requirement (ALM-1, deferred). This plan does not
  reference a solution scope; whichever unmanaged solution already contains
  `opt_automated_main_operations.js` in `optrua-dev` is presumed usable at deploy time, but this
  was not confirmed by a live solution-components query in this planning pass.

## Out of Scope

- Reactivating the `onsave` event on "Automated form" — stays `active="false"` (FR-5).
- Reading, summarizing, or modifying any pre-existing statement inside
  `OptruaAutomatedSdk.formOnLoad` or the separate `OptruaAutomatedSdk.formOnSave` function.
- Any change to the "Information" Main form (no `opt_title` control present there).
- Enforcing the `order:` default for records created via Web API, import, or any
  non-interactive path — this is a form-load-time-only UI convenience (SEC-2); closing that gap
  would need a plug-in or a synchronous flow on `Create`, which was explicitly not requested.
- Backfilling `opt_title` on existing `opt_automated` records (MIG-1).
- Any platform-level (column) default value configuration on `opt_title`.
- Naming or creating a target solution for this change (ALM-1) — deferred by the requirement's
  own author; resolving it is a prerequisite for the deploy step, not something this plan
  settles.
