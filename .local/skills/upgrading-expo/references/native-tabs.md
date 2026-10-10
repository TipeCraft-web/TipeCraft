# Native Tabs Migration (SDK 55)

In SDK 55, `Label`, `Icon`, `Badge`, and `VectorIcon` are now static properties on `NativeTabs.Trigger`.

## Import Changes

```tsx
// SDK 54
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";

// SDK 55
import { NativeTabs } from "expo-router/unstable-native-tabs";
```

## Component Changes

| SDK 54           | SDK 55                              |
| ---------------- | ----------------------------------- |
| `<Icon />`       | `<NativeTabs.Trigger.Icon />`       |
| `<Label />`      | `<NativeTabs.Trigger.Label />`      |
| `<Badge />`      | `<NativeTabs.Trigger.Badge />`      |
| `<VectorIcon />` | `<NativeTabs.Trigger.VectorIcon />` |

## Example

### Before (SDK 54)

```tsx
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### After (SDK 55)

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

## New in SDK 55

### BottomAccessory

Mini player component for iOS 26+ (renders as no-op on Android/web):

```tsx
<NativeTabs>
  <NativeTabs.BottomAccessory>
    {/* Content above tabs */}
  </NativeTabs.BottomAccessory>
  <NativeTabs.Trigger name="index">
    <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
</NativeTabs>
```

### Icon `md` Prop

Material icon support for Android:

```tsx
<NativeTabs.Trigger.Icon sf="house" md="home" />
```
