# Expo Launch Publish Failures

Use captured build logs to diagnose failed Expo Launch store publishes.

## Scope

Read this reference when an App Store or Google Play publish through Expo Launch fails or the user asks why it failed. Google Play availability is determined by the Expo skill's publishing guidance, not this diagnostic reference. For web deployment failures, use the deployment skill instead.

Do not run or suggest EAS CLI commands. Replit owns the build and submission flow; Agent may read diagnostics and fix project files, but the user retries from the Publish pane.

## `getExpoLaunchLogs()`

Call `getExpoLaunchLogs()` with no arguments. It returns the latest Expo Launch session for the current Repl. Select the platform the user reported: `ios` for App Store or `android` for Google Play. This example diagnoses an App Store failure; set `targetPlatform` to `android` for a Google Play failure:

```javascript
const result = await getExpoLaunchLogs();
if (!result.success) {
  console.log(result.error);
  return;
}

if (result.message) {
  console.log(result.message);
}

const targetPlatform = "ios";
const launch = result.launches.find(
  ({ platform, status }) =>
    platform === targetPlatform &&
    (status === "FAILURE" || status === "ACTION_REQUIRED"),
);
if (!launch) {
  console.log(`No failed ${targetPlatform} workflow found.`);
  return;
}

if (launch.status === "ACTION_REQUIRED") {
  console.log(launch.status);
  return;
}

const logs = launch.logs.join("\n");
console.log({
  workflowRunId: launch.workflowRunId,
  logCharacters: logs.length,
});
console.log(logs.slice(-7000));
```

A successful result has this shape:

- `success`: `true`
- `launches`: workflow runs from the latest session
- `sessionStatus`: present when `launches` is empty; `found` means a session exists, `not_found` means no session is recorded, and `unknown` means the server did not report session existence
- `message`: an explanation when no workflow runs are returned

A failed request returns `{ success: false, error }`. Report that temporary service error and stop; do not read `launches` or invent a publish diagnosis.

Each launch contains:

- `workflowRunId`: Expo workflow UUID
- `platform`: `ios` for App Store, `android` for Google Play, or `web` for EAS Hosting
- `status`: `NEW`, `IN_PROGRESS`, `ACTION_REQUIRED`, `SUCCESS`, `FAILURE`, or `CANCELED`
- `logs`: bounded failure-relevant product log lines retained for 30 days after capture from a failed store workflow

## Workflow

1. Identify the affected app, platform and reported error.
2. Call `getExpoLaunchLogs()` and match the reported failed workflow when its
   ID or dashboard link is available. The tool returns the latest saved
   session's workflows, not preparation or upload logs. An upload can fail
   before a session is saved; an empty result does not prove publishing was
   never attempted, and an older workflow does not explain the new failure.
   If the attempt cannot be matched, use the reported Publish error and state
   that the retrieved workflow logs cannot be attributed to it.
3. Read the final log window and identify the first actionable error, not the
   cascade that follows it. Classify source preparation/upload separately from
   dependency installation, native build, signing and submission. For upload
   errors, follow the section below before changing project files.
4. Use `app-standard.md` diagnostics only when captured logs identify app-side
   dependency/configuration trouble requiring them and existing evidence is
   insufficient. For SDK 58+ setup failures, use its relevant criteria and only
   their matching repairs. Fix the files responsible
   for the captured error, preserving the standard's behavior and security
   requirements. Do not turn account, signing, provider or user-action failures
   into app nonconformance or run unrelated conversion checks.
5. If a repair changes app source, dependencies, configuration or upload contents,
   follow the Expo skill's republish order before the user starts Expo Launch
   again. For other repairs, the user retries from the Publish pane. If the
   upload failure remains unresolved, use the support handoff below instead of
   prescribing an unchanged retry.

Do not print the complete log stream at once because long output is truncated. If the actionable error is not in the final 7,000 characters, rerun the call with earlier windows such as `logs.slice(-14000, -7000)`.

If a failed workflow has no retained logs, do not invent a diagnosis or run EAS locally.

`ACTION_REQUIRED` is not a project build failure.

When the retrieved logs identify one of these project-side failures:

- `app.config.ts` or `app.config.js`. For SDK 58+, follow the standard's static
  configuration repair rather than deleting files directly. For earlier SDKs,
  move the settings into static `app.json` and delete the dynamic config.
- Lockfiles containing `package-firewall.replit.internal` or legacy
  `package-firewall.replit.local` URLs. For SDK 58+, use the standard's lockfile
  repair to diagnose source usability without bypassing registry/security
  policy. For earlier SDKs, reinstall dependencies so the lockfile uses the
  public npm registry.

## Source upload failures

For archive scope, EAS files and republish order, see the Expo skill's
[Publishing section](../SKILL.md#publishing). Project ignore files are not
mobile-upload exclusion controls. Agent can inspect the current workspace, but
`getExpoLaunchLogs()` does not expose the publishing fork, archive manifest or
preparation/upload records. A filesystem inventory alone does not establish
which files were uploaded.

1. Read the available error sequence. An upload HTTP 413 means the request
   was rejected as too large; it does not reveal the compressed bytes sent or
   the current limit. A later HTTP 401 while downloading the archive can be
   a secondary failure of the short-lived archive credential on a retry.
   Do not replace an earlier 413 diagnosis with a customer login diagnosis,
   or assert credential expiry without evidence. Agent cannot retrieve
   these internal retry records through `getExpoLaunchLogs()`.
2. If size investigation is warranted, inventory the current project from
   its workspace root, not only the mobile app directory:

   ```bash
   du -x -b --max-depth=2 . | sort -n | tail -25
   ```

   These are current filesystem sizes in bytes, including excluded files,
   not the failed fork's contents or compressed upload size. Inspect the
   largest relevant directories further with the same command at that path.
   Label any local archive measurement with its scope, exclusions and source
   revision; do not present a custom local archive as Replit's payload.
3. Before proposing cleanup, establish that a specific file is included and
   unnecessary for this app or another workspace consumer. Preserve source,
   shared code, workspace dependencies, root build inputs and runtime assets.
   Do not bulk-delete files, remove required assets or treat excluded caches as
   upload savings.
   If inclusion or necessity is unverified, do not delete it as a repair.

   An archive much larger than the selected app's required inputs warrants
   investigating why unrelated project content is included. The fix may require
   refactoring the app's source/dependency layout or packaging, rather than
   deleting files that other parts of the project still need. Verify that the
   managed publishing path actually excludes the unrelated content; moving it
   to another folder within the same archived project does not establish that.
   This flow supplies no general project-controlled exclusion for needed sibling
   source. If a safe exclusion cannot be established, identify the missing
   packaging capability or evidence rather than promising that rearrangement
   works or deleting needed files.
4. When the available evidence cannot establish a safe repair, explain the
   exact gap and recommend Replit support investigation. Include the project
   link, affected app, attempt time, visible error, any matched workflow ID,
   checks performed and their measurement limits. Name the evidence needed:
   the original preparation/upload error sequence, failed archive contents
   and compressed size, or the receiving service's current limit. Do not
   invent a size limit, refresh internal credentials, replay signed URLs or
   ask the user to log into Replit-managed Expo accounts.
