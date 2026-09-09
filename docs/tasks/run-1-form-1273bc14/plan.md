# Web Resource Plan — Run 1: Form Events

## Status

`ok` — one new web resource spec written.

## Requirement

Source: `C:\Users\Omar Taladeh\.adw\projects\optrua-webresource-test-5f4e2873\agents\1273bc14\start-content_source.json`
(ticket body originally at `01-form-events.md`, title "Run 1: Form Events").

This is the greenfield first run of the `dataverse-webresource-lifecycle` workflow against
entity `opt_automated`. It asks for one flat JavaScript web resource,
`opt_automated_main_operations.js`, authoring an `OptruaAutomatedSdk` namespace with two
form-level handlers on the Main form named "Automated form":

- `OptruaAutomatedSdk.formOnLoad(executionContext)` — reads `opt_name` from the form context
  obtained via `executionContext.getFormContext()`; when it has a value, sets a record-name
  form notification with stable ID `opt-record-name`; sets nothing on a create form with an
  empty `opt_name`.
- `OptruaAutomatedSdk.formOnSave(executionContext)` — obtains its own form context; must not
  read `opt_newcolumn`, must not call `preventDefault()`, must not set/clear an
  `opt-newcolumn-required` notification, and must not touch the record-name notification
  `formOnLoad` owns. It ships as a registered no-op extension point for future save-time logic
  that is not already enforced by platform field requiredness.

The ticket includes an Exact Registration Contract (both events, form-level, execution context
enabled, no field events) — reproduced verbatim into `event-registrations.yaml` and the spec's
`events[]`.

## Live state

Read from `metadata/opt_automated.json` (an entity-mode inventory fetched ahead of this run;
no live query was made by this skill — every read was a pre-fetched GET result).

- Entity `opt_automated` exists, is custom and unmanaged.
- `opt_name`: String, `requiredLevel: None`.
- `opt_newcolumn`: String, `requiredLevel: ApplicationRequired` (the inventory carries an
  explicit note to this effect). This is the field the requirement calls out by name as
  already platform-enforced.
- Target form "Automated form" (formId `f517761c-5e4c-f111-bec6-7ced8d6feee8`, type Main)
  exists, carries fields `opt_title`, `opt_newcolumn`, `opt_name`, `opt_description`, and —
  per the inventory's own note — its live FormXML has **no** `<formLibraries>` and **no**
  `<events>` element at all. Zero web resources or handlers are registered on it today.
- A second Main form ("Information", formId `369b7486-...`) exists on the same entity but is
  not the target named in the requirement and is not touched by this plan.
- `webResources: []` at the entity level confirms nothing is deployed against this entity yet
  under any name.
- No plug-ins, Custom APIs, actions, business rules, flows, classic workflows, or BPFs are
  registered on `opt_automated` — nothing already enforces the record-name notification or
  duplicates the save behaviour server-side.

The inventory is form-scoped by design (it cross-references web resources against form XML),
so in general a resource no form references could still exist and be absent from it. That
caveat does not change the conclusion here: the target form's own FormXML has no
`<formLibraries>` at all, which is a stronger and more direct signal than the entity-level
`webResources: []` list alone.

## Design decisions

- **New resource, not an extension.** `origin: new`. The form's FormXML carries no
  `<formLibraries>`/`<events>` today, so there is nothing deployed on this form to extend —
  per `implementation-decisions.md`'s "Extend or add?", a resource is extended when the target
  form already loads one for the same purpose; here it does not. This is also the shape the
  ticket itself asserts ("no deployed content ... is assumed").
- **Resource shape: form script.** The requirement is behaviour while the form is open
  (a load-time notification, a save-time extension point) — `implementation-decisions.md`'s
  shape table maps that to a form script bound declaratively to the form, not a ribbon command,
  dialog, or shared utility.
- **Naming.** `opt_automated_main_operations.js` follows `naming-and-structure.md`'s
  `{prefix}_{entity}_main_operations.js` pattern: prefix `opt` (resolved and confirmed against
  `solution-prepare-result.json`, matching the supplied `publisher_prefix=opt` — no conflict),
  entity segment `automated` (the logical name `opt_automated` with the `opt_` prefix
  stripped). This also matches the exact name the ticket specifies.
- **Namespace.** `OptruaAutomatedSdk` follows the grammar in `naming-and-structure.md`:
  `ClientName` from the first host label of `org_url`
  (`optrua-dev.crm.dynamics.com` → strip the `-dev` environment suffix → `optrua` →
  capitalize first character → `Optrua`), `EntityName` from the registration entity's logical
  name split at its first underscore (`opt_automated` → `automated` → capitalize first
  character → `Automated`), giving `OptruaAutomatedSdk` — the exact example this concept
  documents, and the exact namespace the ticket names.
- **Event set: form onload and onsave only, nothing else.** Per the ticket's Exact
  Registration Contract and `naming-and-structure.md`'s guidance against an onLoad wrapper
  whose only job is to call `addOnChange` — no field-level events are declared because none
  were requested.
- **`formOnSave` is registered but intentionally inert on `opt_newcolumn`.** Checked against
  `implementation-decisions.md`'s "Custom save-block notification on an already-required
  field": `opt_newcolumn`'s live `requiredLevel` is `ApplicationRequired`, so the platform's
  own native required-field validation already blocks the save and shows its own banner before
  any custom handler logic runs. The requirement itself already accounts for this — it
  explicitly forbids `formOnSave` from reading `opt_newcolumn`, calling `preventDefault()`, or
  managing an `opt-newcolumn-required` notification — so this is not a blocking conflict of the
  kind the concept describes (a ticket whose acceptance criteria depends on a custom message
  actually rendering); it is the ticket correctly avoiding that trap. `formOnSave` remains
  registered per the Exact Registration Contract, as a no-op extension point for save-time
  logic not already covered by platform requiredness.
- **Two distinct stable notification IDs.** `opt-record-name` (owned by `formOnLoad`) and
  `opt-newcolumn-required` (explicitly never set by `formOnSave` in this run) are recorded in
  spec `context.notes` and in this plan so a later run does not collide the two.

## Deployment order

Single-resource plan: `opt_automated_main_operations.js` is the only entry in `index.json`.
No shared utility or dependency ordering applies.

## Assumptions

- The `webresource` bundle resolved at `~/.fts-kit/okfs/webresource/` (the `$FTS_KIT_OKFS`
  environment variable was unset in this session); guidance was applied from the resolved
  bundle, not in degraded mode.
- `metadata_dir` was supplied and covered the only target entity (`opt_automated`), so no
  live `dataverse-customization-inventory` query was made by this skill; all live-state facts
  above are read from the pre-fetched `metadata/opt_automated.json`, itself dated
  `2026-09-08T00:00:00Z` in its own `fetchedAt` field.
- `publisher_prefix=opt` was supplied directly, matching `solution-prepare-result.json`'s
  resolved prefix for solution `e2ec6` — Step 2's live solution query was skipped per the
  skill's own rule that a supplied prefix is used as-is.
- `origin: new` rests on the target form's FormXML having no `<formLibraries>`/`<events>` at
  all, which is a stronger signal than the entity-level `webResources: []`, but it is still an
  inventory read rather than a live name-probe against `webresourceset`; the writing skill's
  live probe by name is authoritative if this assumption is wrong.
- The form display name "Automated form" was matched exactly against `forms[].name` in the
  metadata inventory (formId `f517761c-5e4c-f111-bec6-7ced8d6feee8`) — not approximated.
- Field logical names (`opt_name`, `opt_newcolumn`) were taken directly from the metadata
  inventory, not guessed from a label.

## Out of scope

- **Server-side enforcement of `opt_newcolumn`'s requiredness** is already fully covered by
  the platform's `ApplicationRequired` level on the field itself — no plug-in or Custom API is
  needed for it, and none is proposed.
- **Any future save-time validation logic** `formOnSave` may eventually carry is explicitly
  left unimplemented by the ticket ("extension point for future save-time logic") and is not
  part of this run's scope.
- **The "Information" Main form** on the same entity is untouched; this plan does not extend
  it and no requirement asked for it.
