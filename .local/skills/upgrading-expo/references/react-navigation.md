# React Navigation Migration (SDK 55)

React Navigation upgrades are generally straightforward with SDK 55. Update to the latest `@react-navigation/*` packages.

## Version Updates

```bash
npm view @react-navigation/native@latest version
npm view @react-navigation/native-stack@latest version
npm view @react-navigation/bottom-tabs@latest version
```

## Critical: Do NOT Use scrollEdgeEffects

**SDK 55 + Expo Go + iOS**: The `scrollEdgeEffects` option (from react-native-screens) causes silent crashes on app launch. Do not use it.

```tsx
// DO NOT use scrollEdgeEffects - it crashes Expo Go on iOS
scrollEdgeEffects: { ... }  // crashes
```

### Suppress the Warning

When using `headerBlurEffect`, react-native-screens internally sets `scrollEdgeEffects` to `'automatic'`, triggering a warning. Suppress it with LogBox in your app entry point:

```tsx
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "[RNScreens] Using both `blurEffect` and `scrollEdgeEffects`",
]);
```

Do NOT try to "fix" this warning by setting `scrollEdgeEffects` explicitly - that causes crashes.

### Working Header Blur

Use `headerBlurEffect` for blur effects on iOS headers:

```tsx
const screenOptions: NativeStackNavigationOptions = {
  headerTransparent: true,
  headerBlurEffect: isDark ? "dark" : "light",
  headerTintColor: theme.text,
  headerStyle: {
    backgroundColor: Platform.select({
      ios: undefined,
      android: theme.backgroundRoot,
      web: theme.backgroundRoot,
    }),
  },
};
```
