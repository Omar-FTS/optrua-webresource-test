# Plan: Default "order:" Title on New Automated Records (orgb788707a)

## Status: ok

## Requirement

Source: `start-content_source.json` — a fully-worked Dataverse requirements specification
("Default 'order:' Title on New Automated Records"). Distilled: when a user opens a brand-new
record on **Automated form** (`taradeh_automated`), the form's `onload` event should set
`taradeh_title` to the exact literal `order:` — only for a record being created
(`formContext.ui.getFormType() === 1`), never on any other form-type load, never on the
"Information" form (which does not carry `taradeh_title`), and with no backfill of existing
records. The form's existing `DisplayConditions` restriction (System Administrator, System
Customizer only) is explicitly preserved unchanged and is out of scope for this plan.

## Live state

Read from `metadata/taradeh_automated.json` (unified inventory envelope,
`data.facets.entity.data`, `data.facets.forms.data`, `data.facets.web-resources.data`), and one
direct `GET` of the live web resource content (`webresourceset(8073a323-...)?$select=content`) to
settle whether a handler already registered is also already implemented — per this skill's rule
that registration state alone never proves behavior.

- **The requirement's own grounding was already stale relative to the live environment.** The
  requirement document states "no web resource or handler currently exists on this form" and "no
  existing web resource is available to extend." Live inventory directly contradicts both: a
  JScript web resource `taradeh_automated_main_operations.js` (webResourceId
  `8073a323-2fad-f111-aaab-0022480a1382`) is already deployed and is already listed in
  `usedByForms` against Automated form's `onload` event. The inventory itself flags this as a
  warning (`"Live data contradicts the requirement spec's expectation of zero web resources..."`).
  This plan trusts the live read over the requirement's stale prose, per this skill's Step 3
  guidance to prefer live state.
- **Form-level registration.** `data.facets.forms.data.forms[0]` (Automated form,
  `f363c702-edac-f111-aaab-0022480a1382`, Main) already carries a `formLibraries` reference to
  `taradeh_automated_main_operations.js` and an `onload` event with handler
  `Orgb788707aAutomatedSdk.formOnLoad` (`enabled: true`). Critically, the `<event>` element itself
  is `active: false` — the handler is wired but the event is disabled, so it does not fire today.
  This is the live delta this plan exists to close.
- **Handler body was inspected, not assumed.** Downloaded the live `content` of
  `taradeh_automated_main_operations.js` directly (base64-decoded). It reads:
  ```js
  var Orgb788707aAutomatedSdk = window.Orgb788707aAutomatedSdk || {};
  (function () {
      this.formOnLoad = function (executionContext) {
          const formContext = executionContext.getFormContext();
          defaultTitleOnCreate(formContext);
      };
      function defaultTitleOnCreate(formContext) {
          if (formContext.ui.getFormType() !== 1) { return; }
          formContext.getAttribute("taradeh_title")?.setValue("order:");
      }
  }).call(Orgb788707aAutomatedSdk);
  ```
  This already implements FR-1 and FR-2 exactly: CREATE-only gate on the numeric form-type
  constant `1` (per this org's client-behavior, matching BD-2), and the exact literal `order:`
  with no trailing space (matching BD-3), via optional-chained `setValue`. No code change is
  needed or planned.
- **Field.** `taradeh_title` (`data.facets.entity.data.attributes`) is a String attribute,
  `RequiredLevel: None`, `isValidForForm: true`, and is present on Automated form's field list —
  the platform recognizes it and it is placed where the script can reach it.
- **No competing automation.** `data.facets.plugins.data` shows zero customer-registered plugin
  steps on `taradeh_automated` (36 rows are core platform pipeline steps for every entity, not
  customer code). `data.facets.processes.data` shows zero flows/business rules/BPFs
  solution-visible on this entity. Nothing server-side already does this or would conflict with a
  client-side default.
- **Inventory scope caveat.** The web-resources facet is form-scoped (resolved by FormXml
  cross-reference), so `origin: existing` here is settled by an actual name+content hit, not a
  hint — but per this skill's standing caveat, the writing/deploy stages' own live-name probe
  remains authoritative if anything changed between this read and implementation.

## Design decisions

- **Extend, don't create (origin: existing).** A resource of the exact target name is already
  deployed and already wired to the exact form/event this requirement names. Duplicating it would
  produce two libraries on one form for one purpose — the anti-pattern
  `implementation-decisions.md` calls out. Decided per `implementation-decisions.md`'s
  extend-or-add guidance.
- **No code change to the handler.** The deployed `defaultTitleOnCreate` body already satisfies
  FR-1, FR-2, BD-2, and BD-3 verbatim, verified by reading its actual content rather than trusting
  its registration. The spec therefore declares the existing `events[]` entry unchanged rather than
  inventing a new one; the writing stage should find nothing to author here.
- **Namespace left as deployed.** The requirement's own solution-design section
  (AU-1) already corrected the namespace to `Orgb788707aAutomatedSdk` after a prior downstream
  review flagged a publisher-prefix-based name as wrong against this client's
  `<OrgName>AutomatedSdk` convention; live content confirms `Orgb788707aAutomatedSdk` is exactly
  what is deployed. This plan does not recompute or rename it — a deployed script's namespace is
  never renamed to fit the naming grammar (`naming-and-structure.md`, and this skill's own hard
  boundary).
- **The real remaining delta is activation, not authorship.** FR-3/AC-3 require the `onload` event
  to be `active="true"`. Live FormXml shows `active: false` on that event today, even though the
  `Handler` element is `enabled: true`. This is a wiring gap, not a code gap: `event-registrations.yaml`
  carries the exact same `control: form / event: onload / handler:
  Orgb788707aAutomatedSdk.formOnLoad` registration the deployed form already has, so the deploy
  stage re-patches and activates that event without touching the resource's content — closing
  FR-3 and AC-3 while leaving FR-1/FR-2's already-correct code alone.
- **`sourceFile` path.** No local copy of this resource exists anywhere in this repository (no
  `src/` resource tree present at all). `src/Resources/scripts/taradeh_automated_main_operations.js`
  is assigned per the bundle's documented default layout (`scripts/` folder under the project's
  resource root, local filename free of the flat Dataverse name) since there is no established
  local convention to preserve. The writing stage's baseline-read step is expected to populate
  this file from the live content read above.

## Deployment order

Single-resource change. `index.json` has one entry:
`taradeh_automated_main_operations.js`. No shared utility, no dependency ordering applies.

## Assumptions

- The `webresource` bundle resolved cleanly at `~/.fts-kit/okfs/webresource/` (no `$FTS_KIT_OKFS`
  set); this run is **not** degraded.
- `sourceFile`'s path (`src/Resources/scripts/...`) is inferred from the bundle's documented
  default layout, not an established project convention, because no prior local copy or resource
  folder exists in this repository — falsifiable by a future discovery of a different existing
  layout.
- `publisher_prefix` (`taradeh`) was supplied directly and cross-checked against
  `solution-prepare-result.json` (`publisher_prefix: "taradeh"`, solution
  `webresourceAutomatedForm`, `status: succeeded`) rather than queried fresh in this run; both
  agree, so Step 2's solution query was skipped per this skill's own rule when the prefix is
  supplied.
- The live web resource content read (one `GET` on `webresourceset`) is current as of this run;
  a lost-update race between this read and the writing/deploy stages is that stage's own guard to
  catch, not this plan's.
- `origin: existing` here is a direct name+content hit, not a form-scoped inventory hint, so it
  carries higher confidence than the general caveat this skill applies to `origin` by default.

## Out of scope

- Widening or altering Automated form's `DisplayConditions` restriction (System Administrator,
  System Customizer only) — explicitly preserved per the requirement's BD-1.
- The "Information" Main form — it does not carry `taradeh_title` and has no library or event
  registration; untouched by this plan.
- Enforcing the `order:` default for records created via Web API, import, or any non-interactive
  path (SEC-2) — accepted gap, not a defect, per the requirement.
- Backfilling `taradeh_title` on existing `taradeh_automated` records (MIG-1).
- Naming or finalizing an ALM promotion path beyond the already-resolved target solution
  `webresourceAutomatedForm` — test/UAT and production promotion approvers remain an open question
  per the requirement's own Open Questions section.
