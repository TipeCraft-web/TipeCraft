---
name: upgrading-expo
description: Propose a staged Expo SDK upgrade task when a user asks to update Expo
---

## When The User Asks To Update Expo

Propose one project task instead of upgrading the app in the current turn. Write the task plan under `.local/tasks/`, then call
`bulkCreateProjectTasks` with the `mobile` artifact kind. The task stays proposed
for the user to review and accept.

The task agent receives the plan, not this skill. Inline the direct SDK 54 to 57
workflow, Expo Go-only restrictions, and every validation step below in the task
plan. Do not make the accepted task depend on reading this skill.

This workflow is for existing Expo apps. Use the separate Expo scaffold workflow
when the user is creating a new Expo app.

For a `PNPM_WORKSPACE` artifact, first identify its `artifacts/<slug>` directory.
Use that artifact's `package.json` for the Expo SDK check and run every Expo CLI
and package-local `pnpm` command below from that directory. Run workspace-wide
commands such as `pnpm install` from the workspace root.

Before proposing a task, inspect `package.json` and confirm that the app uses
Expo SDK 54. This workflow supports only SDK 54 to SDK 57. If the app uses a
different SDK, stop and explain that its upgrade needs a version-specific plan.

The task plan must require the direct SDK 54 to SDK 57 workflow and the checks
in this skill.

## References

- ./references/native-tabs.md -- SDK 55 + Expo Router: NativeTabs API changes
- ./references/react-navigation.md -- SDK 55 + React Navigation: do not use scrollEdgeEffects
- https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-upgrade -- upstream upgrade checklist

## Before Upgrading

1. Read `package.json`, `app.json` or `app.config.*`, and the lockfile. Use
   the existing package manager; do not switch package managers during the
   upgrade.
2. Check whether `ios/` or `android/` exists. Do not delete, regenerate, or
   modify native projects unless the user explicitly asks for native builds.
3. Check which navigation systems are present:
   - **Expo Router**: `expo-router` dependency or an `app/` route directory.
   - **React Navigation**: `@react-navigation/*` dependencies or imports.
4. Stop only the Expo workflow before changing dependencies. Do not stop
   unrelated services.
5. Search the project for `sdkVersion`, `expo-av`, `expo-permissions`, old
   React context providers, `forwardRef`, `patches/`, `expo.install.exclude`,
   and default-only Babel or Metro configuration. Review each match before
   removing or changing it.

## Expo Go Only

This project runs in stock Expo Go. Do not add `expo-dev-client`, create an EAS
development build, run `expo prebuild`, or run `expo run:ios` / `expo run:android`.

- Do not add a native module unless Expo Go bundles it for the target SDK.
- Do not add config that depends on custom permissions, entitlements, package
  identifiers, or a project-specific native binary.
- If the project contains native projects or custom native dependencies, stop
  and explain that this Expo Go-only environment cannot validate that upgrade.
- Expo Go 57 can load SDK 57 projects only. The managed sign-in requirement is
  specific to the physical iOS Expo Go 57 client; Android and web previews do
  not use it. A successful bundle or web preview does not prove that the iOS
  client accepts the app; resolve physical-iOS verification in the same-task
  acceptance flow below.

## Upgrade Workflow

Upgrade directly to the requested target SDK. The supported path for this
workflow is SDK 54 to SDK 57.

First bump the Expo package with the project's package manager. Then use the
no-argument Expo CLI fix to align React, React Native, Expo Router, and Expo
modules with the installed SDK. Do not hand-maintain that version matrix.

```bash
# pnpm projects
pnpm add expo@^<target-sdk>.0.0
pnpm exec expo install --fix

# npm projects
npm install expo@^<target-sdk>.0.0
npx expo install --fix
```

Then run the matching checks before proceeding:

```bash
# pnpm projects
CI=1 pnpm exec expo install --check
pnpm dlx expo-doctor@latest

# npm projects
CI=1 npx expo install --check
npx expo-doctor@latest
```

Clear only Metro's local `.expo` state if the bundler stays stale after a
successful dependency install. Preserve user source and use the project's
existing checkpoints if recovery is needed.

### SDK 54 to 57

1. Bump `expo` to `^57.0.0`, then run `expo install --fix` with no package
   arguments.
2. Remove `newArchEnabled` from app config. New Architecture is mandatory.
3. Sign the dev server into the repl's Expo account for physical iOS Expo Go
   preview. The iOS Expo Go 57 client loads the app only from a signed-in dev
   server; Android and web previews do not require this login. The workspace
   supplies the session as `REPLIT_EXPO_SESSION_SECRET`.
   - Install `create-launch` as an exact devDependency with the project's
     package manager so both the manifest and lockfile are updated:

     ```bash
     # pnpm projects
     pnpm add --save-dev --save-exact create-launch@0.3.6

     # npm projects
     npm install --save-dev --save-exact create-launch@0.3.6
     ```

     Run the command from the app package. In a pnpm workspace, target that
     package rather than adding the dependency to the workspace root.
   - Preserve the app's existing `dev` script, including every environment
     variable, flag, and project-specific command. Prepend this authentication
     setup to the existing Expo start command:

     ```sh
     sh -c 'if [ -n "$REPLIT_EXPO_SESSION_SECRET" ]; then pnpm exec create-launch login --session "$REPLIT_EXPO_SESSION_SECRET" || true; fi' && <existing Expo start command>
     ```

     Replace `<existing Expo start command>` with the exact current command;
     do not copy the scaffold's start command over it. In npm projects, use
     `npx` instead of `pnpm exec` for `create-launch`. The guard must not block
     startup when `REPLIT_EXPO_SESSION_SECRET` is unset or login fails.
4. Apply these navigation compatibility migrations:
   - For Expo Router NativeTabs, import only `NativeTabs` and replace `Icon`,
     `Label`, `Badge`, and `VectorIcon` with the matching
     `NativeTabs.Trigger.*` static components.
   - For Expo Router projects with direct `@react-navigation/*` imports, run
     `npx expo-codemod sdk-56-expo-router-react-navigation-replace <source>`
     over the app source and review its changes before retaining intentional
     direct React Navigation usage. Update retained packages through Expo CLI
     and never set `scrollEdgeEffects`. When `headerBlurEffect` triggers the
     related react-native-screens warning, use `LogBox.ignoreLogs` instead of
     setting `scrollEdgeEffects` explicitly.
   - When Reanimated reports that a layout animation can overwrite a
     `transform`, apply the layout animation to an outer animated wrapper and
     keep the transform on the nested animated component. Replace deprecated
     `shadow*` style props with `boxShadow` where the web runtime reports the
     warning.
5. Apply these direct-migration compatibility checks:
   - Verify `expo/fetch` usage against the SDK 57 global fetch behavior.
   - Review `expo-file-system` copy and move call sites for changed source and
     destination behavior.
   - Migrate `expo-av` usage to `expo-audio` or `expo-video` before removing
     it.
   - Add `@expo/vector-icons` explicitly when the app imports it.
6. Run the checks above. SDK 57 targets React Native 0.86 and React 19.2; Expo
   CLI selects the compatible package versions. Test Android edge-to-edge
   layout, keyboard handling, animations, and navigation if the app uses them.
7. If `react-native-reanimated` is installed, verify that
   `react-native-worklets` is present. Do not enable Worklets bundle mode unless
   the project already has its required Babel, Metro, and patch setup.

## Post-Upgrade Checklist

1. Re-run `expo install --check` and Expo Doctor. Resolve every dependency
   mismatch instead of adding it to `expo.install.exclude`.
2. Remove `sdkVersion` from app config so Expo manages it. Remove a Babel or
   Metro config only when it contains Expo defaults and no project-specific
   behavior. Re-check any patches or exclusions after the upgrade.
3. Run the app's typecheck plus native exports for both platforms:

   ```bash
   pnpm run typecheck
   pnpm exec expo export --platform ios
   pnpm exec expo export --platform android
   ```

   Use the equivalent existing scripts for non-pnpm projects.
4. Restart the artifact's managed Expo workflow, for example
   `artifacts/<slug>: expo`, and verify the manifest reports the target SDK.
5. After the managed workflow and native exports pass, call `AskQuestion` and
   ask the user to exercise the app in stock Expo Go 57 on either a physical
   device or a simulator. Tell them to check navigation, tabs, headers,
   keyboard behavior, and every native feature used by the app. Collect the
   chosen target, its platform, and the outcome separately: the app works, the
   app has an issue, or skip Expo Go testing. Do not use EAS Go, a development
   build, or a custom native build.
   - If it works, record the exact target and platform combination as passed.
     Do not infer coverage for any untested target or platform; record each as
     not performed. Then complete the current task.
   - If the user reports an issue, collect the failure details and continue
     fixing it in the current task.
   - If the user skips or cannot test, record Expo Go validation as not
     performed and complete the current task after the other checks pass.

Expo Go acceptance is a user confirmation, not a separate unit of
implementation work. Never call `proposeFollowUpTasks`, `bulkCreateProjectTasks`,
or `createProjectTask` solely to perform this device or simulator check. Only
create follow-up work when the user reports a concrete defect and explicitly
chooses to defer that fix.
