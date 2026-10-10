# Navigation Reference

```javascript
(function() {
  'use strict';

  // ==================== CONFIG (customize) ====================
  var CONFIG = {
    appName: 'My App',
    storageKey: 'mdg_myapp',
  };

  // ==================== STATE ====================
  var state = {
    currentScreen: 'home',
    screenHistory: [],
    data: {},   // customize: app-specific data shape
  };

  var screens = {};

  function collectScreens() {
    document.querySelectorAll('.screen').forEach(function(s) {
      if (s.id) screens[s.id] = s;
    });
  }

  // ==================== NAVIGATION ====================
  function navigateTo(screenId, options) {
    options = options || {};
    if (options.addToHistory !== false && state.currentScreen) {
      state.screenHistory.push(state.currentScreen);
    }
    Object.values(screens).forEach(function(s) { s.classList.add('hidden'); });
    if (screens[screenId]) {
      screens[screenId].classList.remove('hidden');
      state.currentScreen = screenId;
      onScreenEnter(screenId);
      focusFirst(screens[screenId]);
    }
  }

  function navigateBack() {
    if (state.screenHistory.length > 0) {
      navigateTo(state.screenHistory.pop(), { addToHistory: false });
    }
  }

  // ==================== FOCUS (D-pad) ====================
  function isVisible(el) {
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }

  function getFocusables(container) {
    return Array.from(container.querySelectorAll('.focusable:not([disabled]):not(.hidden)')).filter(isVisible);
  }

  function focusFirst(container) {
    var el = getFocusables(container)[0];
    if (el) el.focus();
  }

  function moveFocus(direction) {
    var container = screens[state.currentScreen];
    if (!container) return;
    var focusables = getFocusables(container);
    if (focusables.length === 0) return;

    var idx = focusables.indexOf(document.activeElement);
    if (idx === -1) { focusFirst(container); return; }

    var nextIdx;
    if (direction === 'up' || direction === 'left') {
      nextIdx = idx > 0 ? idx - 1 : focusables.length - 1;   // wrap
    } else {
      nextIdx = idx < focusables.length - 1 ? idx + 1 : 0;   // wrap
    }
    focusables[nextIdx].focus();
    focusables[nextIdx].scrollIntoView({ block: 'nearest' });
  }

  // ==================== OPTIONAL: fetch with loading/error/cache ====================
  var cache = {};
  function apiGet(url, cacheMs) {
    cacheMs = cacheMs || 5 * 60 * 1000;
    var hit = cache[url];
    if (hit && Date.now() - hit.t < cacheMs) return Promise.resolve(hit.data);
    setLoading(true); clearError();
    return fetch(url)
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data) { cache[url] = { data: data, t: Date.now() }; setLoading(false); return data; })
      .catch(function(err) { setLoading(false); setError(err.message || 'Failed to load'); throw err; });
  }

  // ==================== UI HELPERS ====================
  function setLoading(on) {
    var el = document.getElementById('loading');
    if (el) el.classList.toggle('hidden', !on);
  }
  function setError(msg) {
    var el = document.getElementById('error');
    if (el) { el.classList.remove('hidden'); var m = el.querySelector('.error-message'); if (m) m.textContent = msg; }
  }
  function clearError() {
    var el = document.getElementById('error');
    if (el) el.classList.add('hidden');
  }
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.offsetHeight; // reflow
    toast.classList.add('visible');
    setTimeout(function() { toast.classList.remove('visible'); }, 2500);
  }

  // ==================== PERSISTENCE ====================
  function loadData() {
    try {
      var saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) Object.assign(state.data, JSON.parse(saved));
    } catch (e) {}
  }
  function saveData() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.data)); } catch (e) {}
  }

  // ==================== ACTIONS ====================
  function handleAction(action, element) {
    switch (action) {
      case 'back': navigateBack(); break;
      case 'refresh': onScreenEnter(state.currentScreen); break;
      default: handleAppAction(action, element); break;
    }
  }

  // === CUSTOMIZE: app-specific actions ===
  function handleAppAction(action, element) {
    console.log('[Action]', action);
  }

  // === CUSTOMIZE: per-screen setup (load data, render, start/stop work) ===
  function onScreenEnter(screenId) {
    // Start any timers/sensors here; stop them in navigateTo when leaving.
  }

  // ==================== EVENTS ====================
  function setupEvents() {
    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (el) handleAction(el.dataset.action, el);
    });
    document.addEventListener('keydown', function(e) {
      var isInput = document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (isInput && !['Escape', 'Enter'].includes(e.key)) return;
      switch (e.key) {
        case 'ArrowUp': moveFocus('up'); e.preventDefault(); break;
        case 'ArrowDown': moveFocus('down'); e.preventDefault(); break;
        case 'ArrowLeft': moveFocus('left'); e.preventDefault(); break;
        case 'ArrowRight': moveFocus('right'); e.preventDefault(); break;
        case 'Enter':
          if (document.activeElement && document.activeElement.classList.contains('focusable')) {
            document.activeElement.click();
          }
          e.preventDefault();
          break;
        case 'Escape': navigateBack(); e.preventDefault(); break;
      }
    });
  }

  // ==================== INIT ====================
  function init() {
    collectScreens();
    setupEvents();
    loadData();
    setTimeout(function() { navigateTo('home', { addToHistory: false }); }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```
