# Expo Launch Publish Failures

Use captured build logs to diagnose failed App Store publishes.

## Scope

Read this reference when an iOS App Store publish through Expo Launch fails or the user asks why it failed. For web deployment failures, use the deployment skill instead.

Do not run or suggest EAS CLI commands. Replit owns the build and submission flow; Agent may read diagnostics and fix project files, but the user retries from the Publish pane.

## `getExpoLaunchLogs()`

Call `getExpoLaunchLogs()` with no arguments. It returns the latest Expo Launch session for the current Repl:

```javascript
const result = await getExpoLaunchLogs();
if (!result.success) {
  console.log(result.error);
  return;
}

if (result.message) {
  console.log(result.message);
}

const launch = result.launches.find(
  ({ platform, status }) =>
    platform === "ios" &&
    (status === "FAILURE" || status === "ACTION_REQUIRED"),
);
if (!launch) {
  console.log("No failed iOS workflow found.");
  return;
}

if (launch.status === "ACTION_REQUIRED") {
  console.log(launch.status, launch.dashboardUrl);
  return;
}

const logs = launch.logs.join("\n");
console.log({
  workflowRunId: launch.workflowRunId,
  dashboardUrl: launch.dashboardUrl,
  logCharacters: logs.length,
});
console.log(logs.slice(-7000));
```

A successful result has this shape:

- `success`: `true`
- `launches`: workflow runs from the latest session
- `message`: present when this Repl has no Expo Launch session

A failed request returns `{ success: false, error }`. Report that temporary service error and stop; do not read `launches` or invent a publish diagnosis.

Each launch contains:

- `workflowRunId`: Expo workflow UUID
- `platform`: `ios` for App Store or `web` for EAS Hosting
- `status`: `NEW`, `IN_PROGRESS`, `ACTION_REQUIRED`, `SUCCESS`, `FAILURE`, or `CANCELED`
- `dashboardUrl`: Expo's workflow page
- `logs`: bounded failure-relevant product log lines retained for 30 days after a failed iOS workflow

## Workflow

1. Call `getExpoLaunchLogs()` and select the failed `ios` workflow.
2. Read the final log window and identify the first actionable build error, not the cascade that follows it.
3. Fix the project files responsible for that error.
4. Ask the user to retry from Replit's Publish pane.

Do not print the complete log stream at once because long output is truncated. If the actionable error is not in the final 7,000 characters, rerun the call with earlier windows such as `logs.slice(-14000, -7000)`.

If a failed workflow has no retained logs, give the user its `dashboardUrl`. Do not invent a diagnosis or run EAS locally.

`ACTION_REQUIRED` is not a project build failure. Direct the user to the Publish pane or `dashboardUrl` to complete the requested Expo account or credential action.

When the retrieved logs identify one of these project-side failures:

- `app.config.ts` or `app.config.js`. Move the settings into static `app.json` and delete the dynamic config.
- Lockfiles containing `package-firewall.replit.internal` or legacy `package-firewall.replit.local` package URLs. Reinstall dependencies so the lockfile uses the public npm registry.
- Oversized uploads. Remove unneeded files from the app bundle; keep runtime assets available at paths the app can load.
