---
name: project-analytics
description: Add custom project analytics events or answer questions about a published app's traffic, visitors, pages, sources, and custom events.
---

# Project Analytics

## How Project Analytics Works

Replit injects the Umami tracker into published app HTML through the deployment proxy. The app must not add or configure the analytics script, website ID, script URL, or analytics environment variables.

Replit-hosted analytics supports website artifacts only. It does not collect events from mobile apps or other non-website artifacts.

The injected tracker automatically handles pageviews. App code only needs custom events for meaningful interactions and outcomes.

The tracker is present only after the user enables analytics in Publishing settings and publishes or republishes a supported app. Optional chaining makes calls a safe no-op when the tracker is absent, such as during development or before the injected script finishes loading. Error handling prevents analytics failures from breaking the app.

Before you instrument or query Replit-hosted analytics, call `checkProjectAnalyticsAccess()`.

It returns `{ access: "authorized" | "requires_upgrade" | "unavailable" }`. Read the `access` field; the result is not a plain string.

- For `{ access: "authorized" }`, continue with the matching workflow below.
- For `{ access: "requires_upgrade" }`, the callback presents the user with an upgrade or third-party analytics choice and ends the turn. Do not edit the app or query analytics. The user's choice arrives in a later turn with instructions for the next step.
- For `{ access: "unavailable" }`, do not edit the app or query analytics. Tell the user that Replit-hosted analytics is unavailable for this project.

If the user explicitly asks for a third-party analytics service, do not call `checkProjectAnalyticsAccess`. Follow the workflow for that service instead.

Choose the workflow that matches the user's request:

- **Add custom events:** instrument meaningful interactions and outcomes with `window.umami.track()`.
- **Query analytics:** answer questions about collected traffic, visitors, pages, sources, or custom events.

## Intent: Add Custom Events

### Add a Safe Event Wrapper

For TypeScript apps, add one shared wrapper and use it instead of calling `window.umami.track()` throughout the app:

```ts
type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the app.
  }
}
```

Use the same behavior in JavaScript apps without the type declarations.

### Instrument Custom Events

Call the wrapper at the interaction or successful outcome the user wants to understand:

```ts
trackEvent('plan_selected', {
  plan: 'pro',
  location: 'pricing_page',
});
```

Follow these event rules:

- Use `snake_case`, keep names under 50 characters.
- Use `data` properties for dimensions (plan, location, variant), not separate event names.
- Keep property values to `string | number | boolean`; no nested objects.
- For date properties, use an ISO 8601 timestamp string such as `new Date().toISOString()`.
- Do not send secrets, PII, or free-form user content.

### Finish Instrumentation

After adding the instrumentation:

First, if `SuggestUserAction` supports the `deploy` action, call `SuggestUserAction({ action: "deploy", message: "The analytics changes will apply when you publish." })` to show the user the publish or republish action.

1. Summarize the custom events in Markdown tables with `Description` and `Event name` columns. For broad instrumentation, group each table under a `###` category heading.
2. Tell the user: "Go to Publishing settings, enable analytics, and publish or republish your app. The analytics changes will take effect on the next publish."
3. End with one to three questions the user can ask after data starts coming in. Derive each question from this app's custom events, event properties, routes, or useful pageview-to-event funnels. Avoid generic traffic questions.

## Intent: Summarize Analytics

Before querying data, read `.local/skills/project-analytics/references/analytics-query-reference.md` and follow its query contract, rules, limitations, examples, visualization guidance, and reporting guidance.

1. If the app has no custom-event instrumentation:
   - Do not summarize automatic pageviews.
   - Tell the user that custom analytics is not configured.
   - Suggest specific events for the app's important user flows and outcomes.
   - Offer to add the instrumentation, but do not edit the app until the user asks.
   - Then stop.
2. If custom instrumentation exists:
   - Query the past seven days.
   - Summarize the most useful app-specific outcomes, funnels, and traffic-source performance.
   - If an instrumented event has no recorded activity, say that it is configured but did not fire during the queried period. Remind the user to republish if the instrumentation is newer than the deployed app.
   - Mention important instrumentation gaps when the existing coverage is incomplete.
3. End with one to three questions derived from the app's custom events, properties, and funnels.

Keep the response concise. Do not edit the app during a summary request.

## Intent: Query Analytics

If query results show no custom events, suggest events worth instrumenting for this project and offer to add them.

Before querying data, read `.local/skills/project-analytics/references/analytics-query-reference.md` and follow its query contract, rules, limitations, examples, visualization guidance, and reporting guidance.
