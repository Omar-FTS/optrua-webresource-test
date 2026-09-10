# Web Resource Plan — Default "order:" Title on New Automated Records (orgb788707a)

## Status

`ok`. One resource, already deployed, needs its onload event's `active` flag turned on — not
new code and not a from-scratch build, contrary to the requirement's own "Current State"
section. `resource_count: 1`.

## Requirement

Source: `C:\Users\Omar Taladeh\.adw\projects\optrua-webresource-test-5f4e2873\agents\19112dfb\start-content_source.json`
(`docs/consulting/dataverse-spec/output/spec-automated-onload-orgb788707a.md`).

On `taradeh_automated`, "Automated form" should run a new `onload` handler that sets
`taradeh_title` to the literal string `order:` when the form loads for a brand-new record
(`formContext.ui.getFormType() === 1`), and must leave `taradeh_title` untouched on every
other form load (update, or any other form type). The requirement's own grounding states this
is a from-scratch build: no library or handler registered on "Automated form" today.

## Live state

Read from `metadata/taradeh_automated.json` (`data.facets.entity`, `data.facets.forms`,
`data.facets.web-resources`), then two additional live GETs against
`https://orgb788707a.crm.dynamics.com` to settle what the inventory could only suggest:
`GET webresourceset(...)?$select=name,content` for the resource's deployed source, and
`GET systemforms(...)?$select=formxml` for the form's raw event node (the inventory's
`formUsage` summarizes handlers but does not carry the FormXml `<event active="...">` flag
itself).

Findings, and what each ruled out:

- `taradeh_title` (String, `RequiredLevel: None`) exists on `taradeh_automated` and is placed
  on "Automated form" already — ruled out any schema or form-layout work.
- The unified inventory's `web-resources` facet **already lists**
  `taradeh_automated_main_operations.js` as deployed, associated with "Automated form" as a
  library, with an `onload` event and handler `Orgb788707aAutomatedSdk.formOnLoad` already
  recorded under `usedByForms[0].events[0]`. The `forms` facet's `formUsage.handlers[0]`
  agrees: `handlerLib: taradeh_automated_main_operations.js`,
  `handlerFunc: Orgb788707aAutomatedSdk.formOnLoad`, `enabled: true`, `passContext: true`.
  This directly contradicts the requirement's stated "no `<events>` block and no
  `<Libraries>` reference at all" — the inventory is form-scoped but this form **is** the one
  it was read from, so the contradiction is real, not a scope gap. This ruled out treating the
  resource or the registration as new.
- Because a registration existing is not proof the handler body does what the ticket asks
  (per this skill's own Step 3 guidance), the deployed resource's live `content` was
  downloaded and decoded. Its `formOnLoad` calls a private `defaultTitleOnCreate(formContext)`
  that returns early unless `formContext.ui.getFormType() !== 1` is false (i.e. runs its body
  only on create), and then sets `taradeh_title` to the exact literal `order:` via
  `formContext.getAttribute("taradeh_title")?.setValue("order:")`. This is the CREATE-only
  gate FR-1/FR-2/BD-2 ask for and the exact literal FR-1/BD-3 asks for, verbatim. This ruled
  out any code change to the JavaScript.
- The live FormXml (`GET systemforms(f363c702-...)?$select=formxml`) was read directly because
  neither facet exposes the event node's own `active` attribute. It shows:
  `<event name="onload" application="false" active="false"><Handlers><Handler
  functionName="Orgb788707aAutomatedSdk.formOnLoad" ... enabled="true" ... /></Handlers></event>`.
  The `Handler` is `enabled="true"` but the **event node itself is `active="false"`** — the
  registration exists but the platform will not invoke it on form load. This is the one real
  gap between live state and FR-3/AC-3, which both call for `active="true"`.
- The FormXml's `<DisplayConditions>` still names the same two Role IDs the requirement
  documents (System Administrator, System Customizer) — confirms BD-1/SEC-1 need no change.

## Design decisions

- **Extend, don't recreate.** `origin: existing`. The resource, its registration, and its
  handler body are all already deployed and already correct; there is nothing to author.
  Concept: `okfs/webresource/implementation-decisions.md` (extend vs. new) and
  `okfs/webresource/deployment-gotchas.md` (a deployed resource is read before it is ever
  touched again — reading it here is what surfaced that no touch is needed).
- **Declare the registration anyway.** Even with no code change, `event-registrations.yaml`
  still carries the one `onload` registration on "Automated form" naming
  `Orgb788707aAutomatedSdk.formOnLoad`. This is the statement of wiring intent the deploy step
  reads to patch the form; declaring it is what causes the currently-inactive event node to
  become `active="true"` on deployment. Leaving it out because "the handler is already there"
  would leave the one real defect unaddressed. Concept: `okfs/webresource/event-registration.md`
  ("Capture only requested registrations... the declarative file is the handoff contract").
- **Namespace kept as deployed, not recomputed.** The deployed namespace is
  `Orgb788707aAutomatedSdk`, which happens to also be what
  `okfs/webresource/naming-and-structure.md`'s `{ClientName}{EntityName}Sdk` grammar would
  produce from this org's host label (`orgb788707a`) and the entity segment (`automated`).
  Because the resource is `origin: existing`, the namespace is preserved from the live
  content regardless — a deployed script's namespace is never renamed to fit the grammar, per
  that concept — and the fact that the two agree here is coincidental confirmation, not the
  reason for the choice.
- **`sourceFile` is a new placement, not a preserved one.** No local copy of
  `taradeh_automated_main_operations.js` exists anywhere in this repository (searched for it;
  found nothing), even though the resource is deployed live. `naming-and-structure.md`'s rule
  for an `origin: existing` resource is to use wherever its content already lives locally —
  but nothing here qualifies, so `src/Resources/scripts/taradeh_automated_main_operations.js`
  was chosen as the placement, following the same `src/Resources/scripts/<name>` convention
  the schema uses for new resources. This is recorded as an assumption below because it is a
  choice, not a discovered fact.
- **No new spec content for FR-1/FR-2/BD-2/BD-3.** The spec's single `events[]` entry mirrors
  what is already deployed; it is not asking the writing step to add anything, only to leave
  the handler as-is while the registration in `event-registrations.yaml` drives activation.

## Deployment order

Single resource, single entry in `index.json`. No shared utility and no dependency ordering
applies.

## Assumptions

- `sourceFile`'s placement (`src/Resources/scripts/taradeh_automated_main_operations.js`) is
  chosen, not discovered — no local copy of this resource exists in the repository today. The
  writing step should download the live content to this path before making any (currently
  believed unnecessary) edit, per `okfs/webresource/deployment-gotchas.md`'s "extending starts
  by reading it."
- The declarative registration in `event-registrations.yaml`, with no explicit `active` field
  in its schema, is assumed to cause the deployment step to set the FormXml event node's
  `active` attribute to `true` when it patches the named handler in. This plan does not
  perform that patch itself (no environment writes made or implied by this run) and cannot
  confirm the deploy tool's exact patch behavior beyond what
  `okfs/webresource/deployment-gotchas.md` describes ("patch, add the components to the
  solution, publish"). If the deploy tool does not flip `active` from a bare registration
  entry, that is a gap in the deploy tool, not in this plan's stated intent.
- The `webresource` bundle resolved successfully at `~/.fts-kit/okfs/webresource/` (second
  lookup location); `$FTS_KIT_OKFS` was unset. No degraded mode was used.
- The requirement document's own "Current State" claim ("no `<events>` block ... from-scratch
  build") is treated as stale relative to the live probe performed in this run; the live
  FormXml and web-resource content are authoritative over the requirement's prose, per this
  skill's Step 3 guidance to trust live state.

## Out of scope

- Reactivating the form's `onload` event is form-configuration work this plan states the
  intent for (via `event-registrations.yaml`) but does not itself perform — the deploy skill
  patches FormXml and publishes; this plan makes no environment write.
- Enforcing the `order:` default for records created via Web API, import, or any
  non-interactive path that never opens "Automated form" (SEC-2 in the requirement).
- Backfilling `taradeh_title` on existing `taradeh_automated` records (MIG-1).
- Any change to "Automated form"'s `DisplayConditions` role restriction (BD-1) — confirmed
  unchanged in the live FormXml read during this run.
- Naming or creating a target solution for this change (ALM-1, left open by the requirement).
