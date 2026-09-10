# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy `taradeh_automated_main_operations.js` from `spec/index.json` and wire its `onload` handler on the `taradeh_automated` "Automated form" per `spec/event-registrations.yaml`, against `webresourceAutomatedForm`.

## Affected Web Resources

| Name | Type | Source | Scope source |
|---|---|---|---|
| `taradeh_automated_main_operations.js` | JavaScript (3) | `src\Resources\scripts\taradeh_automated_main_operations.js` | `spec/index.json` |

Wiring scope (`spec/event-registrations.yaml`): entity `taradeh_automated`, form "Automated form", control `form`, event `onload` → `Orgb788707aAutomatedSdk.formOnLoad`.

## Connection

- Environment: `https://orgb788707a.crm.dynamics.com`
- Auth: Azure CLI (`az login` session, active — verified via `az account show` before running)
- Solution: `webresourceAutomatedForm` (existing, resolved by the script — `40b9a5fe-2cad-f111-aaab-0022480a1382`)

## Deployment Plan

1. Resolve `index.json`, `event-registrations.yaml`, `webresource-baselines.json` — all present.
2. Pre-flight the target form (`taradeh_automated` / "Automated form") and confirm the `form`/`onload` registration target before any write.
3. Run `deploy.py` via `uv run` in the foreground with `--baselines` supplied (lost-update guard live).
4. Upload/update the resource, publish, associate to solution, patch form XML, publish again, re-read and verify.
5. Read `deploy-result.json` from disk and write this report.

Command:
```
uv run deploy.py --index spec/index.json --registrations spec/event-registrations.yaml \
  --baselines metadata/webresource-baselines.json --result deploy-result.json \
  --environment-url https://orgb788707a.crm.dynamics.com --solution-name webresourceAutomatedForm \
  2> deploy.log
```

## Pre-flight

| Entity | Form | Form resolved | Control | Event | Handler | Finding |
|---|---|---|---|---|---|---|
| `taradeh_automated` | Automated form | ✅ `f363c702-edac-f111-aaab-0022480a1382` | `form` | `onload` | `Orgb788707aAutomatedSdk.formOnLoad` | `controlPresent: true` — form-level registration accepted |

No missing forms or controls; wiring was not blocked.

## Execution

| Resource | Guard | Baseline SHA | Live SHA at deploy | Action | Published | Solution associated |
|---|---|---|---|---|---|---|
| `taradeh_automated_main_operations.js` | `ok` | `e6f977734e2f9f06c872255a9739db1be9abd4becdca3a282461900ac3535bdb` | matches baseline | `updated` | ✅ | ✅ (already present) |

No resource was refused; the lost-update guard passed (live content matched the recorded baseline).

Form patch: unpublished FormXml patched → web resource/entity/form already in target solution → published.

## Result

- Resource: `taradeh_automated_main_operations.js` — `action: updated`, `error: ""`, `guard: ok`.
- Form patch: entity `taradeh_automated`, form "Automated form", library `taradeh_automated_main_operations.js`.
- `problems: []`
- Process exit code: `0`

## Verification

| Form | Verified | Control | Event | Handler | controlPresent | persisted |
|---|---|---|---|---|---|---|
| Automated form | ✅ true | `form` | `onload` | `Orgb788707aAutomatedSdk.formOnLoad` | true | true |

Post-publish re-read confirmed the `<Library>` entry and the `<Handler>` for `onload` in the parsed FormXml.

## Next Action

None. Deployment completed cleanly: the resource was updated and published, the guard passed with no drift, and the form's onload handler was verified persisted after publish. No corrective action is required.
