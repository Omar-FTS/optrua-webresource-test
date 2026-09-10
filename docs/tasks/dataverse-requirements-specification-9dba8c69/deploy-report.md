# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy `index.json`/`event-registrations.yaml` scope for the `dataverse-requirements-specification-9dba8c69` change to `https://orgb788707a.crm.dynamics.com`, associated with solution `webresourceAutomatedForm`.

## Affected Web Resources

| Name | Type | Source File | Action |
|---|---|---|---|
| `taradeh_automated_main_operations.js` | JavaScript (3) | `src/Resources/scripts/automated-form.js` | created |

Scope resolved from `spec/index.json` (1 entry) and `spec/event-registrations.yaml` (1 registration). No other files were considered.

## Connection

- Environment: `https://orgb788707a.crm.dynamics.com`
- Auth: Azure CLI (`az account get-access-token`), authenticated session for `omar@optrua.com` (tenant `optrua.com`)
- Solution: `webresourceAutomatedForm`

## Deployment Plan

1. Upload/update `taradeh_automated_main_operations.js` from `src/Resources/scripts/automated-form.js` (JavaScript), guarded against baseline drift.
2. Associate the resource with solution `webresourceAutomatedForm`.
3. Publish the resource.
4. Patch the `Automated form` form on `taradeh_automated` to add the form library and one `onload` handler (`Orgb788707aAutomatedSdk.formOnLoad`, `form` control, `passExecutionContext: true`).
5. Add entity and form components to the solution.
6. Publish form + web resource.
7. Re-read the published form and verify the library and handler are present semantically.

## Pre-flight

- Target form resolved: `Automated form` on table `taradeh_automated` → form id `f363c702-edac-f111-aaab-0022480a1382`.
- Handler finding: `form` control, `onload` event, handler `Orgb788707aAutomatedSdk.formOnLoad` — control present: **true**.
- No other forms were targeted; scope stayed limited to this one form/entity/resource per `event-registrations.yaml`.

## Execution

Baseline check: `webresource-baselines.json` contained no baseline entry for `taradeh_automated_main_operations.js` (`"resources": []`). The resource did not exist live, so guard state was `ok` (per the guard table, a not-yet-existing resource is `ok`) and creation proceeded — no drift/no-baseline refusal applied.

- `taradeh_automated_main_operations.js`: **created**, published, associated with `webresourceAutomatedForm`.
- Form `Automated form` (`taradeh_automated`): FormXml patched (unpublished layer), entity + form added to solution, then published.

Command run:
```
uv run <SKILL_DIR>/scripts/deploy.py \
  --index spec/index.json \
  --registrations spec/event-registrations.yaml \
  --baselines metadata/webresource-baselines.json \
  --result deploy-result.json \
  --environment-url https://orgb788707a.crm.dynamics.com \
  --solution-name webresourceAutomatedForm \
  2> deploy.log
```
Exit code: 0.

## Result

```json
{
  "status": "DEPLOYED",
  "resources": [
    {
      "name": "taradeh_automated_main_operations.js",
      "action": "created",
      "guard": "ok",
      "published": true,
      "solutionAssociated": true
    }
  ],
  "formPatches": [
    {
      "entity": "taradeh_automated",
      "form": "Automated form",
      "libraries": ["taradeh_automated_main_operations.js"],
      "verified": true
    }
  ],
  "problems": []
}
```

## Verification

- Resource `taradeh_automated_main_operations.js`: action `created`, guard `ok`, `published: true`, `solutionAssociated: true`.
- Form `Automated form` on `taradeh_automated`: `verified: true` (post-publish semantic re-read succeeded).
- Handler `form`/`onload` → `Orgb788707aAutomatedSdk.formOnLoad`: `controlPresent: true`, `persisted: true`.
- No problems reported. Process exit code 0, matching status `DEPLOYED`.

## Next Action

None required — deployment completed successfully with every resource created/published and the requested handler persisted and verified in the live FormXml.
