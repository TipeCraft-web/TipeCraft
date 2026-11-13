---
name: expo
description: Build, maintain and troubleshoot Expo apps, including current-SDK standardization, Expo Go previews, native configuration and failed Expo Launch publishes
---

Always follow these guidelines when building or maintaining an Expo app:

## App standard

For SDK 58+, check affected package/lockfile, config, native/dev-client files and
scripts against `references/app-standard.md`. Read `references/standardize-app.md`
only for nonconforming apps. Maintenance keeps the installed SDK and unrelated packages.
After edits, recheck those inputs and repeat affected dependency,
typecheck, iOS/Android JavaScript export and Go checks. Record versions, platforms,
results and missing device checks in existing context, not a permanent validation flag.
Dependency/runtime changes need a clean frozen install, tests and iOS export
in isolation matching Launch's Node/pnpm.

On failure, restore the verified baseline, including manager declaration, lockfile and
scripts, undoing only Agent-owned changes and preserving concurrent user work.
Reinstall with its manager, restart the affected workflow and repeat baseline
checks. Recovery is not standardization or permission for native development.

## Architecture

- iOS 26 exists. Use NativeTabs from expo-router for native tab bars with liquid glass support. Use `isLiquidGlassAvailable()` from expo-glass-effect to check availability and fall back to classic Tabs with BlurView for older iOS/Android.
- Follow modern React Native patterns and best-practices.
- Put as much of the app in the frontend as possible. The backend should only be responsible for data persistence and making API calls.
- Use React context for state that is shared across multiple components.
- Use React Query (@tanstack/react-query) for server state fetching.
- Use useState for very local state.
- Minimize the number of files. Collapse similar components into a single file.
- If the app is complex and requires functionality that can't be done in a single request, it is okay to stub out the backend and implement the frontend first.
- ALWAYS use native device capabilities (camera, location, contacts, etc.) when the app requires them. NEVER use fake/mock data when real device features are available and appropriate.
- Client-Server: the Expo client talks to an Express + TypeScript server via a RESTful API. The server handles data storage, API requests, auth, and any other server-specific logic.

## Design System

Immediately before writing UI, inspect the current Artifacts state or call `listArtifacts()` filtered to `kind: "design-system"`. Do not rely on whether a design system existed at the start of the turn; one may have been created earlier in this turn.

- If the user or creation flow passed a selected design system, use that exact artifact. Never replace an explicit selection with an inferred one.
- If no design system was passed but design-system artifacts exist, use one by default rather than falling back to copied sibling tokens. Use the only system automatically. When several exist, prefer one already consumed by the source/sibling artifact, then one the request implies; ask only if the choice remains genuinely ambiguous.
- After selecting, read that artifact's `docs/AGENTS.md` and `docs/consuming-expo.md`. If the Expo artifact contains scaffolded or existing local theme, hooks, fonts, or product-agnostic components, also read `docs/migrating-expo.md` and complete that migration before authoring UI.
- If none exists, use the Expo scaffold's local theme files and, for multi-artifact projects, the sibling-artifact fallback in `design-and-aesthetics.md`.

## Routing

Before changing Expo configuration, startup commands, services, routes, or build output, read
`references/preview-configuration.md`.

Expo Router provides frontend file-based routing (like Next.js Pages Router); the backend uses Express with TypeScript.

- Each `app/` file becomes a route
- Shared layouts use `_layout.tsx`
- Group layouts in `(group)` directories without affecting URLs
- Dynamic routes use `[param].tsx`

Example:

```text
app/
  _layout.tsx # Root layout with providers
  index.tsx # Home route (/)
  (tabs)/_layout.tsx # Tab layout
  (tabs)/index.tsx # First tab (/)
  (tabs)/settings.tsx # Settings tab (/settings)
  profile/_layout.tsx # Profile stack layout
  profile/index.tsx # /profile
  profile/[id].tsx # /profile/:id
```

Dynamic parameters: `const { id } = useLocalSearchParams()` from "expo-router"

## State Management

- Use React Query for server state (always use object API)
- Use useState for very local state
- Avoid props drilling - use React context for shared state
- Don't wrap <RootLayoutNav/> in a context hook - wrap at the root layout level
- React Query provider should be the top level provider
- Use AsyncStorage inside context providers for persistent state

## TypeScript Guidance

- TypeScript first: Proper typing with interfaces and type safety
- Explicit Type Annotations for useState: Always use `useState<Type[]>([])` not `useState([])`
- Type Verification: Before using any property or method, verify it exists in the type definition
- Null/Undefined Handling: Use optional chaining (`?.`) and nullish coalescing (`??`)
- Complete Object Creation: Include ALL required properties when creating objects
- Style Properties: Use literal values for variables used in styles (e.g., `const fontWeight = "bold" as const`)

## Imports

You can import using `@/` to avoid relative paths (e.g., `import { Button } from '@/components/Button'`)

## Styling

Use react-native's `StyleSheet` for styling and never hardcode hex values in components. When the current Artifacts state contains a selected design system, import its semantic theme and color-scheme hook directly from the concrete paths in `docs/consuming-expo.md`; use `docs/migrating-expo.md` to remove local copies. When no design system exists, use the Expo scaffold's local `constants/colors.ts` and `hooks/useColors.ts`.

If this Expo artifact is part of a multi-artifact project, read `design-and-aesthetics.md` before writing component code — it covers how to consume a design system or, when none exists, sync colors, fonts, and radius from a sibling artifact.

## Networking
- Use the generated React Query hooks from `@workspace/api-client-react` for server data.
  - For any API change, update `lib/api-spec/openapi.yaml` first, then run `pnpm --filter @workspace/api-spec run codegen`, then use the generated hooks.
  - Do not write app-local React Query hooks, manual `useQuery` wrappers, or custom fetch layers for endpoints that already exist in `@workspace/api-client-react`.
  - Use the shared QueryClient/fetch setup that ships with the monorepo rather than creating app-local networking infrastructure.
  - The generated hooks return data typed as `T` directly.
  - For mutations or requests that do not yet exist in the generated client, update the OpenAPI spec and regenerate rather than bypassing the shared API client package.
  - Do not hardcode domain URLs or hostnames. The deployment domain is injected at build time and varies between development, preview, and production. Use `process.env.EXPO_PUBLIC_DOMAIN`. Routes like `/api` or `/{service}` are routed to the appropriate artifact/service as needed.
  - In `app/_layout.tsx`, call ``setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`)`` from `@workspace/api-client-react` at the top level (outside any component). Expo bundles run outside the web proxy and need absolute URLs to reach the API server.
  - For authenticated API calls, use `setAuthTokenGetter` from `@workspace/api-client-react` to supply a bearer token getter. The getter is called before every request and should return the token string or `null`.

## App Icon

Generate a custom app icon for the app. Read the mobile-ui skill's app-icon.md reference for guidelines.

## Workflow
- The Expo dev server is accessed via $REPLIT_EXPO_DEV_DOMAIN, not through the shared proxy at localhost:80.
- Ports are assigned dynamically. Do not hardcode port numbers.
- Check the configured workflows list for exact workflow names.
- Use the `restart_workflow` tool to restart workflows — not shell commands.
- The Expo dev server has Hot Module Reloading. Only restart the mobile workflow when you change dependencies or hit a Metro error, not for normal code changes. Restarting unnecessarily wastes time.
- Backend workflows only require restart when backend changes were made since it can be a time-consuming operation.
- After presenting the artifact, call `SuggestUserAction({ action: "deploy", message: "The app is ready to publish." })`.

### Turning an existing Expo app into a web app

For Expo-to-web requests, offer a separate web app with the same functionality,
keeping the Expo app and all previews. Use plain language, not "artifact";
get agreement before creation.
Before implementing, read `references/web-compatibility.md`.
Fixing Expo browser preview or preserving previously requested web support does
not require a new artifact; follow the reference's legacy guidance.

## Startup and Dependency Failures

For SDK 58+, run `CI=1 pnpm exec expo install --check` and
`pnpm dlx expo-doctor@latest` from the app package before changing application
code. Fix demonstrated incompatibilities with `pnpm exec expo install --fix`,
then rerun both checks.
Otherwise, when an Expo app crashes on startup, fails to load in Expo Go, or
reports a Metro or native-module version error, run the following checks from
the Expo app's package directory before changing application code:

```bash
CI=1 pnpm exec expo install --check
pnpm dlx expo-doctor@latest
```

If Expo reports incompatible package versions, run `pnpm exec expo install --fix`.
Re-run both checks and resolve every remaining issue.

After the checks pass, restart the frontend or mobile workflow and inspect its
logs. Continue debugging only if the app still fails with aligned dependencies.

## React Native Pitfalls

Before writing or changing screens and components, read `.local/skills/expo/references/react-native-pitfalls.md` (IDs, imports, scrolling, useEffect, typography, headers, safe-area padding, ErrorBoundary, RevenueCat, touch-first UI). Before building inputs, forms, chat, or streaming responses, read `.local/skills/expo/references/keyboard-and-chat.md`.

## Gestures

Use PanResponder from 'react-native' for gesture handling.

## Safe Area View

When to use SafeAreaView:

1. Built-in tabs or header: Don't add SafeAreaView - they handle insets automatically
2. Custom header: Add SafeAreaView to the header component
3. Removed header: Add SafeAreaView inside a View with background color (not just white space)
4. Pages inside stacks: Don't add SafeAreaView if parent _layout.tsx has header enabled

Games and absolute positioning: account for safe area insets in positioning calculations using `useSafeAreaInsets()`. Apply insets in game physics. Avoid `SafeAreaView` in game screens — factor insets into the game loop instead.

## Font Loading and SplashScreen

The scaffold ships with `@expo-google-fonts/inter` pre-installed and already loaded in `_layout.tsx` with the correct `useFonts` + `SplashScreen` font-gating pattern. Available weights: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`.

When the current Artifacts state contains a selected design system, follow `docs/consuming-expo.md` and `docs/migrating-expo.md` to replace local font loading with the package hook while preserving SplashScreen gating. When no design system exists and the user wants a different font, swap the local import and `useFonts` call while keeping the same font-gating pattern.

Rules:

- Do NOT remove the font-gating pattern from `_layout.tsx`
- Handle `fontError` alongside `fontsLoaded` — if font loading fails, the app should still render rather than showing a white screen forever
- Tie `SplashScreen.hideAsync()` to `[fontsLoaded, fontError]` — do not call it unconditionally in `useEffect([], [])`
- The `if (!fontsLoaded && !fontError) return null` must come after the `useEffect` hook, not before it (hooks cannot be called conditionally)

## Library Compatibility

- ONLY use libraries from the Expo Go compatible list
- Do not install additional native libraries unless they're JS only
- Pre-installed: expo-router, @expo/vector-icons, @tanstack/react-query, react-native-reanimated
- Error boundary: Custom ErrorBoundary component (components/ErrorBoundary.tsx)
- Before adding `uuid`, `expo-crypto`, or other native packages, read `.local/skills/expo/references/react-native-pitfalls.md`; `uuid` crashes on device, and native packages must be installed with `expo install` to match the SDK.

## Insets

Web-only insets for web edge cases (always implement for every app):

- Apply on web only (Platform.OS === "web")
- Always add at least a 67px top inset to top-level header content for the status bar. Additional vertical padding will likely still be required.
- Always add a 34px bottom inset
  - If using a bottom tab bar, instead modify the tab bar height to be 84px (50px + 34px). Do not add paddingBottom to the tab bar.
- Do not add these insets on iOS/Android; native safe areas already handle them
- Before finishing any screen, verify that web platform insets handling is implemented and correct.

## Web Compatibility (Legacy Behavior)

Write code that does not crash in React Native Web. Before implementing
platform-specific behavior, read `references/web-compatibility.md` for the
required polyfills, partial support, and native-only API checks.

## Payments

For payments, billing, subscriptions, or in-app purchases, read the `monetization` skill before searching integrations or calling `ProposeIntegration`.

## Testing

- Add testID to interactive elements for testing
- Use mobile screen sizes for automated testing
- Recommended dimensions: height: 720, width: 400

## Replit Environment

- User can scan QR code from Replit's URL bar menu to test on their physical device via Expo Go
- Hot module reloading (HMR) is enabled - no need to restart the dev server for code changes

### Expo Go sign-in and SDK mismatches

- If Expo Go asks the user to sign in to Expo Go and Expo CLI, says the project belongs to a different account, or the user reports being signed in to Expo Go as `replit-private-…` but not to Expo CLI, read `.local/skills/expo/references/expo-go-sign-in.md` before replying. Do not run or suggest `npx expo login` or any EAS command, and do not tell the user to sign in to a `replit-private-*` account manually. The sign-in and different-account messages are not project issues, so do not change the project for them; the only project repair is restoring a missing `create-launch login` step in the mobile `dev` script, as the reference describes.
- If Expo Go reports an SDK mismatch or the user asks to upgrade Expo (including an explicit SDK 58 request), read `.local/skills/expo/references/upgrading-expo.md` rather than bumping packages by hand. It selects the enabled target workflow and preserves the sign-in step. If the app already uses the requested SDK, repair the `create-launch login` step directly as described in `expo-go-sign-in.md`; no upgrade is needed.

## Publishing

Replit has a built-in publishing flow for Expo apps called **Expo Launch**. Expo Launch handles the production build and **App Store (iOS) submission only** — the user triggers it by clicking the Publish button. More information can be found in the Replit docs which you can search. Only call `SuggestUserAction({ action: "deploy", message: "The app is ready to publish." })` after the app is fully built and verified (see `## Workflow` for when to call it), and only when iOS publishing is relevant. Do not call it mid-build or in response to a planning question.

- If the user asks what **Expo Launch** is: explain it is Replit's built-in flow for building and submitting the app to the App Store (iOS). More info is in the Replit docs.
- If the user asks about **Google Play (Android)** publishing: let them know it is **not currently supported** on Replit. Do not call `SuggestUserAction({ action: "deploy", message: "..." })` for Android-only requests.
- Do not attempt to help with EAS CLI commands or manual App Store submission — Replit's Expo Launch handles App Store publishing.
- If an App Store publish fails, read `.local/skills/expo/references/publish-failure-debugging.md` and use `getExpoLaunchLogs()` instead of asking the user to copy build errors from Expo.

## Forbidden Changes
- NEVER change bundle identifiers after initial setup unless user explicitly requests it.
- NEVER downgrade the version of React Native or Expo that is declared in package.json. The one exception is `expo install --fix`, which can move React Native down to the version that the installed Expo SDK supports. Keep that alignment.
- NEVER remove, make fatal, or gate Metro on the `create-launch login` step in the mobile `dev` script, and NEVER use `REPLIT_EXPO_SESSION_SECRET` as `EXPO_TOKEN`.
- NEVER run the Expo development server with `npx expo start` or a bare `npx expo` command. Use `restart_workflow` to retain injected environment variables like `PORT`. Diagnostics and dependency alignment are allowed, not prebuild or native builds.
- NEVER create dynamic app.config.ts/js; Expo Launch requires static app.json. Migrate existing dynamic config case by case, removing it only after verifying equivalent inputs and behavior. JavaScript config plugins are not dynamic app config.
- NEVER run or suggest running EAS CLI commands (`npx eas build`, `npx eas submit`, `npx eas update`, `npx eas init`, `eas build`, etc.). iOS publishing is handled via Replit's Expo Launch.

## References

Before writing code, identify whether any reference below applies to the task. If it does, read it first.

- `.local/skills/expo/references/first-build.md` - Use this reference when first building an Expo app (from 0 to 1)
- `.local/skills/expo/references/react-context.md` - Use this reference when creating or modifying shared state with React context, provider composition, or context-based hooks.
- `.local/skills/expo/references/design-and-aesthetics.md` - Use this reference when designing or restyling UI, selecting iconography, or implementing animations and visual polish. Read "Cross-Artifact Design Consistency" when this Expo artifact is part of a multi-artifact project with a design system or sibling web app.
- `.local/skills/expo/references/device-features-and-permissions.md` - Use this reference when implementing camera, location, notifications, contacts, file uploads, or any permission request/denial flow.
- `.local/skills/expo/references/react-native-pitfalls.md` - Use this reference when writing or changing screens, components, IDs, headers, safe-area padding, error boundaries, RevenueCat code, or adding `uuid`, `expo-crypto`, or other native packages.
- `.local/skills/expo/references/keyboard-and-chat.md` - Use this reference when implementing text inputs, forms, keyboard handling, chat or messaging screens, or streaming API responses.
- `.local/skills/expo/references/expo-go-sign-in.md` - Use this reference when Expo Go reports a sign-in or different-account problem, or when diagnosing or repairing the mobile `dev` script's `create-launch login` step.
- `.local/skills/expo/references/publish-failure-debugging.md` - Use this reference when an App Store publish fails or the user asks why Expo Launch failed.
- mobile-ui skill's `.local/skills/mobile-ui/references/keyboard.md` - Use this reference when implementing any keyboard handling — forms with multiple inputs, chat/messaging UIs, FlatList with inputs, or keyboard utilities (dismiss, detect visibility).
- mobile-ui skill's `.local/skills/mobile-ui/references/sheets.md` - Use this reference when implementing modals, sheets, formSheet presentations, auth flows (login/register), wizards, or overlay UI.
- mobile-ui skill's `.local/skills/mobile-ui/references/tabs.md` - Use this reference when implementing tab bars — covers NativeTabs with liquid glass support (SDK 54+) and classic Tabs fallback with detailed code examples.
