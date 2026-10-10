---
name: web-search
description: Search the web, fetch content, extract branding profiles, and capture screenshots from URLs. Use for real-time information, API documentation, current events, design matching, and visual reference.
---

# Web Search Skill

## When to Use

- Real-time information (news, prices, events)
- Looking up API documentation or SDK guides
- Current technical information beyond training data
- Verifying facts from authoritative sources

## When NOT to Use

- Replit-specific features (use the `replit-docs` skill)
- Searching for real web images or logo files (use the `image-search` skill)
- Image or video generation (use the `media-generation` skill)
- Code search within the project (use grep/glob tools)

## Available Functions

### Search routing

`webSearch` hides backend selection and fallback behavior from the caller.
Use the returned result shape and do not infer the active backend from the
callback name.
All categories, including `people`, follow the same active search and fallback
policy. Expect title/url/snippet results, not a dedicated people index or
structured work history. Optional metadata may be absent on any route.

### webSearch({ query, searchQueries?, count?, category?, includeDomains?, isTextExtended? })

**Parameters:**

- `query` (str, required): Natural language search query phrased as a complete question
- `searchQueries` (list of str, strongly recommended): 2-3 concise keyword queries (3-6 words each), diverse in entity names, synonyms, and angles. Results are noticeably better than with `query` alone. For time-sensitive queries, check today's date and use the current year — a year recalled from memory is often stale.
- `count` (number, optional): Number of results, 1-10
- `includeDomains` (list of str, optional): Limit to specific sites. For a site-specific people search, omit `category` and describe the person in `query`; some routes reject `category: "people"` combined with a site list.
- `isTextExtended` (bool, optional): Increase returned text from 300 to 800 characters. Use when looking for high-pri info.
- `category` (str, optional): Compatibility hint: `company`, `people`, `news`, `personal site`. May be ignored by the active search route. Put the desired result type and identifying details in `query`; `people` does not guarantee structured records.

**Returns:** Dict with `searchAnswer` and `resultPages` (list of title/url/snippet dicts). A `category`, non-empty `includeDomains`, or `isTextExtended: true` also requests optional metadata (`publishedDate`, `author`, `entities`) where available. Do not rely on these fields being present, including for people searches.

**Example:**

```javascript
const results = await webSearch({
    query: "What are OpenAI's API rate limits in 2026?",
    searchQueries: ["OpenAI API rate limits", "OpenAI usage tier limits"]
});
for (const page of results.resultPages) {
    console.log(`${page.title}: ${page.url}`);
}
```

### Multiple web searches

For different angles on the same question, pass them as `searchQueries` in a single call. Only independent questions need separate `webSearch` calls, run in parallel.

**Example:**

```javascript
const [openaiResults, anthropicResults] = await Promise.all([
    webSearch({
        query: "What are OpenAI's API rate limits in 2026?",
        searchQueries: ["OpenAI API rate limits", "OpenAI usage tier limits"]
    }),
    webSearch({
        query: "What are Anthropic's API rate limits in 2026?",
        searchQueries: ["Anthropic API rate limits", "Claude API tier limits"]
    })
]);
```

### webFetch(url)

Fetch and extract content from a URL as markdown.

**Parameters:**

- `url` (str, required): Full HTTPS URL to fetch
- `startIndex` (int, optional): Resume a truncated page: pass the `nextStartIndex` returned by the previous fetch of the same URL.

**Returns:** Dict with `markdown` (page content), `truncated`, and — only when the page was cut — `nextStartIndex` for fetching the next chunk.

**Example:**

```javascript
const content = await webFetch({ url: "https://platform.openai.com/docs/guides/rate-limits" });
console.log(content.markdown.slice(0, 1000));
```

Long pages and PDFs arrive in ~50k-character chunks. Each chunk is a separate full fetch of the page, so read only as many chunks as the task actually needs (`startIndex` is capped at 500k -- ten chunks). Collect them in a variable (don't log whole chunks):

```javascript
let page = await webFetch({ url: docUrl });
let fullText = page.markdown;
for (let i = 0; i < 3 && page.nextStartIndex !== undefined; i++) {
    page = await webFetch({ url: docUrl, startIndex: page.nextStartIndex });
    fullText += page.markdown;
}
```

Raise the loop bound only when you genuinely need the whole document; for "find the answer inside this long page", pass the collected text to `queryWithLLM` instead of reading further.

## Best Practices

1. **Use natural language queries**: write queries as complete questions with context.
2. **Chain search and fetch**: search first, then fetch specific pages for details.
3. **Be specific**: include dates, versions, or other specifics in queries.
4. **Verify with fetch**: don't rely only on search snippets for critical information.
5. **Use branding for design matching**: when replicating a site's visual style, use `extractBranding` to get exact colors, fonts, and spacing.
6. **Use screenshot for visual reference**: when you need to see what a site looks like before replicating its design.

## Example Workflow

```javascript
// Find information about a topic
const searchResult = await webSearch({
    query: "How do I use dependency injection in FastAPI in 2026?",
    searchQueries: ["FastAPI dependency injection tutorial", "FastAPI Depends example"]
});

// Get full content from the most relevant result
if (searchResult.resultPages.length > 0) {
    const bestUrl = searchResult.resultPages[0].url;
    const fullContent = await webFetch({ url: bestUrl });
    console.log(fullContent.markdown);
}
```

## Limitations

- You can search social media (LinkedIn, Instagram, Facebook, Reddit, YouTube), but you can't open the pages via `webFetch`. For people on LinkedIn, include the person's name, identifying details and `site:linkedin.com` in `query`; do not expect structured work history.
- X/Twitter is not reached through either function. Read posts, users and trends with the separate `externalApi__x` function — see `.local/skills/external-apis/references/x.md`
- Cannot download media files (images, videos, audio)
- Paywalled or authenticated content may be inaccessible

## Copyright

- Respect copyright for media content from websites.
- You can reference or link to public content.
- Do not copy media files (images, videos, audio) directly from websites.
- Use the `media-generation` skill for images and videos instead.
