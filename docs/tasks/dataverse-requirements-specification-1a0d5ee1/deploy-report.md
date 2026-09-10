# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy the `taradeh_automated_main_operations.js` web resource from `index.json`/`event-registrations.yaml` to `https://orgb788707a.crm.dynamics.com`, wire its `onload` handler onto the `Automated form` form on `taradeh_automated`, and associate everything with the `webresourceAutomatedForm` solution.

## Affected Web Resources

Scope resolved from `spec/index.json` (1 resource) and `spec/event-registrations.yaml` (1 registration):

| Resource | Source | Type |
|---|---|---|
| `taradeh_automated_main_operations.js` | `src/Resources/scripts/taradeh_automated_main_operations.js` | JavaScript |

## Connection

- Environment: `https://orgb788707a.crm.dynamics.com` (redacted host, no path/query)
- Auth: Azure CLI session (`az account show` → `omar@optrua.com`)
- Target solution: `webresourceAutomatedForm`

## Deployment Plan

1. Pre-flight the target form `Automated form` on `taradeh_automated` and confirm the `form`/`onload` control can receive the registered event.
2. Upload/update `taradeh_automated_main_operations.js`, guarded by `webresource-baselines.json`.
3. Associate the resource with solution `webresourceAutomatedForm` (skip if already present).
4. Publish the web resource.
5. Patch the form's FormXml to add the library and `onload → Orgb788707aAutomatedSdk.formOnLoad` handler (skip if already registered), associate entity/form/resource with the solution, publish form + resource.
6. Re-read the published form and verify the handler persisted.

## Pre-flight

| Form | Entity | Resolved | Control | Event | Handler | controlPresent |
|---|---|---|---|---|---|---|
| Automated form (`f363c702-edac-f111-aaab-0022480a1382`) | taradeh_automated | yes | form | onload | `Orgb788707aAutomatedSdk.formOnLoad` | true |

No missing forms or controls; wiring was not blocked.

## Execution

Command:

```
uv run deploy.py --index spec/index.json --registrations spec/event-registrations.yaml \
  --baselines metadata/webresource-baselines.json --result deploy-result.json \
  --environment-url https://orgb788707a.crm.dynamics.com --solution-name webresourceAutomatedForm
```

Ran to completion in the foreground, exit code `0`. Full trace in `deploy.log`.

- `taradeh_automated_main_operations.js`: guard `ok` (live SHA matched baseline `552dd83a…`), action `updated`, published, already in solution (no-op association).
- Library `taradeh_automated_main_operations.js` was already registered on the form; `onload → Orgb788707aAutomatedSdk.formOnLoad` was already registered. Form XML was still patched and republished as part of the run, and entity/form/resource were already solution members (no-op).

## Result

Read from `deploy-result.json` written by the script:

| Resource | Action | Guard | Published | Solution Associated |
|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | updated | ok | true | true |

`problems`: none.

## Verification

| Form | Verified | Handler | controlPresent | persisted |
|---|---|---|---|---|
| Automated form (taradeh_automated) | true | `form`/`onload` → `Orgb788707aAutomatedSdk.formOnLoad` | true | true |

## Next Action

None. All resources in scope deployed and published, and the requested form registration is confirmed persisted in the published FormXml. No corrective action required.
