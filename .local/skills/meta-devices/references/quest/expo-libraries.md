# Horizon-Forked Libraries and Cross-Platform Guards

Most Expo/React Native libraries work on Quest unchanged. A few need Quest-specific
forks, and some device features simply differ. This covers the forked libraries,
the `isHorizonDevice()` guard, and where to find the unsupported lists.

## Contents

- [isHorizonDevice()](#ishorizondevice)
- [expo-horizon-location](#expo-horizon-location)
- [expo-horizon-notifications](#expo-horizon-notifications)
- [expo-iap (in-app purchases)](#expo-iap-in-app-purchases)
- [Unsupported dependencies and permissions](#unsupported-dependencies-and-permissions)

Before any `npx expo prebuild --clean`, inspect `android/`, `ios/`, and `git status`.
Use the clean command only when the native directories are absent or fully
generated and all work is committed. If either directory contains hand-maintained
native code, run `npx expo prebuild` without `--clean` and review its native diff.
Alternatively, follow the project's existing native workflow.

## isHorizonDevice()

For cross-platform code (one codebase for Quest and mobile), guard
platform-specific logic with `isHorizonDevice()` from `expo-horizon-core` so it
runs only where supported:

```javascript
import { isHorizonDevice } from 'expo-horizon-core';

if (isHorizonDevice()) {
  // Quest / Horizon OS only
} else {
  // phone / tablet fallback
}
```

Some libraries (e.g. `expo-sms`, `expo-sensors`) also expose feature-specific
availability checks — prefer those where they exist.

## expo-horizon-location

Quest devices have **no GPS**, so accuracy and update frequency are limited, and
geocoding, device heading, and background location are **not** supported. Some
unsupported features throw on Quest — guard with `isHorizonDevice()` and provide a
fallback.

```bash
npx expo install expo-horizon-location
```

1. Remove the old `expo-location` package.
2. Replace the `expo-location` config plugin with `expo-horizon-location` in
   `app.json`/`app.config.js`.
3. Update imports:

   ```javascript
   // import * as Location from 'expo-location';
   import * as Location from 'expo-horizon-location';
   ```
4. Run `npx expo prebuild --clean` to apply the native plugin change.
5. Run the app with the Quest flavor (`yarn quest`).

## expo-horizon-notifications

```bash
npx expo install expo-horizon-notifications
npm uninstall expo-notifications        # or: yarn remove expo-notifications
```

1. Replace `expo-notifications` with `expo-horizon-notifications` in your app
   config.
2. Update imports:

   ```javascript
   import * as Notifications from 'expo-horizon-notifications';
   ```
3. Run `npx expo prebuild --clean` to apply the native plugin change.
4. Run on Quest with `questDebug`/`questRelease`.

On device, notifications appear just above your app. See the Horizon user
notifications docs for behavior details.

## expo-iap (in-app purchases)

Quest does **not** use Google Play Billing — it has its own **Meta Horizon Billing
SDK**. Use `expo-iap`, which offers a single cross-platform IAP API with Horizon
support.

```bash
npx expo install expo-iap
```

Add this plugin entry to `plugins` in `app.json`/`app.config.js` alongside
`expo-horizon-core`:

```json
[
  "expo-iap",
  {
    "modules": { "horizon": true },
    "android": { "horizonAppId": "YOUR_HORIZON_APP_ID" }
  }
]
```

`horizonAppId` is required for billing and must be your real Meta Horizon App ID.
Run `npx expo prebuild --clean` after you add the plugin, then rebuild the Quest
development client.

## Unsupported dependencies and permissions

A small number of dependencies and permissions aren't available on Horizon OS.
`expo-horizon-core` helps remove/skip them during prebuild, but check the
authoritative lists when a library misbehaves:

- Unsupported dependencies —
  https://developers.meta.com/horizon/documentation/android-apps/unsupported-dependencies
- Unsupported permissions —
  https://developers.meta.com/horizon/documentation/android-apps/unsupported-permissions

For anything requiring custom native code, you already need a development build
(see [the Horizon Core setup](expo-horizon-core.md)). Add the module
through the project's existing native workflow, then rebuild the dev client. Do
not run `npx expo prebuild --clean` after adding hand-maintained native code.
