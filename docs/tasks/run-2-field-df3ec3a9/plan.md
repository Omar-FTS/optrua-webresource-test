# Plan: Automated form field events (Run 2)

## Requirement

Source: `C:\Users\Omar Taladeh\.adw\projects\optrua-webresource-test-5f4e2873\agents\df3ec3a9\start-content_source.json`
(originally `02-field-events.md`).

Extend the deployed `opt_automated_main_operations.js` resource — namespace
`OptruaAutomatedSdk`, entity `opt_automated`, Main form `Automated form` — with three direct
field `onchange` handlers, all `executionContext`-based:

- **`onTitleChange`** on `opt_title`: copy `opt_title` into `opt_name` only when `opt_name` is
  currently empty; leave a populated `opt_name` untouched.
- **`onNewColumnChange`** on `opt_newcolumn`: when `opt_newcolumn` has a value, clear only the
  Run 1 missing-value notification `opt-newcolumn-required`; never touch the record-name or
  description-warning notifications.
- **`onDescriptionChange`** on `opt_description`: warn with notification ID
  `opt-description-length` (message includes the character count) when the value exceeds 200
  characters; no warning at exactly 200; clear only that notification below the threshold.

The requirement is explicit that Run 1's two form-level registrations (`formOnLoad` on
`onload`, `formOnSave` on `onsave`) must survive unchanged, and that no registration beyond
the three listed field `onchange` events is added.

## Live state

The inventory is form-scoped: a resource no form references is absent from it, so `origin`
below is a probe result, not an assumption from the snapshot alone.

The supplied `metadata_dir` snapshot (`opt_automated.json`, `fetchedAt`
2026-09-06T21:20:53Z) reported **no** `opt_automated_main_operations.js` web resource in
`webresourceset` and **zero** form-level or field-level registrations on `Automated form`
(formid `f517761c-5e4c-f111-bec6-7ced8d6feee8`). Taken alone, that would mean Run 1's
precondition ("Run 1 completed with DEPLOYED") was unmet, which would be a blocker: this run
cannot fabricate Run 1's preserved behavior from nothing.

Because that finding directly gates whether this run can even start, it was independently
re-verified with two live `GET` calls against `https://optrua-dev.crm.dynamics.com` (Azure CLI
bearer token, no write of any kind):

1. `webresourceset?$filter=contains(name,'opt_automated')` — returns exactly one row:
   `opt_automated_main_operations.js`, `webresourceid`
   `7056a206-39aa-f111-aaab-7ced8d6f7afa`.
2. `systemforms(f517761c-5e4c-f111-bec6-7ced8d6feee8)?$select=formxml` — the form's
   `formLibraries` loads that resource, and its `events` carry exactly two registrations:
   `onload` → `OptruaAutomatedSdk.formOnLoad` and `onsave` → `OptruaAutomatedSdk.formOnSave`,
   both `passExecutionContext="true"`, matching the requirement's description of Run 1
   exactly.
3. The resource's live `content` (base64-decoded) implements both handlers: `formOnLoad` sets
   notification `opt-record-name` from `opt_name`; `formOnSave` enforces `opt_newcolumn` via
   `executionContext.getEventArgs().preventDefault()` and toggles notification
   `opt-newcolumn-required`. Neither `onTitleChange`, `onNewColumnChange`, nor
   `onDescriptionChange` exists anywhere in the current content.

Conclusion: the snapshot in `metadata_dir` predates Run 1's deploy and is stale; the live
reads supersede it and confirm the requirement's stated starting state is real. This run
proceeds as an **extension** of an `existing` resource — origin: existing,
`context.reuseRefs` points at the `opt_automated.json` form entry for `Automated form` even
though that specific snapshot is the stale one; the live probe is the record of truth cited
above. Nothing in the deployed content already satisfies any of the three requested handlers,
so all three are a genuine addition (Step 3's "read the body, not just the registration"
check was performed, not assumed).

## Design decisions

- **Extend, not replace.** `opt_automated_main_operations.js` is already deployed and loaded
  by `Automated form` with two working handlers. `implementation-decisions.md` calls
  duplicating a script on the same form for the same purpose a double maintenance cost; the
  requirement itself also forbids authoring a replacement file. `origin: existing` in the
  spec, `removes: []` since nothing is deleted.
- **Three field `onchange` registrations, no `onload` wrapper.** Each handler binds directly
  to its field's `onchange` per `event-registration.md` — a field-level concern is declared
  against the field, not folded into `formOnLoad` with a runtime `addOnChange` call.
- **No new form-level event.** The requirement caps the registration set at five total (two
  preserved + three new); `event-registrations.yaml` carries exactly those five, matching the
  requirement's own YAML contract verbatim.
- **Notification IDs are exact strings, reused across handlers deliberately.**
  `opt-newcolumn-required` is Run 1's ID, set by `formOnSave`; `onNewColumnChange` clears the
  *same* ID rather than defining a new one, because the requirement ties the two together
  (the field handler relieves the save-time error as soon as the user supplies a value).
  `opt-description-length` is new to this run and touched by `onDescriptionChange` alone.
- **Namespace unchanged.** `OptruaAutomatedSdk` is the namespace Run 1 already established;
  this run does not re-derive it from the client/entity-name grammar since the resource
  already exists under this name.

## Deployment order

Single resource, one `index.json` entry: `opt_automated_main_operations.js`. No shared
utility or dependency ordering applies — this is the only resource in scope.

## Assumptions

- The live-probe re-verification above is treated as authoritative over the supplied
  `metadata_dir` snapshot, which is falsifiable: a subsequent read of
  `opt_automated.json` (or a fresh inventory run) should show the resource and its two
  registrations once regenerated.
- The exact wording of the `opt-description-length` notification message beyond "contains the
  character count" is left to the writing step; the requirement does not specify exact
  copy.
- `sourceFile` is set to `src/Resources/scripts/opt_automated_main_operations.js`, matching
  the flat-script convention already used for this resource name in sibling work on this
  project; no `src/` tree exists yet in this worktree; the writing step creates it.
- The `webresource` bundle resolved at `~/.fts-kit/okfs/webresource/` (second lookup
  location); no degradation to record.

## Out of scope

- Whether `formOnLoad`'s `opt-record-name` notification and `formOnSave`'s save-blocking
  behavior should themselves change is not part of this ticket; both are preserved verbatim
  per the requirement's explicit instruction.
- Server-side enforcement (a business rule or plug-in requiring `opt_newcolumn` at the API
  level, independent of this client-side save guard) is not requested and not planned here.
