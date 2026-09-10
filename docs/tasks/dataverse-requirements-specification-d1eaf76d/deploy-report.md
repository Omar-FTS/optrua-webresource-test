# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy `taradeh_automated_main_operations.js` to https://orgb788707a.crm.dynamics.com, associate with solution `webresourceAutomatedForm`, and wire the `onload` handler `Orgb788707aAutomatedSdk.formOnLoad` on the "Automated form" form (table `taradeh_automated`).

## Affected Web Resources

Scope taken from `index.json` (publisher prefix `taradeh`):

| Name | Source File | Spec |
|---|---|---|
| `taradeh_automated_main_operations.js` | `src/Resources/scripts/taradeh_automated_main_operations.js` | `automated-form-onload.yaml` |

Wiring scope taken from `event-registrations.yaml`:

| Web Resource | Entity | Form | Control | Event | Handler |
|---|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | `taradeh_automated` | Automated form | form | onload | `Orgb788707aAutomatedSdk.formOnLoad` (passExecutionContext: true) |

## Connection

- Environment: `https://orgb788707a.crm.dynamics.com` (host only; no path/query retained)
- Auth: Azure CLI (`az account get-access-token`), active session confirmed before run (subscription `64490bfe-842f-4c7f-8a47-f976dba50a22`)
- Solution: `webresourceAutomatedForm` (existing solution, resolved by name — not created)

## Deployment Plan

1. Resolve `index.json`, `event-registrations.yaml`, `webresource-baselines.json` (baselines file had `resources: []` — no prior baseline recorded for this resource).
2. Pre-flight the target form `Automated form` on `taradeh_automated`.
3. Upload `taradeh_automated_main_operations.js` (guarded by lost-update check; `no-baseline` state only applies if the resource already exists live — it did not, so guard resolved `ok`/create).
4. Associate resource with solution `webresourceAutomatedForm`, publish.
5. Patch form XML to add `<formLibraries>` entry and the onload handler, associate entity + form to the solution, publish form + resource.
6. Re-read published FormXml to verify handler persistence.

## Pre-flight

- Form `taradeh_automated` / `Automated form`: **resolved** (id `f363c702-edac-f111-aaab-0022480a1382`).
- Handler check: `form onload -> Orgb788707aAutomatedSdk.formOnLoad` — control present: **True**.
- No missing forms or controls; wiring scope was not blocked.

## Execution

```
uv run deploy.py --index spec/index.json --registrations spec/event-registrations.yaml \
  --baselines metadata/webresource-baselines.json --result deploy-result.json \
  --environment-url https://orgb788707a.crm.dynamics.com --solution-name webresourceAutomatedForm
```

- `taradeh_automated_main_operations.js`: created (did not exist live before this run).
- Web resource added to solution `webresourceAutomatedForm`; published.
- Form XML patched: `<formLibraries>` entry added for the web resource, `onload` handler registered.
- Entity `taradeh_automated` and form `Automated form` added to solution `webresourceAutomatedForm`.
- Form + web resource published together.

Artifacts: `deploy.log` (stderr progress), `deploy-result.json` (machine-readable result), this report.

## Result

| Resource | Type | Action | Guard | Published | Solution Associated | Error |
|---|---|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | 3 (JS) | created | ok | true | true | — |

| Form | Verified | Error |
|---|---|---|
| `taradeh_automated` / Automated form | true | — |

## Verification

Post-publish semantic re-read of the FormXml confirmed:

| Control | Event | Handler | Control Present | Persisted |
|---|---|---|---|---|
| form | onload | `Orgb788707aAutomatedSdk.formOnLoad` | true | true |

`formPatches[0].verified: true` — the `<Library>` entry for `taradeh_automated_main_operations.js` and the `onload` handler were both confirmed present in the published FormXml after publish.

Process exit code: **0**. `problems: []`.

## Next Action

None required — the resource is created, published, solution-associated, and the form registration is verified persisted. No refusals occurred (baseline guard resolved `ok` since the resource did not previously exist live).
