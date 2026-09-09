# Entity Context: Automated (opt_automated)

> **Entity logical name:** `opt_automated`
> **Primary app:** ADW Skill Test App (`opt_ADWSkillTestApp`, appmoduleid `39e7b4c1-f49e-f111-aaad-0022480b1bfa`)
> **Primary form:** Automated form
> **Last updated:** 2026-09-08

---

## Entity Resolution

| Field | Value |
|---|---|
| Logical name | `opt_automated` |
| Display name | Automated |
| Display collection name | Automateds |
| Entity set name (OData) | `opt_automateds` |
| Primary id field | `opt_automatedid` |
| Primary name field | `opt_newcolumn` |
| Object type code | 12546 |
| Ownership | UserOwned |
| Custom entity | Yes |

---

## Required Fields (on primary form)

Fields that block save if empty. Source: live Metadata API `RequiredLevel` plus live form
attribute state read via `Xrm.Page.getAttribute().getRequiredLevel()`.

| Field Display Name | Logical Name | Type | Required By | On Primary Form |
|---|---|---|---|---|
| New column | `opt_newcolumn` | Text (primary name) | System (`ApplicationRequired`) | Yes |
| Len | `opt_length` | Text | Recommended | No — attribute not bound on Automated form (`Xrm.Page.getAttribute('opt_length')` returns null there) |

No business-rule-driven required fields were observed during this exploration; none of the
other fields changed required level in the probed session.

---

## Key Business Rules

None discovered during this exploration. Only a single record was opened; no field-triggered
cascades were exercised. Record as a gap, not as "confirmed absent."

---

## Plugins / Server-Side Logic

Not probed by this exploration (Metadata API call for plugin steps was out of scope — this
skill covers entity/attribute metadata only). No warning surfaced from a normal record open.
Use the `dataverse-customization-inventory` skill for a definitive answer before assuming
Create/Update is side-effect-free.

---

## Key Relationships

Not probed by this exploration — `dataverse-metadata-relationships` was not invoked for this
entity. No related-entity subgrids were observed on the single "Related" tab; contents were
not expanded.

---

## Forms

| Form Name | Form Type | Notes |
|---|---|---|
| Automated form | Main | Confirmed live via `[data-id="form-selector"]` → "Automated form". This is the form named as `target.form` in the `opt_automated_main_operations.js` event-registrations spec (formType: Main). |

### Automated form — structure (live)

- Tabs: `New Tab` (literal tab label as rendered — not a placeholder in this document), `Related`.
- Fields present and bound on `New Tab` (verified via `Xrm.Page.getAttribute`):
  - `opt_newcolumn` — required, visible, enabled. Primary name field.
  - `opt_name` — not required, visible, enabled.
  - `opt_title` — not required, visible, enabled.
  - `opt_description` — not required, visible, enabled.
- Fields confirmed **not** bound on this form: `opt_label`, `opt_length` (both exist on the
  entity per live Metadata API, but `Xrm.Page.getAttribute()` returned `null` for both when
  the form was open — they carry no control on Automated form).

---

## Option Sets / Choices

No Picklist/Boolean/State-Reason custom choice fields exist on this entity beyond the standard
`statecode`/`statuscode`. No local or global option sets required enrichment.

---

## Grid (Active Automateds view)

- Sitemap path: single-area app, group **"New Group"** → treeitem **"Automateds"**.
- Grid command bar accessible name: `Automated Commands`.
- Observed grid commands: `Focused view`, `Show Chart`, `Edit` (tooltip: "Edit this Automated."),
  `Activate` (tooltip: "Activate these Automateds. Active records can be edited, assigned,
  shared, or viewed from the Active Automateds view."), `More commands for Automated` (overflow).
- Grid columns on the default "Active automateds" view: `New column`, `Len`, `Title`.
- Default view carries filters: `Status:Active`, `Created On:This week`.

---

## Testing Notes

- **Navigation:** `opt_automated` is exposed only through the **ADW Skill Test App**
  (appmoduleid `39e7b4c1-f49e-f111-aaad-0022480b1bfa`), not through Sales Hub. The
  `project.config.json` `appIds.default` for the `optrua-dev` environment is currently Sales
  Hub (`15c8e2ef-bf2b-ed11-9db0-0022480925cc`), which does **not** expose this entity —
  `openAppRoot(page)` with no override lands in an app with no navigation entry for
  `opt_automated`. A spec targeting this entity must pass `QA_APP_ID=39e7b4c1-f49e-f111-aaad-0022480b1bfa`
  (or otherwise select the ADW Skill Test App) rather than relying on the environment default.
- **Row-open pattern:** clicking a treegrid row directly toggles its selection checkbox rather
  than opening the record — open the record via the row's link (primary-name cell) instead:
  `row.getByRole('link').first().click()`.
- **Form command bar:** the form-scoped `getByRole('menubar').first()` resolved to the same
  "Global commands" bar seen on the grid rather than an entity-specific Save/Save & Close bar
  during this probe — the entity-specific form command bar name was not confirmed. Treat any
  spec's Save-button interaction as needing the stable `[data-id$="Mscrm.Form.opt_automated.Save"]`
  selector (per `senior-patterns.md`) rather than a `clickCommand()` label match until this is
  verified directly.
- **Tab label:** the only data tab on Automated form renders with the literal accessible name
  `New Tab` — this is the actual label in the org, not a template placeholder left in this
  document.

---

## How to Refresh This File

```
# Get all fields, types, required levels:
→ Use the `dataverse-metadata-entity` skill with entity = "opt_automated"

# Get all plugins, flows, business rules registered on this entity:
→ Use the `dataverse-customization-inventory` skill for entity = "opt_automated"

# Get relationships:
→ Use the `dataverse-metadata-relationships` skill for entity = "opt_automated"
```

Then update this file with the fresh data.
