---
name: conversation-project-scans
description: "Start a tracked security or SEO scan in a project named from an above-project conversation."
---

# Named Project Scans

Use `findResources` to find the target project, then pass its returned `path`
unchanged to `startProjectScanInRepl`:

```javascript
await startProjectScanInRepl({
  kind: "seo",
  replSlug: "/@owner/app",
  onlyScanChanges: true,
});
```


- `kind` (str): `"security"` or `"seo"`.

- `replSlug` (str): the exact project `path` from `findResources`, or a project
  URL the user shared. Never construct or modify the reference.
- `onlyScanChanges` (bool, optional): scan only changes since the last scan.

The callback follows the result and user-communication rules in the
`project-scans` skill. If a scan of that kind is already open, it waits on the
existing task instead of starting a duplicate.
