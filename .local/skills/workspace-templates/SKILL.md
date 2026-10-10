---
name: workspace-templates
description: Read when your instructions list workspace stack templates and you are about to create a project with `transitionToProject` or `createNewProject`; it says when to pass a `templateId`. Skip it when no templates are listed.
---
A `templateId` starts the new project from one of the workspace's curated stack templates. Pass one only when a template clearly fits what the user wants to build; omit it for the standard setup. IDs must come from the list in your instructions or from `listTemplates`.

The two functions accept a template differently:

- `createNewProject` takes `templateId` with either `askUser` value. On the confirmation card your pick is a suggestion the user can change or clear, and you are told what they chose. With `askUser: false` it is final.
- `transitionToProject` rejects `templateId` with `askUser: true`, because its card cannot show templates. Pass one only with `askUser: false`, after the user approved that template in conversation.

### listTemplates()

Lists every curated template's `templateId`, title, and description. Call it when your instructions say there are more templates than they list, or to re-check a template before recommending it. It returns `{ available: false }` when the list could not be fetched; offer the standard setup then.

```javascript
await listTemplates({});
```
