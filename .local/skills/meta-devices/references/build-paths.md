## Build Paths

There are three supported implementation paths on Replit for Meta devices. A
dual-device web app combines the two web paths.

### React Native Apps for Meta Quest — THE DEFAULT

- **Target device:** Meta Quest line (Quest 3, Quest 3S, etc.)
- **What you build:** A React Native application (2D UI) using Expo, which renders
  as a 2D panel floating in Horizon OS
- **Why it works:** Quest devices are Android devices and run standard Android apps
- **Why it's the default:** Replit is excellent at building React Native/Expo apps.
  It is the fastest path from idea to something running on a headset, and it is
  what the overwhelming majority of "build me an app for Quest" requests actually
  mean — a media player, a dashboard, a tool, a 2D game.
- **Dev/test options:**
  - Run on Expo Go (available on the Meta Horizon Store)
  - Sideload APK via USB (headset must be in developer mode)
  - Use Meta Spatial Simulator (desktop emulator) with either a built APK or the
    Expo Go APK
- **Publishing:** Submit to the Meta Horizon Store as an Android app
- **Reference:** https://developers.meta.com/horizon/documentation/android-apps/react-native-apps
- **Read:** [Quest Expo](quest/expo.md)

### WebXR Apps for Meta Quest (via IWSDK) — opt-in

- **Target device:** Meta Quest line (Quest 3, Quest 3S, etc.)
- **What you build:** An immersive 3D web experience using Meta's Immersive Web
  SDK (IWSDK)
- **Choose this only when the user explicitly asks for an immersive/3D experience.**
  See [Routing](../SKILL.md#routing) for the exact triggers.
- **Hosting:** Must be hosted at a public HTTPS URL (Replit deployments work perfectly)
- **How users access it:** Open the link in the Quest browser OR publish as a
  Progressive Web App (PWA) to the Meta Horizon Store
- **PWA benefit:** Enables monetization (charge for download, in-app purchases via
  the Quest store)
- **Link benefit:** Easy to share, no store review process
- **Head start:** the `iwsdk-replit-template` repo in this workspace is a
  ready-to-remix IWSDK app with the interaction building blocks already wired up
- **Reference:** https://developers.meta.com/horizon/documentation/web/iwsdk-overview/
- **Read:** [Quest IWSDK/WebXR](quest/webxr.md)

### Web Apps for Meta Ray-Ban Display Glasses — opt-in

- **Target device:** Meta Ray-Ban display glasses (the model WITH a viewfinder display)
- **What you build:** A website/web app meeting specific viewport and UX requirements
- **Choose this only when the user explicitly targets Ray-Ban Display glasses or
  names a viewfinder display.**
- **Hosting:** Must be hosted at a public HTTPS URL (Replit deployments work perfectly)
- **How users open it:** Scan a QR code with the glasses OR share the link through
  the Meta AI companion app on their phone (older docs and devices call this app
  Meta View)
- **Key constraint:** This is the ONLY way to build content for Ray-Ban display
  glasses. There is no native app path. This skill has no supported path for
  Ray-Ban glasses without a display.
- **Reference:** https://wearables.developer.meta.com/docs/develop/webapps/
- **Read:** [Meta Ray-Ban Display app creation](ray-ban/create-app.md)
