# Web Resource Plan — Automated Form OnLoad Title Default

## Status

`ok`

## Requirement

Source: `docs/tasks/dataverse-requirements-specification-d1eaf76d` requirement specification
"Default `order:` Title on New Automated Records (orgb788707a)" (via
`start-content_source.json`, itself citing
`docs/consulting/dataverse-spec/output/spec-automated-onload-orgb788707a.md`).

When a user opens a brand-new record on "Automated form" (`taradeh_automated`), a new
client-side `onload` handler must set `taradeh_title` to the literal string `order:`. On any
other form type (update, etc.), `taradeh_title` must be left untouched. No web resource or
FormXml event currently exists on this form, so this is a new build. The form's existing
`DisplayConditions` restriction (System Administrator, System Customizer only) is left
unchanged — not in scope.

## Live State

Read from the unified inventory envelope
`docs/tasks/dataverse-requirements-specification-d1eaf76d/metadata/taradeh_automated.json`
(`data.facets.entity`, `data.facets.forms`, `data.facets.web-resources`; also skimmed
`data.facets.plugins` and `data.facets.processes`):

- `data.facets.entity.data.attributes` confirms `taradeh_title` (String, `RequiredLevel: None`)
  and the primary name `taradeh_name` (String, `ApplicationRequired`) as the entity's only two
  custom attributes. `taradeh_title` is the exact control this change targets.
- `data.facets.forms.data.forms` lists four forms; the target is `"Automated form"`
  (`formId f363c702-edac-f111-aaab-0022480a1382`, type `Main`). `data.facets.forms.data.formUsage`
  is `{libraries: [], handlers: [], controls: []}` for the entity as a whole — no form on this
  entity currently registers any library or handler.
- `data.facets.web-resources.data.webResources` is an empty array — no web resource is
  associated with any form on `taradeh_automated` today. This rules out "extend": there is
  nothing to extend.
- `data.facets.plugins.data.stepsByMessage` shows only out-of-the-box platform plug-ins
  (`Microsoft.Crm.ObjectModel`, `Microsoft.CDS.DataArchival.Plugins`) registered on standard
  messages (`Create`, `Assign`, `Archive`, etc.) — no custom plug-in duplicates this default.
  `data.facets.processes.data` shows `businessRules: []` and `flows: []` — no business rule or
  flow already sets `taradeh_title` on create.
- **Inventory scope caveat**: `data.facets.web-resources` is form-scoped (it cross-references
  FormXml), so a ribbon command file, HTML dialog, or shared utility not loaded by any form on
  this entity could exist and still be absent here. That caveat does not change the outcome for
  this ticket, since the requirement is specifically a form `onload` handler, which the
  form-scoped read is authoritative for — but it is the reason `origin` below is stated as a
  hint rather than a certainty.

This ruled out both "extend a deployed resource" (nothing is deployed) and "no_delta via
existing automation" (no plug-in, flow, or business rule already covers it).

## Design Decisions

- **New resource, not an extension.** The form-scoped inventory shows zero libraries, zero
  handlers, and zero web resources tied to `taradeh_automated`'s forms. `origin: new` per
  `okfs/webresource/implementation-decisions.md`'s extend-or-add guidance: a resource is
  extended only when the target form already loads one for the same purpose; here none exists.
- **Form script, not a business rule.** The requirement is a create-time default driven purely
  by `formContext.ui.getFormType()`, which a business rule can also express, but the client's
  established mechanism for this class of behavior (confirmed by the requirement's own
  cross-environment precedent, `OptruaAutomatedSdk` in `optrua-dev`) is a form script. No
  business rule already exists to extend, and the requirement calls for a script explicitly.
  `implementation-decisions.md`'s shape table: "Behaviour while a form is open — validation,
  defaulting, showing and hiding, reacting to a field" → form script.
- **Single `onload` registration on `form`, not a field `onchange`.** The behaviour fires once
  at load time based on form type, not in response to a field edit, so it is declared as
  `control: form`, `name: onload` per `okfs/webresource/references/webresource-spec-schema.md`
  and `okfs/webresource/event-registration.md`'s "register only requested event types" rule. No
  `onsave` or `onchange` registration is added — none was requested and none is needed.
- **Namespace `Orgb788707aAutomatedSdk`**, derived per the `{ClientName}{EntityName}Sdk` grammar
  in `naming-and-structure.md`: `ClientName` from the first host label of
  `https://orgb788707a.crm.dynamics.com` (`orgb788707a`, which carries no recognized
  hyphen-delimited environment suffix to strip), capitalized on the first character only →
  `Orgb788707a`; `EntityName` from `taradeh_automated` split at its first underscore, discarding
  `taradeh`, capitalizing only the first character of the remainder → `Automated`. This agrees
  with the requirement document's own resolution and its citation of the `optrua-dev` precedent
  (`OptruaAutomatedSdk`).
- **Resource name `taradeh_automated_main_operations.js`**, following the naming table's
  `{prefix}_{entity}_main_operations.js` pattern, entity segment taken from the logical name
  with the publisher prefix stripped (`taradeh_automated` → `automated`), giving
  `taradeh_automated_main_operations.js`. `sourceFile`'s base file name is set to this exact
  string, placed at `src/Resources/scripts/taradeh_automated_main_operations.js` — the schema's
  documented `scripts/` convention — since this repository has no existing `src/Resources`
  layout to preserve instead (verified: no such directory exists in the working tree yet).
- **Publisher prefix `taradeh`** was supplied directly as an input and used as-is; Step 2's
  solution query was skipped per the skill's own rule. It matches the prefix already observed
  live on `taradeh_automated` and its attributes, so no conflict exists.

## Deployment Order

Single-resource plan: `taradeh_automated_main_operations.js` is the only entry in `index.json`.
It has no dependency on a shared utility (none is needed for a one-literal-assignment handler),
so there is no ordering constraint beyond the one entry.

## Assumptions

- The `webresource` bundle resolved at `~/.fts-kit/okfs/webresource/` (the second lookup
  location; `$FTS_KIT_OKFS` was unset). Bundle guidance was applied, not degraded-mode.
- `origin: new` is taken from a form-scoped inventory read, per
  `implementation-decisions.md`'s caveat: it is a hint the implementer's live name probe must
  still confirm, though in this case the requirement's own live inspection (systemforms/FormXml)
  independently corroborates that no resource or handler exists on "Automated form" today.
- The namespace and resource-name derivations above were **not** independently re-verified
  against a live probe of `webresourceset` for a name collision; the inventory's empty
  `webResources[]` is the only evidence there is no existing `taradeh_automated_main_operations.js`
  under any name. This is standard for a `new` resource and is the writing/deploy stage's probe
  to confirm.
- No target solution was supplied as an input beyond `webresourceAutomatedForm` (used to resolve
  publisher prefix in the normal flow, but here `publisher_prefix=taradeh` was supplied directly
  so the solution was not queried by this run). The requirement document separately notes ALM-1
  (target solution membership deferred) as an open question from the earlier spec stage; this
  plan does not resolve it.

## Out of Scope

- The "Automated form" `DisplayConditions` restriction (System Administrator, System Customizer
  only) is unchanged by this plan; no security-role work is included.
- No backfill of `taradeh_title` on existing records — the handler only ever runs on
  `getFormType() === 1` (create), so pre-existing records are structurally unaffected.
- Enforcement of the `order:` default for records created via the Web API, import, or any other
  non-interactive path is not covered — that would require a plug-in or Custom API on `Create`,
  which was not requested and is a separate (plug-in) lifecycle mechanism.
- Target solution membership and promotion path (test/UAT, production, approvers) remain
  unresolved, as recorded by the upstream requirement's own Open Questions / ALM-1; this run did
  not query or assign a solution.
