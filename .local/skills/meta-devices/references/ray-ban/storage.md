# Add Local Storage to a Meta Ray-Ban Display Glasses Web App

Persist data client-side with the standard [Web Storage API](https://www.w3.org/TR/webstorage/).
No SDK required — it's the same `localStorage` / `sessionStorage` you'd use on any web page.

> **Stack-agnostic.** These are standard browser APIs — identical in JavaScript or
> TypeScript, vanilla or in any framework. The snippets are plain-JS reference;
> adapt them to your stack.

| API | Persistence | Use for |
|-----|-------------|---------|
| `localStorage` | Until explicitly cleared | Settings, saved data, app state, preferences |
| `sessionStorage` | Cleared when the session ends | Temporary state, form drafts, navigation context |

Both share the same interface and store string key-value pairs.

## Steps

### 1. Ask

- **What data?** Settings, preferences, app state, cached responses?
- **Which storage?** Persistent (`localStorage`) or session-only (`sessionStorage`)?
- **Shape?** Single values or a structured object?

### 2. Add storage helpers

In `app.js` (the [app scaffold](create-app.md) already includes
`loadData`/`saveData` keyed by `CONFIG.storageKey` — extend or use these):

```javascript
var STORAGE_KEY = 'mdg_myapp';

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;   // storage unavailable or quota exceeded; keep the app running
  }
}

function loadData() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;   // handle missing/corrupt data gracefully
  }
}

function clearData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
```

### 3. Wire up to app state

```javascript
// On init
var saved = loadData();
if (saved) state.data = saved;

// After any state change
state.data.score = 100;
saveData(state.data);
```

### 4. Settings actions (optional)

```javascript
case 'toggle-dark-mode':
  state.data.darkMode = !state.data.darkMode;
  saveData(state.data);
  break;

case 'reset-data':
  clearData();
  state.data = {};
  showToast('Data cleared');
  break;
```

## Patterns

### Preferences (key/value)

```javascript
function savePreference(key, value) {
  var prefs = loadData() || {};
  prefs[key] = value;
  saveData(prefs);
}
function getPreference(key, defaultValue) {
  var prefs = loadData() || {};
  return prefs[key] !== undefined ? prefs[key] : defaultValue;
}
```

### Cache API responses with a TTL

```javascript
function cacheResponse(url, data, ttlMs) {
  try {
    localStorage.setItem('cache_' + url, JSON.stringify({ data: data, timestamp: Date.now(), ttl: ttlMs }));
    return true;
  } catch (e) {
    return false;
  }
}
function getCachedResponse(url) {
  try {
    var entry = JSON.parse(localStorage.getItem('cache_' + url));
    if (entry && Date.now() - entry.timestamp < entry.ttl) return entry.data;
  } catch (e) {}
  return null;
}
```

### Session-only state

```javascript
var returnTo = 'home';
try {
  sessionStorage.setItem('returnScreen', 'home');
  returnTo = sessionStorage.getItem('returnScreen') || 'home';
} catch (e) {}
```

## Verify

- [ ] Data persists after refresh (`localStorage`)
- [ ] Session data clears when the session ends (`sessionStorage`)
- [ ] Missing / corrupt stored data is handled gracefully
- [ ] Reset/clear action works

## Related references

- [UI](ui.md) — display rules for settings screens and controls
