# Web Resource Plan — Default "order:" Title on New Automated Records

## Status

`ok`

## Requirement

Source: `C:\Users\Omar Taladeh\.adw\projects\optrua-webresource-test-5f4e2873\agents\9dba8c69\start-content_source.json`
("Dataverse Requirements Specification: Default \"order:\" Title on New Automated Records
(orgb788707a)"). This is itself a reviewed requirements-specification document (not raw ticket
prose): it already carries verified live-state findings and settled design decisions
(AU-1/AU-2, SEC-1/SEC-2, BD-1..BD-3, MIG-1, ALM-1). This plan translates those decisions into
the web resource spec artifacts rather than re-deriving them.

The ask: on `taradeh_automated`'s "Automated form", when a **new** record is opened
(`formContext.ui.getFormType() === "create"`), set `taradeh_title` to the literal string
`order:`. On any other form type, `taradeh_title` is left untouched. No existing handler or
resource covers this today, so a new client-side form script and a new `onload` registration on
"Automated form" are required.

## Live State

Read from the unified inventory envelope
`docs/tasks/dataverse-requirements-specification-9dba8c69/metadata/taradeh_automated.json`
(`data.facets.entity.data`, `data.facets.forms.data`, `data.facets.web-resources.data`):

- **Entity**: `taradeh_automated` (display "Automated"), primary name attribute `taradeh_name`.
  The only other custom attribute is `taradeh_title` (String, `RequiredLevel: None`,
  `maxLength: 100`) — confirmed present and unsecured, so a form script can read/write it freely.
- **Forms**: four forms exist. The target, **"Automated form"** (Main,
  `formId f363c702-edac-f111-aaab-0022480a1382`), is the only Main form the requirement touches.
  "Information" (Main) does not carry `taradeh_title` and is out of scope.
- **`data.facets.forms.data.formUsage`**: `libraries: []`, `handlers: []`, `controls: []` for
  this entity — no form on `taradeh_automated` has any library or event registration today.
- **`data.facets.web-resources.data.webResources`**: `[]` — no web resource of any kind is
  cross-referenced from any form on this entity. Combined with the requirement's own
  name-search finding (no `taradeh_`-prefixed resource exists; unrelated `msdyn_` resources
  aside), this rules out extending anything: **this is a from-scratch build**, `origin: new`.
- No plugin or process step in `data.facets.plugins.data` / `data.facets.processes.data` touches
  `taradeh_title`, so there is no server-side logic this client-side default would duplicate or
  conflict with.

The inventory is form-scoped (`web-resources` resolves only by FormXml cross-reference), so in
principle a ribbon file, dialog, or shared utility could exist undetected. That caveat does not
change this plan's `origin: new` call, because the requirement's own independent web-resource
name search (a name-based query, not form-scoped) also found nothing. The implementer's live
name probe on `taradeh_automated_main_operations.js` remains authoritative before any write.

## Design Decisions

1. **Shape: form script, not a business rule, plugin, or ribbon command.** The requirement is
   pure client-side form-load defaulting behavior for whoever already has form access — squarely
   the "behaviour while a form is open" row of `okfs/webresource/implementation-decisions.md`. A
   business rule was considered and rejected in the source spec (AU-1) because the client already
   owns this pattern as form scripts elsewhere; a plugin was rejected (SEC-2) because it would
   also cover API-created records, which is explicitly out of scope.

2. **Extend or add: add.** `data.facets.web-resources.data.webResources` is empty and
   `formUsage.libraries`/`handlers` are empty for every form on this entity — there is nothing
   deployed to extend. `origin: new` per `implementation-decisions.md`'s "Extend or add?" section.

3. **Resource name: `taradeh_automated_main_operations.js`.** Per
   `okfs/webresource/naming-and-structure.md`'s entity form script row
   (`{prefix}_{entity}_main_operations.js`), with the publisher prefix `taradeh` (supplied
   directly, matching the prefix the requirement independently observed on this entity's
   attributes) and the entity segment `automated` (the logical name `taradeh_automated` with the
   `taradeh_` prefix stripped).

4. **Namespace: `Orgb788707aAutomatedSdk`.** Per `naming-and-structure.md`'s
   `{ClientName}{EntityName}Sdk` grammar: `ClientName` is derived from the first host label of
   `org_url` (`https://orgb788707a.crm.dynamics.com` → `orgb788707a`), which carries no
   recognized environment suffix (`-dev`, `-test`, etc.) to strip, capitalized to `Orgb788707a`.
   `EntityName` is derived from the registration entity's logical name split at its first
   underscore (`taradeh_automated` → `automated`), capitalized to `Automated`. This matches the
   namespace the source requirement's own AU-1 decision already settled on (and explicitly
   corrected to, after an earlier draft mistakenly used the publisher-prefix-based
   `TaradehAutomatedSdk`) — this plan independently re-derives the same value from the grammar
   rather than trusting the source document's own arithmetic.

5. **Event set: `onload` on `control: form` only.** FR-1/FR-2 are entirely form-load-time; FR-3
   asks for exactly one new `onload` registration. No `onchange` or `onsave` is requested, so none
   is declared, per `event-registration.md` rule 1 (register only requested event types).
   `passExecutionContext: true` is set per AU-2 and the standard convention — nothing in live
   state contradicts it, since no registration exists yet to compare against.

6. **The CREATE-only gate and the exact literal `order:` are authored-code concerns, not spec
   concerns.** The spec records the event and handler name; `formContext.ui.getFormType() ===
   "create"` and the literal string with no trailing space (BD-2, BD-3) are implementation detail
   for the writing step to satisfy against this plan and the source requirement's FR-1/FR-2.

## Binding: Handler ↔ Form ↔ Control

| Resource | Form | Control | Event | Handler |
|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | Automated form (Main, `taradeh_automated`) | `form` | `onload` | `Orgb788707aAutomatedSdk.formOnLoad` |

This is the only binding requested (FR-3) and the only one written to `event-registrations.yaml`.

## Deployment Order

Single-resource change — one entry in `index.json`. No shared utility is involved, so no
ordering dependency applies.

## Assumptions

- The `webresource` bundle resolved at `~/.fts-kit/okfs/webresource/` (second lookup location);
  `$FTS_KIT_OKFS` was unset. No degradation — the bundle's guidance was applied in full.
- `publisher_prefix` (`taradeh`) was supplied directly, so Step 2's solution/publisher query was
  skipped per the skill's own instruction ("If `publisher_prefix` was supplied, use it and skip
  the query"). This plan did not independently verify `webresourceAutomatedForm`'s
  `customizationprefix` against `taradeh` via a live Web API read; it trusts the supplied value,
  which also matches the prefix the source requirement independently observed on
  `taradeh_automated`'s own attributes. If that solution's publisher prefix turns out to differ,
  this spec's `name`/`index.json` values would need to be regenerated under the correct prefix
  before authoring.
- `origin: new` relies on the form-scoped inventory plus the source requirement's own name-search
  finding; a full org-wide name probe for `taradeh_automated_main_operations.js` was not
  performed by this plan (no environment writes or additional queries beyond reading the supplied
  metadata file). The writing/deployment steps' live name probe is what finally settles this.
- The namespace `Orgb788707aAutomatedSdk` was independently re-derived from the grammar in
  `naming-and-structure.md` and matches the source requirement's own (corrected) AU-1 value; no
  conflict was found.

## Out of Scope

- **Non-interactive creation paths** (Web API, import, integration) do not receive the `order:`
  default — accepted per the source requirement's SEC-2, since this mechanism is form-load-time
  only.
- **No backfill** of `taradeh_title` on existing `taradeh_automated` records (MIG-1).
- **The "Automated form" `DisplayConditions` role restriction** (System Administrator, System
  Customizer only) is unchanged; not touched by this plan (BD-1).
- **Target solution membership** for this change was deliberately left unresolved by the source
  requirement (ALM-1); `solution=webresourceAutomatedForm` and `publisher_prefix=taradeh` were
  supplied to this run directly, so this plan's artifacts are prefix-correct, but which solution
  ultimately carries the deployment is an ALM decision outside this plan's scope.
- **Promotion path, environment variables, and approvers** were explicitly deferred by the user in
  the source requirement and are not addressed here.
