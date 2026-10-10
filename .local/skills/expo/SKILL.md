---
name: expo
description: Guidelines for building and troubleshooting mobile applications using Expo, covering Expo Go previews, UI design, animations, React context patterns, native device permissions, and failed Expo Launch publishes
---

Always follow these guidelines when building a mobile application using Expo:

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

This stack uses Expo Router for file-based routing (similar to Next.js Pages Router) for the frontend. The backend uses Express with TypeScript.

- Every file in the `app/` directory becomes a route
- Use `_layout.tsx` files to define shared layouts
- Use `(group)` directories for layout groups without affecting URLs
- Use `[param].tsx` for dynamic routes

Example structure:

```text
app/
  _layout.tsx              # Root layout with providers
  index.tsx                # Home route (/)
  (tabs)/_layout.tsx       # Tab layout
  (tabs)/index.tsx         # First tab (/)
  (tabs)/settings.tsx      # Settings tab (/settings)
  profile/_layout.tsx      # Profile stack layout
  profile/index.tsx        # /profile
  profile/[id].tsx         # /profile/:id
```

For dynamic parameters: `const { id } = useLocalSearchParams()` from "expo-router"

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

## Startup and Dependency Failures

When an Expo app crashes on startup, fails to load in Expo Go, or reports a
Metro or native-module version error, run the following checks from the Expo
app's package directory before changing application code:

```bash
CI=1 pnpm exec expo install --check
pnpm dlx expo-doctor@latest
```

If Expo reports incompatible package versions, run `pnpm exec expo install --fix`.
Re-run both checks and resolve every remaining issue.

After the checks pass, restart the frontend or mobile workflow and inspect its
logs. Continue debugging only if the app still fails with aligned dependencies.

## React Native Pitfalls

Avoid these common mistakes:

- UUID Generation:
   - Do not use the 'uuid' package — it requires crypto.getRandomValues() which crashes on iOS/Android
   - Use instead: `Date.now().toString() + Math.random().toString(36).substr(2, 9)`
   - Or use expo-crypto: `import * as Crypto from 'expo-crypto'; Crypto.randomUUID()` — pin to version 15.0.x (expo-crypto v55+ crashes in Expo Go)

- Import Verification:
   - Check existing template files for correct import paths before using them
   - useBottomTabBarHeight is from '@react-navigation/bottom-tabs', not 'expo-router'
   - When unsure, read the actual files to verify exports exist

- Scrolling Containers — assess whether scrolling is needed:
   - Not everything needs to be scrollable. Fixed layouts (timers, dashboards, single-screen UIs) should use View, not ScrollView
   - FlatList: Add scrollEnabled={data.length > 0} to prevent empty bounce
   - Avoid contentInsetAdjustmentBehavior="automatic" with transparent/large-title headers — it causes over-scrolling
   - ScrollView is for content that exceeds screen height. If content fits, use View

- useEffect Anti-Patterns:
   - Do not sync props to state with useEffect (causes infinite loops)
   - BAD: `useEffect(() => setState(prop), [prop])` then `useEffect(() => onChange(state), [state])`
   - GOOD: Derive values directly from props: `const hours = Math.floor(value / 3600)`
   - Only call onChange on explicit user actions (onPress, onChangeText), not in useEffect

- Mobile Typography:
   - Maximum font size for display/hero text (clocks, timers, large numbers): 48-64pt (not 96pt)
   - Body text: 14-16pt, Headers: 20-28pt
   - Always test that text fits on a 375pt wide screen (iPhone SE)

- Empty State Design: Use simple text-based empty states (icon + descriptive text), not placeholder images.

- Expo Router Header Configuration:
   - Do not set headerShown dynamically inside screen components — it causes remounts on every re-render
   - Configure all header options in _layout.tsx where screens are registered
   - Individual screens should only set dynamic content (headerLeft/headerRight buttons), not headerShown

- Safe Area / Top Padding:
   - Do not use hardcoded top padding (24px, 40px, etc.) — it will be wrong on different devices. Use `useSafeAreaInsets()` from react-native-safe-area-context and apply `insets.top` to `paddingTop`. This handles iPhone notch, Dynamic Island, and Android status bars automatically.
   - Absolutely positioned headers: when a header is positioned absolutely over scrollable content:
     - Header uses: `top: insets.top` (positions header below notch/Dynamic Island)
     - Content below needs: `paddingTop: insets.top + headerContentHeight` (e.g. `insets.top + 70` where 70 = header's internal height). Do NOT use a fixed value like `paddingTop: 100` — it fails on devices with different insets (47px on older iPhones, 59px+ on Dynamic Island).

- Streaming API Responses (OpenAI, etc.):
   - For streaming, read the mobile-ui skill's expo-fetch.md reference
   - Use `import { fetch } from 'expo/fetch'` which supports getReader() on all platforms

- Keyboard Handling:
    - For detailed keyboard handling patterns (forms, chat, FlatList with inputs), read the mobile-ui skill's keyboard.md reference
    - Use `react-native-keyboard-controller` for all keyboard handling — it provides better control than React Native's built-in KeyboardAvoidingView and works consistently across iOS and Android
    - Do not use InputAccessoryView — it doesn't render properly in Expo Go
    - Forms with multiple inputs: Use `KeyboardAwareScrollViewCompat` with `bottomOffset` and `keyboardShouldPersistTaps="handled"`
    - Chat/messaging: Use `KeyboardAvoidingView` from `react-native-keyboard-controller` with `behavior="padding"` on both platforms, `keyboardDismissMode="interactive"` and `keyboardShouldPersistTaps="handled"` on FlatList
    - keyboardVerticalOffset: `0` for transparent/no header, `headerHeight` for opaque header
    - Use useSafeAreaInsets() for bottom padding on the input container to avoid home indicator overlap
    - Do not nest KeyboardAvoidingViews — only one should wrap your content
    - For chat UIs: Use inverted FlatList (see below) — no additional scroll logic needed. Do not try to implement auto-scroll with scrollToEnd() — it has timing bugs. Inverted FlatList handles this automatically.

- Chat Apps — state and FlatList patterns:
    - For chat app implementation patterns (stale closures, inverted FlatList, streaming), read the mobile-ui skill's expo-fetch.md reference
    - Key rules: Use inverted FlatList (not scrollToEnd), capture state before async operations, use ListHeaderComponent for typing indicator
    - FlatList Boolean Props — type coercion: props like `scrollEnabled` and `showsVerticalScrollIndicator` expect booleans. Using `someString || anotherValue` can pass a string and cause `TypeError: expected dynamic type 'boolean', but had type 'string'`. Coerce with `!!`:
      - BAD: `scrollEnabled={data || someString}`
      - GOOD: `scrollEnabled={!!data || !!someString}`

- RevenueCat compatibility:
    - RevenueCat works in Expo Go and does not require a native build. In Expo Go, the SDK automatically runs in Preview API Mode, replacing native calls with JavaScript mocks so your app loads without errors.
    - RevenueCat works on the web out of the box without any additional configuration.

- Custom ErrorBoundary component:
    - Use `reloadAppAsync` from `expo` with the ErrorBoundary component to restart the app when it crashes: `import { reloadAppAsync } from 'expo'`. Do not use `reloadAsync` from `expo-updates` for this purpose.
    - The ErrorBoundary is a minimal class component (required by React's error boundary API) with a functional ErrorFallback component for the UI. The consuming component should remain functional.
    - Do not add local state to the ErrorFallback component — it only renders if the app crashes. Use as-is unless the user requests otherwise. (Dev-mode-only state guarded by `__DEV__` is acceptable for debugging.)
    - The ErrorFallback uses `useColors()` and `useSafeAreaInsets` for theming and positioning. The ErrorBoundary wrapper uses React's class component error boundary API (`getDerivedStateFromError`, `componentDidCatch`).

- react-native-maps:
    - Pin version to exactly 1.18.0 in package.json — this is the only version compatible with Expo Go currently. Other versions cause crashes.
    - Do not add react-native-maps to the plugins array in app.json — it will crash the app.

- Over use of text:
    - Mobile apps should be designed for touch input, not text input.
    - Most buttons should not have text. They should have icons.
    - If you have to use text, use it sparingly and only for very important information.
    - Applications do not need a title like "Chatbot" or "AI Assistant". They should look like market leading apps.

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

## Insets

Web-only insets for web edge cases (always implement for every app):

- Apply on web only (Platform.OS === "web")
- Always add at least a 67px top inset to top-level header content for the status bar. Additional vertical padding will likely still be required.
- Always add a 34px bottom inset
  - If using a bottom tab bar, instead modify the tab bar height to be 84px (50px + 34px). Do not add paddingBottom to the tab bar.
- Do not add these insets on iOS/Android; native safe areas already handle them
- Before finishing any screen, verify that web platform insets handling is implemented and correct.

## Web Compatibility

Write code that does not crash in React Native Web. Account for platform-specific compatibility.

Polyfilled APIs (work on web without Platform checks):

- expo-secure-store, expo-haptics, react-native-maps, Alert, RefreshControl

Partial Web Support:

- expo-camera (no switch camera, no recordAsync)
- expo-clipboard, expo-file-system, expo-image, expo-notifications, expo-video
- react-native-reanimated: Layout animations don't work on web, native driver not supported

No Web Support (use Platform.OS checks):

- expo-battery, expo-brightness, expo-contacts, expo-device, expo-local-authentication
- expo-location (use web geolocation API), expo-media-library, expo-sensors, expo-sharing

Example workaround:

```tsx
if (Platform.OS !== 'web') {
  // Native-only code
} else {
  // Web alternative
}
```

## Payments

For payments, billing, subscriptions, or in-app purchases, read the `monetization` skill before searching integrations or calling `ProposeIntegration`.

## Testing

- Add testID to interactive elements for testing
- Use mobile screen sizes for automated testing
- Recommended dimensions: height: 720, width: 400

## Replit Environment

- User can scan QR code from Replit's URL bar menu to test on their physical device via Expo Go
- Hot module reloading (HMR) is enabled - no need to restart the dev server for code changes

### Expo Go 57 sign-in

If Expo Go says, "You need to be signed in to Expo Go and Expo CLI," this is an Expo Go 57 sign-in issue. It is not a project issue. Do not change the project. Do not run or suggest `npx expo login` or any EAS command.

Tell the user to open **Preview on your phone** on the right side of Replit.

- If the panel shows Expo Go sign-in steps, tell the user to follow them. Replit signs Expo CLI in for this flow.
- If the panel does not show sign-in steps, tell the user that Replit's managed sign-in flow is not available in their current session. Do not suggest manual Expo CLI or EAS authentication as a workaround.

If Expo Go says that the project belongs to a different account, the user must log out before switching projects.

- Tell the user to log out in Expo Go.
- If **Preview on your phone** shows sign-in steps, tell them to scan the project's QR code again and follow those steps.
- If the panel does not show sign-in steps, tell the user that Replit's managed sign-in flow is not available in their current session.

Do not tell the user to sign in to a `replit-private-*` account manually.

### How Replit signs Expo CLI in

- When the workspace loads, Replit provisions a short-lived Expo session for the managed `replit-private-<repl-id>` account and stores it in the `REPLIT_EXPO_SESSION_SECRET` secret, refreshing it before it expires. It can be missing or stale in a workspace tab that has been open a long time or was opened before the mobile artifact existed.
- The mobile artifact's `dev` script runs `create-launch login --session "$REPLIT_EXPO_SESSION_SECRET" || true` before `expo start`. That step is what signs Expo CLI in. It is guarded and non-fatal on purpose: Metro must start either way. Because it is non-fatal, a failure only shows in the workflow log; `Command "create-launch" not found` means the `create-launch` devDependency is missing (the `upgrading-expo` skill has the exact install command).
- If the user reports "signed in to Expo Go as replit-private-… but not signed in to Expo CLI", check that the `dev` script still has that step and restore it if not (the `upgrading-expo` skill has the exact line). Otherwise follow the steps above; nothing else in the project needs to change.
- Never make the login fatal, add identity checks or retries in front of Metro, or remove it. Never use the secret as `EXPO_TOKEN`. A `create-launch` "unexpected response" error means the session is stale: the user refreshes the workspace page (which re-provisions the secret) and then restarts the workflow.
- Correct any project memory that contradicts this.
- If Expo Go reports an SDK mismatch or the user asks to move to SDK 57, use the `upgrading-expo` skill rather than bumping packages by hand: the skill adds the sign-in step, and a by-hand bump leaves it out. On an app that is already on SDK 57, repair the step directly as described above; no upgrade is needed.

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
- NEVER run the Expo development server with `npx expo start` or a bare `npx expo` command. Use the `restart_workflow` tool instead — starting Expo directly will miss environment variables (like `PORT`) injected into the workflow. Expo diagnostics and dependency-alignment commands explicitly listed above are allowed.
- NEVER create app.config.ts or app.config.js. The project MUST use a static app.json for Expo configuration. Dynamic config files (app.config.ts/js) break the Expo Launch build process. If you need to modify Expo settings, edit app.json directly. If an existing app.config.ts or app.config.js is present in the project, migrate its settings to app.json and delete the dynamic config file.
- NEVER run or suggest running EAS CLI commands (`npx eas build`, `npx eas submit`, `npx eas update`, `npx eas init`, `eas build`, etc.). iOS publishing is handled via Replit's Expo Launch.

## References

Before writing code, identify whether any reference below applies to the task. If it does, read it first.

- `.local/skills/expo/references/first-build.md` - Use this reference when first building an Expo app (from 0 to 1)
- `.local/skills/expo/references/react-context.md` - Use this reference when creating or modifying shared state with React context, provider composition, or context-based hooks.
- `.local/skills/expo/references/design-and-aesthetics.md` - Use this reference when designing or restyling UI, selecting iconography, or implementing animations and visual polish. Read "Cross-Artifact Design Consistency" when this Expo artifact is part of a multi-artifact project with a design system or sibling web app.
- `.local/skills/expo/references/device-features-and-permissions.md` - Use this reference when implementing camera, location, notifications, contacts, file uploads, or any permission request/denial flow.
- `.local/skills/expo/references/publish-failure-debugging.md` - Use this reference when an App Store publish fails or the user asks why Expo Launch failed.
- mobile-ui skill's `.local/skills/mobile-ui/references/keyboard.md` - Use this reference when implementing any keyboard handling — forms with multiple inputs, chat/messaging UIs, FlatList with inputs, or keyboard utilities (dismiss, detect visibility).
- mobile-ui skill's `.local/skills/mobile-ui/references/sheets.md` - Use this reference when implementing modals, sheets, formSheet presentations, auth flows (login/register), wizards, or overlay UI.
- mobile-ui skill's `.local/skills/mobile-ui/references/tabs.md` - Use this reference when implementing tab bars — covers NativeTabs with liquid glass support (SDK 54+) and classic Tabs fallback with detailed code examples.
