### Code review

Mode: working-tree, `base_ref=main`. Reviewed: committed changes on `adw/1a0d5ee1` since `main`
(`git diff main...HEAD`), the unstaged modification to `run-state.json`, and every untracked file
under the workspace (`git status --short --untracked-files=all`). No staged changes were present.

Spec axis requirement source: `start-content_source.json` (the reviewed Dataverse requirements
specification for "Default `order:` Title on New Automated Records", `orgb788707a`), used verbatim.
`plan.md` was read only as the implementation record, never as a requirement source.

Standards axis source: no `standards` value was supplied, so bundle routing engaged. The diff
changes `src/Resources/scripts/taradeh_automated_main_operations.js` (a `.js` file under a
web-resource source layout named with the `taradeh_` publisher prefix), matching the `okfs/webresource`
marker. No `.cs` file and no Dataverse plugin marker are present, and no `customization.yaml`/solution
XML/metadata-JSON marker under a `spec/` directory is present, so `okfs/plugin` and
`okfs/crm-customization` did not route. `okfs/webresource` resolved at
`~/.fts-kit/okfs/webresource` (no `FTS_KIT_OKFS` override set); concepts read: `index.md`,
`naming-and-structure.md`, `implementation-decisions.md`, `event-registration.md`, and
`references/webresource-spec-schema.md`. The bundle carries no `references/scope.json`, so no
scope-manifest entries were available to the Spec axis.

**Standards axis** — no findings. Checked naming/namespace grammar, file layout, event-registration
rules, and the spec/index/registrations schema contract against the change; also checked for the
smell baseline (Fowler) as judgement-call material.

- Web resource name `taradeh_automated_main_operations.js` matches `naming-and-structure.md`'s
  entity-form-script grammar `{prefix}_{entity}_main_operations.js`, with the entity segment
  (`automated`) taken from `taradeh_automated` with the prefix stripped, as required.
- Namespace `Orgb788707aAutomatedSdk` matches the `{ClientName}{EntityName}Sdk` grammar: `ClientName`
  from the first host label of `https://orgb788707a.crm.dynamics.com` with no recognized
  environment suffix to strip, `EntityName` from `taradeh_automated` split at its first underscore.
- The script (`src/Resources/scripts/taradeh_automated_main_operations.js`) uses the bundle's IIFE
  pattern (`var Orgb788707aAutomatedSdk = window.Orgb788707aAutomatedSdk || {}; (function () {...}).call(Orgb788707aAutomatedSdk);`),
  keeps `formOnLoad` as the only public handler, and keeps `defaultTitleOnCreate` private — matching
  `naming-and-structure.md`'s "keep helpers private" rule. No `Xrm.Page`, `window.top`, synchronous
  `XMLHttpRequest`, jQuery, `alert()`, `debugger`, or hardcoded secret is present.
- `event-registration.md`'s requested-event-only rule is honored: only `onload` is registered
  (matching FR-3/AU-2), with no invented `onchange`/`onsave`, and no `addOnChange`-wrapper
  anti-pattern.
- `spec/automated-onload.yaml`, `spec/event-registrations.yaml`, and `spec/index.json` agree with
  each other and with `references/webresource-spec-schema.md`'s contract: matching `name`, `type`
  agreeing with the `.js` extension, `origin: new` recorded as a hint (consistent with the empty
  `webResources`/`formUsage` facets in `metadata/taradeh_automated.json` and the untracked
  `probe-taradeh_automated_main_operations.json` showing `"found": false`), and a single ordered
  `index.json` entry.
- No refactoring smell (Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive
  Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message
  Chains, Middle Man, Refused Bequest) is present in a two-function, nine-line script.

**Spec axis** — no findings. Requirement source: `start-content_source.json`.

- FR-1/FR-2: `defaultTitleOnCreate` sets `taradeh_title` to the literal `order:` only when
  `formContext.ui.getFormType() === "create"`, and does nothing otherwise — matching both the
  create-only default and the "leave untouched on any other form type" requirement.
- BD-2/BD-3: the create-only guard and the exact literal `order:` (no trailing space, no prefix
  reuse) are both implemented as decided.
- AU-1/AU-2: namespace and registration shape match the spec's Solution Design section (see
  Standards axis above for the grammar check); `passExecutionContext: true` is set in both the
  spec YAML and `event-registrations.yaml`.
- SEC-1, SEC-2, MIG-1, BD-1: none of these decisions requires or forbids a code change in this
  diff, and none is contradicted — no `DisplayConditions`/security-role edit, no server-side
  default, and no backfill logic appears anywhere in the change.
- FR-3 (web resource deployed and the form's `onload` event registered in FormXml) is the
  deployment-stage half of the requirement. This run's `run-state.json` records `"stage": "planned"`
  and no `deploy-result.json` exists anywhere in the task folder; deployment has not run yet in this
  lifecycle. That is not a defect in the reviewed change — the plan, spec, event-registration
  handoff, and script it produced are exactly the deploy stage's required input — so it is not
  reported as an unmet requirement here. No scope creep was found: nothing beyond FR-1–FR-3,
  AU-1/AU-2, and BD-2/BD-3 was added.

Most significant — Standards: none; the new resource, its namespace, and its event registration
conform to the OKF webresource bundle throughout. Spec: none; every requirement decidable at this
stage (FR-1, FR-2, BD-2, BD-3, AU-1, AU-2) is met, and the only requirement not yet fulfilled
(FR-3's deployment half) belongs to a lifecycle stage this run has not reached, not to a gap in
this change.
