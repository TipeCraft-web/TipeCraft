# Device Activation And Verification

Replit's Preview sidebar reads one declaration from each generated HTML
document. Add exactly one tag to `<head>`:

```html
<!-- Quest web app -->
<meta name="replit:meta-device" content="quest">

<!-- Meta Ray-Ban Display web app -->
<meta name="replit:meta-device" content="ray-ban-display">

<!-- One web app that supports both devices -->
<meta name="replit:meta-device" content="quest,ray-ban-display">
```

Keep the dual-device values in that order. Do not add this tag to a native Expo
app. Expo loads a Metro bundle and does not generate an HTML document.

## Verify

1. Build the app.
2. Inspect every built HTML entry point for the exact tag and value.
3. Start the app or deploy it.
4. Inspect the HTML returned by the running URL, not only the source template.
5. Confirm that the Preview sidebar offers exactly the declared devices.

Bundlers and framework templates can replace source markup, so a source-only
check does not prove that activation works.
