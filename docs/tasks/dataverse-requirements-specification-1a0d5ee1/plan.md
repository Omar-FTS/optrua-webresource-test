# Web Resource Plan: Default "order:" Title on New Automated Records

## Status

`ok`

## Requirement

Source: `start-content_source.json` (inline requirement text, backed by the reviewed
requirements specification at
`docs/consulting/dataverse-spec/output/spec-automated-onload-orgb788707a.md`).

When a user opens a brand-new record on **"Automated form"** (table `taradeh_automated`,
`https://orgb788707a.crm.dynamics.com`), the form's `onload` event should run a new client-side
handler that sets `taradeh_title` to the literal string `order:`. On any other form type
(update, etc.), `taradeh_title` must be left untouched. No web resource or handler currently
exists on this form, so this is a new build, not an extension.

## Live State

Read from the unified inventory envelope at `metadata/taradeh_automated.json`
(`data.facets.entity.data`, `data.facets.forms.data`, `data.facets.web-resources.data`,
`data.facets.processes.data`, `data.facets.plugins.data`):

- **Entity**: `taradeh_automated` (display "Automated"), primary name `taradeh_name`. Custom
  attributes are exactly `taradeh_name` (String, ApplicationRequired) and `taradeh_title`
  (String, `RequiredLevel: None`) — confirming the field the requirement names by label really
  exists with logical name `taradeh_title`.
- **Forms**: four forms exist on the entity. The target, **"Automated form"** (Main,
  `formId f363c702-edac-f111-aaab-0022480a1382`), is the only Main form carrying `taradeh_title`
  — the other Main form ("Information") does not carry that field and is out of scope.
- **`data.facets.forms.data.formUsage`** — `libraries: []`, `handlers: []`, `controls: []` for
  the entity's forms. No script is registered on any form today.
- **`data.facets.web-resources.data.webResources`** — `[]`. No web resource referencing any
  `taradeh_automated` form exists in the environment. Per `implementation-decisions.md` and
  `naming-and-structure.md`, this facet is form-scoped (resolved by FormXml cross-reference), so
  a resource that exists but is loaded by no form would still be absent here — but combined with
  the empty `formUsage` above and a resource name (`taradeh_automated_main_operations.js`) that
  follows the standard, discoverable convention, there is no live evidence of anything to extend.
  This is recorded as `origin: new`, a hint the implementer's live name probe must still confirm
  per the naming-and-structure.md rule that `origin` is never authoritative on its own.
- **`data.facets.processes.data`** — `actions: []`, `businessRules: []`, `flows: []`,
  `classicWorkflows: []`, `businessProcessFlows: []`. No business rule or flow already sets this
  default, and none could be reused instead of a script.
- **`data.facets.plugins.data`** — only out-of-the-box/system steps (Archive, Assign, Create
  object-model plumbing, etc.); nothing custom acts on `taradeh_title` server-side.

Net: this is a from-scratch build. Nothing already deployed does any part of what the
requirement asks.

## Design Decisions

- **Extend vs. add** — Added a new resource (`origin: new`). No deployed resource references
  any `taradeh_automated` form (`web-resources` facet empty, `formUsage` empty), so there is
  nothing to extend. Decided per `implementation-decisions.md`'s "Extend or add?" section.
- **Resource shape** — A form script bound to `onload`, per `implementation-decisions.md`'s
  shape table ("Behaviour while a form is open — validation, defaulting... → A form script").
  Not a business rule: a business rule can set a static default, but the client's own convention
  (and the requirement's explicit decision AU-1) is a form script for this class of behavior, and
  a plugin/server-side default was explicitly ruled out of scope by the requirement (SEC-2) since
  only interactive form creation should receive the default.
- **Event set** — Only `onload` on `control: form`, per `event-registration.md`'s
  requested-event-only rule. No `onchange` or `onsave` is registered; none was asked for.
- **Naming** — `taradeh_automated_main_operations.js`, derived per `naming-and-structure.md`'s
  entity form script pattern `{prefix}_{entity}_main_operations.js`, where the entity segment is
  the logical name with the publisher prefix stripped (`taradeh_automated` → `automated`) and the
  prefix is the supplied `taradeh`. `sourceFile` is
  `src/Resources/scripts/taradeh_automated_main_operations.js` — the repository has no
  established web resource source layout yet (no `src/` tree exists), so the default layout
  documented in `webresource-spec-schema.md`'s own example (`src/Resources/scripts/<file>`) was
  used, and per the structural rule for `origin: new` entries, the local file's base name is
  copied from `name` verbatim rather than independently invented.
- **Namespace** — `Orgb788707aAutomatedSdk`, derived per `naming-and-structure.md`'s
  `{ClientName}{EntityName}Sdk` grammar: `ClientName` from the first host label of
  `https://orgb788707a.crm.dynamics.com` (`orgb788707a`, no recognized hyphen-delimited
  environment suffix to strip, capitalized → `Orgb788707a`), `EntityName` from the registration
  entity `taradeh_automated` split at its first underscore (`automated`, capitalized →
  `Automated`). This independently reproduces the requirement document's own AU-1 conclusion
  (`Orgb788707aAutomatedSdk`, corrected there from an earlier incorrect
  publisher-prefix-based guess), so no conflict exists between this plan and the reviewed spec.
- **CREATE-only guard** — Not separately declared in the spec grammar (it is an authoring detail,
  not a wiring one), but recorded here per the requirement's BD-2: the handler must check
  `formContext.ui.getFormType() === "create"` before setting `taradeh_title`, and must do nothing
  otherwise. This is binding on the writing step via this plan and via AC-1/AC-2 in the source
  requirement document.

## Deployment Order

Single resource, single-entry `index.json`. No shared utility or dependency ordering applies —
`taradeh_automated_main_operations.js` is a self-contained form script with no consumer or
dependency relationship to any other resource.

## Assumptions

- The `webresource` bundle resolved at `~/.fts-kit/okfs/webresource` (second lookup location);
  `$FTS_KIT_OKFS` was unset. No degradation — full bundle guidance was applied.
- `origin: new` is taken from a form-scoped inventory read (`data.facets.web-resources.data`,
  entity-mode). Per `naming-and-structure.md` and `implementation-decisions.md`, this is a hint:
  it is falsifiable if a live name probe during authoring finds
  `taradeh_automated_main_operations.js` (or any other resource) already deployed under a name
  this plan did not anticipate. Combined with the empty `formUsage` for every form on this
  entity, the risk of an undetected existing resource is low but not eliminated.
- The publisher prefix `taradeh` was supplied directly as an input and used as-is, per Step 2's
  "skip the query" rule; it was not independently re-verified against a `solutions` query in this
  run. It is corroborated by the requirement document's own observation that `taradeh_` is the
  prefix on the target entity and its custom attributes, so no conflict was found.
- The `sourceFile` local path convention (`src/Resources/scripts/...`) is inferred from the
  bundle's own documented example, because this repository does not yet have an established web
  resource source tree to follow. This is falsifiable: if the writing step's project inspection
  finds or expects a different established layout, that layout should be followed instead and
  this plan's `sourceFile` value corrected.
- The Client API surface listed (`executionContext.getFormContext`,
  `formContext.ui.getFormType`, `formContext.getAttribute`) is informational and inferred from
  what FR-1/FR-2 require, not verified against the (not-yet-written) implementation.

## Out of Scope

- **ALM-1**: no target solution is named. The requirement document explicitly defers this
  decision; `dataverse-solution-prepare` or an equivalent solution-resolution step must run
  before deployment can associate this resource with a solution.
- **Promotion path** (test/UAT, production, approvers): not specified by the requirement;
  deferred to Open Questions in the source document.
- **Non-interactive creation paths** (Web API, import, integration): per the requirement's SEC-2,
  these do not receive the `order:` default. Closing that gap, if ever wanted, is a plug-in or
  synchronous flow on `Create` of `taradeh_automated` — a separate mechanism, not requested here.
- **Backfill** of existing `taradeh_automated` records' `taradeh_title` (MIG-1): explicitly not
  requested; existing records are untouched by this change (the handler is CREATE-gated).
- **`DisplayConditions` role restriction** on "Automated form" (System Administrator, System
  Customizer only): explicitly preserved unchanged per the requirement's BD-1; this plan makes no
  security or visibility change.
