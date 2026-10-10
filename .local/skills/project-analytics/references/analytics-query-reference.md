# Project analytics query reference

This is a query-focused subset of the project analytics schema, not a complete
list of physical ClickHouse tables or columns. It covers the fields intended for
Agent analytics queries.

## Query Tool

`queryAppAnalytics({ sql })` runs one read-only ClickHouse `SELECT` against the current project's analytics.

```javascript
await queryAppAnalytics({
  sql: "SELECT countIf(event_type = 1) AS pageviews FROM website_event WHERE created_at >= now() - INTERVAL 7 DAY",
});
```

It returns one of:

- `{ ok: true, rows, rowCount }`
- `{ ok: false, error, errorKind }`

The server selects the project tenant. Do not add a `website_id` condition or accept a website ID from the user.

For a failed result, read its `errorKind`:

- `guard_rejected` or `query_rejected` -- read the detailed `error`, correct the SQL, and try again.
- `result_too_large` -- aggregate in SQL, shorten the time window, or add a tighter `LIMIT`.
- `not_authorized` -- tell the user they do not have access.
- `service_unavailable` -- tell them analytics is temporarily unavailable instead of changing the SQL.

## `website_event`

One row per pageview, custom event, or tracker signal.

| Column | Type | Meaning |
| --- | --- | --- |
| `event_id` | `UUID` | Event identifier; joins to `event_data.event_id` |
| `session_id` | `UUID` | Approximate visitor identifier |
| `visit_id` | `UUID` | A shorter visit identifier within a `session_id`; one session can contain multiple visits |
| `created_at` | `DateTime('UTC')` | Event time in UTC |
| `event_type` | `UInt32` | `1` pageview, `2` custom event, `3` link, `4` pixel, `5` performance |
| `event_name` | `String` | Custom event name when `event_type = 2` |
| `url_path` | `String` | URL path without the query string |
| `url_query` | `String` | URL query string |
| `page_title` | `String` | Page title |
| `referrer_domain` | `String` | Referring domain; empty means direct traffic |
| `referrer_path`, `referrer_query` | `String` | Referrer details |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | `String` | Campaign dimensions |
| `country`, `region`, `city` | `String` | Approximate location |
| `browser`, `os`, `device`, `screen`, `language` | `String` | Client dimensions |
| `hostname` | `String` | Replit or custom domain that served the page |
| `lcp`, `inp`, `cls`, `fcp`, `ttfb` | `Nullable(Decimal)` | Web vitals on performance events |
| `distinct_id` | `String` | App-supplied identity when present |

Filter pageview questions with `event_type = 1`. When visitors and pageviews appear together, filter both consistently with `uniqIf(session_id, event_type = 1)` and `countIf(event_type = 1)`.

`session_id` is based on website, IP, user agent, and a monthly rotating salt. For windows spanning multiple calendar months, report visitors per month rather than presenting one cross-month unique count as exact.

## `event_data`

Custom event properties, one row per property key.

| Column | Type | Meaning |
| --- | --- | --- |
| `event_id` | `UUID` | Joins to `website_event.event_id` |
| `session_id` | `UUID` | Approximate visitor identifier |
| `event_name` | `String` | Custom event name |
| `url_path` | `String` | Path where the event fired |
| `data_key` | `String` | Property name |
| `string_value` | `Nullable(String)` | Value for string and boolean properties |
| `number_value` | `Nullable(Decimal(22,4))` | Numeric value |
| `date_value` | `Nullable(DateTime('UTC'))` | Date value |
| `data_type` | `UInt32` | `1` string, `2` number, `3` boolean, `4` date |
| `created_at` | `DateTime('UTC')` | Property event time in UTC |

Use the value column matching `data_type`. Do not assume a numeric-looking string was stored as a number.

## Query Limitations

- Visitor identity is not stable across calendar months because `session_id` re-salts monthly. Do not calculate cross-month retention or returning-visitor rates. Offer per-month visitor counts or within-month return frequency instead.
- Without an app-supplied `distinct_id`, sessions do not identify a visitor across devices.
- Analytics includes only events collected after analytics was enabled, the app was published or republished, and visitors generated tracked activity.
- This tool answers bounded analytics questions; it is not an export path. Do not use OFFSET, cursor, or time-window loops to reconstruct raw event rows beyond the result limit. If the user asks for a full raw data dump, say raw analytics data export is unsupported and offer an aggregated view instead.

### Zero or sparse results

If the user asks for an all-time number, anchor the answer to the first collected analytics event, e.g., "Your app got 42 pageviews, starting from Aug 26." Never present this number as covering the app's full lifetime - analytics coverage begins when analytics was enabled and the app was published or republished, not when the app was created.

If an unfiltered, all-time pageview query returns zero, do not report zero visitors or users. Use this response:

> I couldn't find any analytics data for this project. That usually means:
>
> - Analytics hasn't been turned on, or
> - Analytics is on, but no one has visited the published app since then.
>
> To start collecting data, make sure analytics is turned on in Publishing settings. Then publish or republish the app so the change takes effect. Once that's done and people visit the published app, I can pull a weekly summary of visitors, pageviews, and traffic sources for you.

Similarly, if a windowed query has an empty stretch at its start, it may mean the window predates analytics coverage, not that traffic was zero. For example, if the user asks for the number of daily visitors in the last 7 days but they've only had 2 visitors, you should say, "In the last 7 days, your app has had 2 visitors. This visitor count reflects activity collected after analytics was enabled and the app was published or republished."

## Query Rules

- Submit one read-only SQL statement whose top-level statement is `SELECT`. Subqueries are allowed. Do not use `INSERT`, `SET`, `SETTINGS`, `FORMAT`, `INTO`, `DESCRIBE`, or `SHOW`.
- Include an explicit time window unless the user asks for all-time data.
- Aggregate in SQL rather than loading raw events and counting them yourself.
- Keep result sets small with aggregation and `LIMIT`.
- Do not filter by hostname unless the user asks about a specific domain. Analytics may include the app's Replit domain and custom domains.



## Multiple website artifacts

All website artifacts in a project use the same analytics tenant. Use `url_path`
to limit a query to one website artifact.

Before an artifact-specific query, call `listArtifacts()`. Select the artifact
that matches the user's question. Read its `.replit-artifact/artifact.toml` file
and use its production service paths. Do not use the artifact title or source
directory as a path.

### Non-root artifact

Remove the trailing slash from the service path before you build the filter.
Match the path itself and its children. Do not use
`startsWith(url_path, '/website-1')`. That predicate also matches a sibling path
such as `/website-10`.

```sql
(
  url_path = '/website-1'
  OR startsWith(url_path, '/website-1/')
)
```

Use the same predicate with `website_event.url_path` and
`event_data.url_path`. If one artifact has multiple service paths, group each
path predicate and combine the groups with `OR`.

```sql
(
  (
    url_path = '/website-1'
    OR startsWith(url_path, '/website-1/')
  )
  OR (
    url_path = '/website-2'
    OR startsWith(url_path, '/website-2/')
  )
)
```

### Root artifact

The root path `/` matches every URL. To select the root artifact, exclude the
paths of all non-root website artifacts. This example selects pageview traffic
for the root artifact:

```sql
WITH ['/website-1', '/website-2'] AS non_root_paths
SELECT uniqIf(session_id, event_type = 1) AS visitors,
       countIf(event_type = 1) AS pageviews
FROM website_event
WHERE created_at >= now() - INTERVAL 7 DAY
  AND NOT arrayExists(
    path -> url_path = path OR startsWith(url_path, concat(path, '/')),
    non_root_paths
  )
```

Path attribution uses the browser's current URL. If a root SPA changes its URL
to another artifact's service path without a page load, the event matches that
service path. Treat this as a conflicting app route. Also, a service path change
does not move historical data to the new path.



## Query examples

### Daily traffic

```sql
SELECT toDate(created_at) AS day,
       uniqIf(session_id, event_type = 1) AS visitors,
       countIf(event_type = 1) AS pageviews
FROM website_event
WHERE created_at >= now() - INTERVAL 7 DAY
GROUP BY day
ORDER BY day
```

### Popular pages

```sql
SELECT url_path,
       count() AS pageviews,
       uniq(session_id) AS visitors
FROM website_event
WHERE event_type = 1
  AND created_at >= now() - INTERVAL 7 DAY
GROUP BY url_path
ORDER BY pageviews DESC
LIMIT 20
```

### Traffic sources

```sql
SELECT if(referrer_domain = '', 'direct', referrer_domain) AS source,
       uniq(session_id) AS visitors
FROM website_event
WHERE event_type = 1
  AND created_at >= now() - INTERVAL 7 DAY
GROUP BY source
ORDER BY visitors DESC
LIMIT 20
```

### Custom event activity

```sql
SELECT event_name,
       count() AS occurrences,
       uniq(session_id) AS visitors
FROM website_event
WHERE event_type = 2
  AND created_at >= now() - INTERVAL 7 DAY
GROUP BY event_name
ORDER BY occurrences DESC
LIMIT 25
```

### String properties for one event

```sql
SELECT data_key,
       string_value,
       count() AS occurrences
FROM event_data
WHERE event_name = 'signup_completed'
  AND data_type = 1
  AND created_at >= now() - INTERVAL 7 DAY
GROUP BY data_key, string_value
ORDER BY occurrences DESC
LIMIT 25
```

### Numeric property total

```sql
SELECT sum(number_value) AS total
FROM event_data
WHERE event_name = 'purchase_completed'
  AND data_key = 'amount'
  AND data_type = 2
  AND created_at >= now() - INTERVAL 7 DAY
```

### Three-step funnel

```sql
SELECT countIf(step >= 1) AS viewed_home,
       countIf(step >= 2) AS started_signup,
       countIf(step >= 3) AS completed_signup
FROM (
  SELECT session_id,
         windowFunnel(1800)(
           created_at,
           event_type = 1 AND url_path = '/',
            event_type = 2 AND event_name = 'signup_started',
            event_type = 2 AND event_name = 'signup_completed'
         ) AS step
  FROM website_event
  WHERE created_at >= now() - INTERVAL 7 DAY
  GROUP BY session_id
)
```

### One domain only

Use this only when the user asks about a particular domain:

```sql
SELECT countIf(event_type = 1) AS pageviews
FROM website_event
WHERE hostname = 'app.example.com'
  AND created_at >= now() - INTERVAL 7 DAY
```

## Visualize Results


Before creating a chart, read `.local/skills/atta-chart-authoring/SKILL.md` and follow its Atta chart authoring and delivery workflow.

Use an Atta chart by default for:


- Comparisons across segments.
- Multi-category distributions, such as country, region, device, browser, or traffic source.
- Time-series trends.
- Funnels.

Present the chart first, then give a concise takeaway.

Do not output raw tables longer than 10 rows unless the user explicitly requested a table. When the data exceeds that, summarize the pattern instead - e.g., "daily traffic for the last 30 days" should yield a description of the trend, not a 30-row table.

For composition comparisons with different segment totals, chart percentage shares. Raw category counts can hide meaningful differences in audience mix when one segment has much more traffic.

Prefer:

- Grouped bar charts for comparing category values across segments.
- Line charts for trends over time.
- Pie charts for compositions.

- Funnel charts for sequential stages with drop-off.


Do not skip a useful chart only because a table can show the same values. Pass aggregated query results directly from CodeExecution without logging the dataset. Preserve chronological ordering for time series.

If the user explicitly requests a visualization that an Atta chart cannot represent, generate an SVG instead. Never silently change the data, time range, or aggregation to fit an inline chart.

## Report Results

Answer with the actual numbers and state the queried time window. Mention partial days, zero rows, or other limitations that materially affect the answer. Analytics only includes traffic collected after the user enabled analytics and published or republished the app. Follow the Zero or sparse results rules when they apply.
