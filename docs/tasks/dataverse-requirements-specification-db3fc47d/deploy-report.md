# Dataverse Web Resource Deploy

Status: DEPLOYED
Request: Deploy `opt_automated_main_operations.js` per `spec/index.json`, wire it to the `opt_automated` "Automated form" onload event per `spec/event-registrations.yaml`, guarded against lost updates by `metadata/webresource-baselines.json`, into solution `automatedonloadr1` on `https://optrua-dev.crm.dynamics.com`.

## Affected Web Resources

Scope resolved from `spec/index.json` (1 entry) — no folder walk performed.

| Name | Type | Source File |
|---|---|---|
| `opt_automated_main_operations.js` | JavaScript (type 3) | `src/Resources/scripts/opt-automated-main-operations.js` |

Wiring scope resolved from `spec/event-registrations.yaml`:

| Entity | Form | Control | Event | Handler |
|---|---|---|---|---|
| `opt_automated` | Automated form | form | onload | `OptruaAutomatedSdk.formOnLoad` |

## Connection

- Environment: `https://optrua-dev.crm.dynamics.com` (host only, no credentials recorded)
- Auth: Azure CLI (`az account get-access-token --resource <environment_url>`), active session for `omar@optrua.com`, verified before running the script
- Target solution: `automatedonloadr1` (existing, resolved id `00e09a5f-61ac-f111-aaac-7ced8d6f7afa`) — no `--friendly-name`/`--publisher-name` needed, solution already existed

## Deployment Plan

1. Resolve `index.json`, `event-registrations.yaml`, `webresource-baselines.json` — all resolved successfully.
2. Guard is live: `--baselines` was supplied, baseline recorded for `opt_automated_main_operations.js` (`baselineSha: 205178...9e10`).
3. Pre-flight target form `opt_automated / Automated form` and its requested `onload` control before any write.
4. Run `uv run deploy.py` in the foreground with `--index`, `--registrations`, `--baselines`, `--result`, `--environment-url`, `--solution-name`, stderr redirected to `deploy.log`.
5. Read `deploy-result.json` from the path the script wrote it to.

Command executed:

```
uv run "C:\Users\Omar Taladeh\.claude\skills\dataverse-webresource-deploy\scripts\deploy.py" \
  --index "<spec-dir>\spec\index.json" \
  --registrations "<spec-dir>\spec\event-registrations.yaml" \
  --baselines "<spec-dir>\metadata\webresource-baselines.json" \
  --result "<spec-dir>\deploy-result.json" \
  --environment-url "https://optrua-dev.crm.dynamics.com" \
  --solution-name "automatedonloadr1" \
  2> "<spec-dir>\deploy.log"
```

Exit code: `0`.

## Pre-flight

- Target form `opt_automated / Automated form` resolved to live form id `f517761c-5e4c-f111-bec6-7ced8d6feee8`.
- Requested handler `form / onload -> OptruaAutomatedSdk.formOnLoad` confirmed against the live FormXml before any write: `controlPresent: true`.
- No missing forms or controls; wiring scope was not blocked.

## Execution

- `opt_automated_main_operations.js`: existing resource, guard state `ok` (`baselineSha` matched `liveShaAtDeploy` = `c7afbce2c288dc6483bb872ec3c1a0d5e4b9fe813320e3eb3d2d1e8df22f6cbd`) — content updated, not refused.
- Added to solution `automatedonloadr1`.
- Published.
- Form `Automated form`: library already registered, handler already registered in the unpublished layer prior to this run's patch; form XML patched, entity and form added to solution `automatedonloadr1`, form + web resource published together (publish-then-verify order followed per deployment-gotchas guidance).

## Result

```json
{
  "status": "DEPLOYED",
  "resources": [
    {
      "name": "opt_automated_main_operations.js",
      "action": "updated",
      "guard": "ok",
      "published": true,
      "solutionAssociated": true,
      "error": ""
    }
  ],
  "formPatches": [
    {
      "entity": "opt_automated",
      "form": "Automated form",
      "verified": true,
      "handlers": [
        { "control": "form", "event": "onload", "handler": "OptruaAutomatedSdk.formOnLoad", "controlPresent": true, "persisted": true }
      ],
      "error": ""
    }
  ],
  "problems": []
}
```

## Verification

- Resource `opt_automated_main_operations.js`: `action: updated`, `guard: ok`, `published: true`, `solutionAssociated: true`, no error.
- Form `opt_automated / Automated form`: `verified: true` — post-publish semantic re-read of FormXml parsed successfully.
- Handler `form / onload -> OptruaAutomatedSdk.formOnLoad`: `controlPresent: true` (pre-flight), `persisted: true` (post-publish re-read) — consistent (no invalid `controlPresent:false` + `persisted:true` combination).
- `problems`: none.
- Process exit code `0`, matching `DEPLOYED`.

## Next Action

None required. The deployment completed fully: the web resource was updated, published, and associated with `automatedonloadr1`, and the onload handler on `opt_automated / Automated form` is confirmed persisted in the live, published FormXml. No further action needed.
