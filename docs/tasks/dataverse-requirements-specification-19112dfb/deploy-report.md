# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy `taradeh_automated_main_operations.js` to https://orgb788707a.crm.dynamics.com, associate with solution `webresourceAutomatedForm`, and wire its `onload` handler on the "Automated form" form for entity `taradeh_automated`, per `spec/index.json` and `spec/event-registrations.yaml`.

## Affected Web Resources

| Name | Type | Source | Guard baseline SHA |
|---|---|---|---|
| `taradeh_automated_main_operations.js` | JavaScript (3) | `src/Resources/scripts/taradeh_automated_main_operations.js` | `e6f977734e2f9f06c872255a9739db1be9abd4becdca3a282461900ac3535bdb` |

Scope source: `spec/index.json` (1 resource) and `spec/event-registrations.yaml` (1 registration, no others).

## Connection

- Environment: `https://orgb788707a.crm.dynamics.com`
- Auth: Azure CLI (`az account get-access-token`), authenticated as `omar@optrua.com` (tenant `optrua.com`)
- Target solution: `webresourceAutomatedForm` (existing, id `40b9a5fe-2cad-f111-aaab-0022480a1382`)

## Deployment Plan

1. Pre-flight the target form `taradeh_automated` / "Automated form" and confirm the `form` control can receive `onload`.
2. Upload/update `taradeh_automated_main_operations.js` (guarded by baseline SHA comparison since `--baselines` was supplied).
3. Associate the web resource with solution `webresourceAutomatedForm` (already associated).
4. Publish the web resource.
5. Patch the form's FormXml to register the library and the `onload -> Orgb788707aAutomatedSdk.formOnLoad` handler (already registered on the unpublished layer; form patch applied and republished).
6. Associate entity/form components with the solution (already associated).
7. Publish form + web resource together.
8. Re-read the published form and verify the handler persisted.

## Pre-flight

- Form: `taradeh_automated` / "Automated form" — resolved (form id `f363c702-edac-f111-aaab-0022480a1382`).
- Handler check: `form` control, `onload` event, handler `Orgb788707aAutomatedSdk.formOnLoad` — control present: **true**.
- No other forms or controls are in scope. No blocking findings.

## Execution

Command:

```
uv run scripts/deploy.py \
  --index docs/tasks/dataverse-requirements-specification-19112dfb/spec/index.json \
  --registrations docs/tasks/dataverse-requirements-specification-19112dfb/spec/event-registrations.yaml \
  --baselines docs/tasks/dataverse-requirements-specification-19112dfb/metadata/webresource-baselines.json \
  --result docs/tasks/dataverse-requirements-specification-19112dfb/deploy-result.json \
  --environment-url https://orgb788707a.crm.dynamics.com \
  --solution-name webresourceAutomatedForm
```

Ran in the foreground to completion; exit code `0`. Stderr captured to `deploy.log`.

Log summary:
- Resolved pre-flight form and confirmed handler target.
- Updated `taradeh_automated_main_operations.js` (guard: `ok`, live SHA matched baseline SHA).
- Web resource and entity/form already in solution `webresourceAutomatedForm` — no new associations needed.
- Published the web resource.
- Form library and handler were already registered on the unpublished layer; form XML patched and republished (web resource + form) to ensure the published layer matches.
- Post-publish re-read confirmed the handler persisted.

## Result

| Resource | Action | Guard | Published | Solution Associated |
|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | updated | ok | true | true |

No resources refused. No failures.

## Verification

| Entity | Form | Verified | Library | Control | Event | Handler | Control Present | Persisted |
|---|---|---|---|---|---|---|---|---|
| `taradeh_automated` | Automated form | true | `taradeh_automated_main_operations.js` | `form` | `onload` | `Orgb788707aAutomatedSdk.formOnLoad` | true | true |

Post-publish re-read of the FormXml confirmed the library reference and the `onload` handler are present in the published form.

## Next Action

None required. The web resource is updated, published, associated with `webresourceAutomatedForm`, and the `onload` handler is wired and verified on the "Automated form" form. No follow-up correction is needed.
