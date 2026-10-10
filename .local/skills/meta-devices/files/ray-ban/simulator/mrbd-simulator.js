/*
 * Meta Ray-Ban Display Web App Simulator (MRBD) — dev-only preview shell.
 *
 * Drop this folder into your app's static directory and open preview.html?app=/.
 * It frames any same-origin web app so it renders like it's running on the Meta
 * Ray-Ban Display glasses: additive rendering, a 600x600 display, and a sidebar.
 *
 * It never executes in the app document. The app loads once inside the preview
 * iframe, so app initialization and network work are not duplicated.
 */
(function () {
  "use strict";

  if (window.__MRBD_SIM__) return; // idempotent — never double-inject

  // Capture the script's own URL NOW — document.currentScript is only valid during
  // this initial synchronous run (it's null later, e.g. inside a deferred boot()).
  var SCRIPT_URL = (document.currentScript && document.currentScript.src) || "";

  // Defer setup until <body> exists, so these scripts also work when injected in
  // <head> (not just before </body>). boot() is a hoisted declaration below.
  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  function boot() {
  if (window.__MRBD_SIM__) return; // re-check: guards against two deferred boots

  // ---- constants -----------------------------------------------------------
  var SIDEBAR_W = 344; // px (matches the MRBD Chrome extension sidebar)
  var RAIL_W = 48; // px (sidebar width when collapsed)
  var ANIM_MS = 200; // sidebar collapse/expand duration
  var DISPLAY = 600; // px (glasses display is 600x600)
  var LS_KEY = "mrbd_settings_v1";
  var ACCENT = "#2694fe";

  // Base URL of the shipped backgrounds/ folder, resolved relative to this script so
  // the simulator works no matter where the folder is mounted.
  var BG_BASE = resolveUrl("backgrounds/", SCRIPT_URL) || "/mrbd-simulator/backgrounds/";

  // Backgrounds discovered from backgrounds/manifest.json (populated async).
  // Each entry: { file, label, url }.
  var IMAGES = [];

  var DEFAULTS = {
    background: "", // "" = first available image; else "dark" or an image filename
    appBrightness: 100, // 0..100 (%)
    backgroundBlur: 6, // 0..40 (px)
    showFrame: true,
    collapsed: false, // sidebar starts expanded
  };

  // ---- helpers -------------------------------------------------------------
  function num(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : d;
  }
  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }
  function resolveUrl(rel, base) {
    try {
      return new URL(rel, base).href;
    } catch (e) {
      return null;
    }
  }
  // "golden-gate-bridge.jpg" -> "Golden Gate Bridge"
  function labelFromFile(file) {
    return String(file)
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }
  // Escape text/attribute values built into innerHTML (captions come from filenames).
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cssUrl(url) {
    return "url('" + String(url).replace(/'/g, "%27") + "')";
  }
  // Turn a manifest (array of "file.jpg" or { file, label }) into IMAGES entries.
  function normalizeImages(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map(function (entry) {
        var file = typeof entry === "string" ? entry : entry && entry.file;
        if (!file) return null;
        var label =
          entry && typeof entry === "object" && entry.label
            ? entry.label
            : labelFromFile(file);
        var encodedFile = encodeURIComponent(file);
        var url = resolveUrl(encodedFile, BG_BASE) || BG_BASE + encodedFile;
        return { file: file, label: label, url: url };
      })
      .filter(Boolean);
  }

  // ---- settings persistence ------------------------------------------------
  function loadSettings() {
    var s = {};
    try {
      s = JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch (e) {
      s = {};
    }
    return {
      background: typeof s.background === "string" ? s.background : DEFAULTS.background,
      appBrightness: clamp(num(s.appBrightness, DEFAULTS.appBrightness), 0, 100),
      backgroundBlur: clamp(num(s.backgroundBlur, DEFAULTS.backgroundBlur), 0, 40),
      showFrame: s.showFrame !== false,
      collapsed: s.collapsed === true, // default expanded
    };
  }
  function saveSettings() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  var state = loadSettings();
  var html = document.documentElement;
  var appPath = new URL(window.location.href).searchParams.get("app");
  if (!appPath) {
    console.error("[MRBD] Add ?app=<app-url> to the preview URL.");
    return;
  }
  var appUrl;
  try {
    appUrl = new URL(appPath, window.location.href);
  } catch (e) {
    console.error("[MRBD] The app URL is invalid.");
    return;
  }
  if (
    (appUrl.protocol !== "http:" && appUrl.protocol !== "https:") ||
    appUrl.origin !== window.location.origin
  ) {
    console.error("[MRBD] The app URL must be a same-origin HTTP(S) URL.");
    return;
  }

  // ---- page-level styles (light DOM) --------------------------------------
  // The app reloads inside a real 600x600 iframe, then the complete frame is
  // blended onto the background. Its media queries, viewport units, fixed
  // elements, and filters therefore behave as they do on the device.
  var pageCss = [
    "html.mrbd-active{",
    "  margin:0!important;padding:0!important;overflow:hidden!important;",
    "  background:#1f1f22!important;width:100vw!important;height:100vh!important;",
    "}",
    "#mrbd-bg{",
    "  position:fixed;top:0;left:var(--mrbd-sidebar-w," + SIDEBAR_W + "px);right:0;bottom:0;",
    "  background-color:#0a0a0a;background-image:var(--mrbd-bg-image,none);",
    "  background-size:cover;background-position:center;background-repeat:no-repeat;",
    "  filter:blur(var(--mrbd-blur,6px)) brightness(0.7);",
    "  pointer-events:none;z-index:-1;transition:left " + ANIM_MS + "ms ease;",
    "}",
    "html.mrbd-active body{display:none!important;}",
    // The app frame moves when the sidebar collapses. Scope the transition to the
    // animation window (longhands, so we override transition-property only while
    // .mrbd-animating is set).
    "html.mrbd-animating #mrbd-app{",
    "  transition-property:left!important;transition-duration:" + ANIM_MS + "ms!important;",
    "  transition-timing-function:ease!important;",
    "}",
    "#mrbd-app{",
    "  position:fixed!important;",
    "  width:" + DISPLAY + "px!important;height:" + DISPLAY + "px!important;",
    // Center in the stage, but clamp so a small window never tucks the display
    // under the sidebar or above the viewport (it clips on the right/bottom instead).
    "  top:max(0px, calc((100vh - " + DISPLAY + "px)/2))!important;",
    "  left:max(var(--mrbd-sidebar-w," + SIDEBAR_W + "px), calc(var(--mrbd-sidebar-w," + SIDEBAR_W + "px) + (100vw - var(--mrbd-sidebar-w," + SIDEBAR_W + "px) - " + DISPLAY + "px)/2))!important;",
    "  box-sizing:content-box!important;overflow:hidden!important;margin:0!important;padding:0!important;",
    "  background:#000!important;",
    "  border-radius:24px!important;",
    "  border:1px solid rgba(243,244,245,0.15)!important;",
    "  box-shadow:0 8px 40px rgba(0,0,0,0.4)!important;",
    "  mix-blend-mode:screen!important;",
    "}",
    "html.mrbd-active.mrbd-no-frame #mrbd-app{",
    "  border:none!important;border-radius:0!important;box-shadow:none!important;",
    "}",
    "#mrbd-host{position:fixed;top:0;left:0;width:var(--mrbd-sidebar-w," + SIDEBAR_W + "px);",
    "  height:100vh;z-index:2147483646;transition:width " + ANIM_MS + "ms ease;}",
    // Dev-only reminder, bottom-right of the stage. Sibling of <body> so it's outside
    // the app's DOM and the mix-blend-mode composite. Never interactive.
    "#mrbd-note{position:fixed;bottom:14px;right:18px;",
    "  left:calc(var(--mrbd-sidebar-w," + SIDEBAR_W + "px) + 18px);text-align:right!important;",
    "  font:400 15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif!important;",
    "  color:rgba(223,226,229,0.45)!important;letter-spacing:.1px;",
    "  pointer-events:none;user-select:none;z-index:2147483645;",
    "  transition:left " + ANIM_MS + "ms ease;}",
  ].join("\n");

  var pageStyle = document.createElement("style");
  pageStyle.id = "mrbd-page-style";
  pageStyle.textContent = pageCss;
  document.head.appendChild(pageStyle);

  // ---- app frame -----------------------------------------------------------
  var appFrame = document.createElement("iframe");
  appFrame.id = "mrbd-app";
  appFrame.title = "Meta Ray-Ban Display app preview";
  appFrame.src = appUrl.href;
  html.appendChild(appFrame);

  // ---- background layer (backdrop for the screen blend) --------------------
  var bg = document.createElement("div");
  bg.id = "mrbd-bg";
  html.appendChild(bg);

  // ---- dev-only reminder ---------------------------------------------------
  var note = document.createElement("div");
  note.id = "mrbd-note";
  note.textContent =
    "Preview only — the simulator won't be included when you publish.";
  html.appendChild(note);

  // ---- sidebar UI (isolated in a shadow root) -----------------------------
  var host = document.createElement("div");
  host.id = "mrbd-host";
  var shadow = host.attachShadow({ mode: "open" });
  html.appendChild(host);

  shadow.innerHTML = sidebarMarkup();
  var $ = function (sel) {
    return shadow.querySelector(sel);
  };
  var $$ = function (sel) {
    return Array.prototype.slice.call(shadow.querySelectorAll(sel));
  };

  // ---- wire controls -------------------------------------------------------
  // Swatches are rendered dynamically from the manifest, so use event delegation.
  $("#mrbd-swatches").addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".mrbd-swatch") : null;
    if (!el) return;
    state.background = el.getAttribute("data-bg");
    apply();
  });

  var appBr = $("#mrbd-app-brightness");
  appBr.addEventListener("input", function () {
    state.appBrightness = clamp(num(appBr.value, 100), 0, 100);
    apply();
  });

  var blur = $("#mrbd-blur");
  blur.addEventListener("input", function () {
    state.backgroundBlur = clamp(num(blur.value, 6), 0, 40);
    apply();
  });

  var frame = $("#mrbd-frame");
  frame.addEventListener("change", function () {
    state.showFrame = frame.checked;
    apply();
  });

  // Collapse / expand the sidebar. The stage reads --mrbd-sidebar-w, so flipping
  // the variable slides the background, the display, and the note along with it.
  var animTimer = null;
  var panel = $("#mrbd-panel");
  var collapseBtn = $("#mrbd-collapse");
  // Don't let the click blur the app — same reasoning as the shortcut keys below.
  collapseBtn.addEventListener("mousedown", function (e) {
    e.preventDefault();
  });
  collapseBtn.addEventListener("click", function () {
    state.collapsed = !state.collapsed;
    // Enable the <body> transition only for the duration of the slide.
    html.classList.add("mrbd-animating");
    clearTimeout(animTimer);
    animTimer = setTimeout(function () {
      html.classList.remove("mrbd-animating");
    }, ANIM_MS + 40);
    apply();
  });

  // Shortcut keys — clicking a key dispatches the real keyboard event to the app.
  var KEYS = {
    up: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    down: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    left: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    enter: { key: "Enter", code: "Enter", keyCode: 13 },
    esc: { key: "Escape", code: "Escape", keyCode: 27 },
  };
  $$(".mrbd-key").forEach(function (el) {
    // Prevent the click from stealing focus. The app's D-pad navigation only
    // works while the app's own element stays document.activeElement — a normal
    // mousedown would blur it to <body>, so every arrow would just re-focus the
    // first element instead of navigating. preventDefault keeps focus put.
    el.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    el.addEventListener("click", function () {
      dispatchKey(KEYS[el.getAttribute("data-key")]);
    });
  });

  // ---- apply state to the page --------------------------------------------
  function apply() {
    html.classList.add("mrbd-active");
    html.classList.toggle("mrbd-no-frame", !state.showFrame);

    html.style.setProperty(
      "--mrbd-sidebar-w",
      (state.collapsed ? RAIL_W : SIDEBAR_W) + "px"
    );
    html.style.setProperty("--mrbd-blur", state.backgroundBlur + "px");
    var selected = selectedImage();
    html.style.setProperty(
      "--mrbd-bg-image",
      selected ? cssUrl(selected.url) : "none"
    );

    var brightness = "brightness(" + state.appBrightness / 100 + ")";
    if (state.appBrightness < 100) {
      appFrame.style.filter = brightness;
    } else {
      appFrame.style.removeProperty("filter");
    }

    // reflect state in the UI
    panel.classList.toggle("collapsed", state.collapsed);
    collapseBtn.setAttribute(
      "aria-label",
      state.collapsed ? "Expand sidebar" : "Collapse sidebar"
    );
    $$(".mrbd-swatch").forEach(function (el) {
      el.classList.toggle("selected", el.getAttribute("data-bg") === state.background);
    });
    appBr.value = state.appBrightness;
    $("#mrbd-app-brightness-val").textContent = state.appBrightness + "%";
    blur.value = state.backgroundBlur;
    $("#mrbd-blur-val").textContent = state.backgroundBlur + "px";
    frame.checked = state.showFrame;

    saveSettings();
  }

  function dispatchKey(spec) {
    if (!spec) return;
    var appWindow = appFrame.contentWindow;
    var appDocument = appFrame.contentDocument;
    if (!appWindow || !appDocument) return;
    // Deliver to the app's focused element (where a real key press lands) so the
    // event bubbles to its document and window, exactly like hardware.
    var target = appDocument.activeElement;
    if (!target || target === appDocument.documentElement) {
      target = appDocument.body;
    }
    // keydown first (starts navigation / press), then keyup (activates). React
    // and the window keyup listener process each synchronously in order.
    ["keydown", "keyup"].forEach(function (type) {
      target.dispatchEvent(
        new appWindow.KeyboardEvent(type, {
          key: spec.key,
          code: spec.code,
          keyCode: spec.keyCode,
          which: spec.keyCode,
          bubbles: true,
          cancelable: true,
          composed: true, // cross the shadow boundary if focus is ever inside one
          view: appWindow,
        })
      );
    });
  }

  // Enable/disable is controlled solely by the presence of the one <script> tag —
  // there is no runtime toggle. Mark as injected so a duplicate include is a no-op.
  window.__MRBD_SIM__ = true;

  apply();
  loadBackgrounds();

  // ---- backgrounds ---------------------------------------------------------
  function selectedImage() {
    if (state.background === "dark") return null;
    for (var i = 0; i < IMAGES.length; i++) {
      if (IMAGES[i].file === state.background) return IMAGES[i];
    }
    return null;
  }

  // If the saved/selected background isn't available, fall back sensibly.
  function resolveBackground() {
    if (state.background === "dark") return;
    if (!selectedImage()) {
      state.background = IMAGES.length ? IMAGES[0].file : "dark";
    }
  }

  function renderSwatches() {
    var c = $("#mrbd-swatches");
    if (!c) return;
    var parts = [
      "<div class='mrbd-swatch' data-bg='dark' style='background:#0a0a0a'><span class='cap'>Dark</span></div>",
    ];
    IMAGES.forEach(function (img) {
      parts.push(
        "<div class='mrbd-swatch' data-bg='" +
          esc(img.file) +
          "' style=\"background-image:" +
          cssUrl(img.url) +
          "\"><span class='cap'>" +
          esc(img.label) +
          "</span></div>"
      );
    });
    c.innerHTML = parts.join("");
    $$(".mrbd-swatch").forEach(function (el) {
      el.classList.toggle("selected", el.getAttribute("data-bg") === state.background);
    });
  }

  // Discover backgrounds from backgrounds/manifest.json (a plain array of filenames).
  // The browser can't enumerate a directory, so this manifest is the source of truth.
  function loadBackgrounds() {
    var url = resolveUrl("manifest.json", BG_BASE) || BG_BASE + "manifest.json";
    fetch(url, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("manifest.json HTTP " + r.status);
        return r.json();
      })
      .then(function (list) {
        IMAGES = normalizeImages(list);
      })
      .catch(function (err) {
        // No manifest (or unreadable, e.g. over file://) — use Dark.
        console.warn(
          "[MRBD] backgrounds/manifest.json not loaded; defaulting to Dark.",
          err
        );
        IMAGES = [];
      })
      .then(function () {
        resolveBackground();
        renderSwatches();
        apply();
      });
  }

  // ---- markup --------------------------------------------------------------
  function sidebarMarkup() {
    return [
      "<style>",
      ":host{all:initial;}",
      "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}",
      ".panel{position:absolute;inset:0;background:#1f1f22;color:#dfe2e5;",
      "  border-right:1px solid rgba(242,244,246,0.06);display:flex;flex-direction:column;",
      "  overflow:hidden;}",
      ".panel-scroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;",
      "  padding:24px 18px 56px;gap:28px;}",
      ".panel.collapsed .panel-scroll{display:none;}",
      // Collapse / expand button — bottom-right of the sidebar, centered on the rail
      // when collapsed. Anchor is click-through; only the button takes pointer events.
      ".collapse-anchor{position:absolute;bottom:12px;right:12px;pointer-events:none;z-index:2;}",
      ".panel.collapsed .collapse-anchor{left:0;right:0;display:flex;justify-content:center;}",
      ".collapse-btn{width:32px;height:32px;padding:0;border-radius:8px;",
      "  border:1px solid rgba(255,255,255,0.1);background:rgba(31,31,34,0.85);",
      "  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);",
      "  color:rgba(255,255,255,0.5);cursor:pointer;display:flex;align-items:center;",
      "  justify-content:center;transition:all 100ms ease;pointer-events:auto;}",
      ".collapse-btn:hover{background:rgba(50,50,54,0.9);color:rgba(255,255,255,0.8);",
      "  border-color:rgba(255,255,255,0.2);}",
      ".collapse-btn svg{width:16px;height:16px;display:block;}",
      ".chev-r{display:none;}",
      ".panel.collapsed .chev-l{display:none;}",
      ".panel.collapsed .chev-r{display:block;}",
      // Header
      ".brand{font-size:16px;font-weight:600;line-height:1.35;color:#f3f4f5;",
      "  padding-bottom:18px;border-bottom:1px solid rgba(242,244,246,0.1);}",
      ".section-title{font-size:17px;font-weight:600;line-height:24px;color:#dfe2e5;margin-bottom:12px;}",
      // Background swatches
      ".swatches{display:flex;flex-wrap:wrap;gap:10px;}",
      ".mrbd-swatch{width:92px;height:69px;border-radius:8px;border:2px solid transparent;",
      "  cursor:pointer;background-size:cover;background-position:center;position:relative;",
      "  overflow:hidden;outline:1px solid rgba(243,244,245,0.12);}",
      ".mrbd-swatch:hover{border-color:rgba(243,244,245,0.3);}",
      ".mrbd-swatch.selected{border-color:#f3f4f5;}",
      ".mrbd-swatch .cap{position:absolute;left:0;right:0;bottom:0;font-size:11px;text-align:center;",
      "  color:#dfe2e5;background:rgba(0,0,0,0.5);padding:2px 0;}",
      // Display settings — sliders and toggle
      ".settings-group{display:flex;flex-direction:column;gap:24px;}",
      ".slider-row{display:flex;flex-direction:column;gap:8px;}",
      ".slider-label{font-size:14px;font-weight:500;color:#b0b5bb;line-height:22px;}",
      ".slider-container{display:flex;align-items:center;gap:12px;}",
      ".slider-track{flex:1;min-width:0;-webkit-appearance:none;appearance:none;height:4px;",
      "  border-radius:4px;outline:none;cursor:pointer;background:rgba(17,17,18,0.5);}",
      ".slider-track::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;",
      "  border-radius:50%;background:" + ACCENT + ";border:3px solid #1f1f22;cursor:pointer;}",
      ".slider-track::-moz-range-thumb{width:14px;height:14px;border-radius:50%;",
      "  background:" + ACCENT + ";border:3px solid #1f1f22;cursor:pointer;}",
      ".slider-value{font-size:16px;color:#dfe2e5;line-height:24px;min-width:44px;",
      "  text-align:right;flex-shrink:0;}",
      ".toggle-row{display:flex;align-items:center;justify-content:space-between;}",
      ".switch{position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;}",
      ".switch input{opacity:0;width:0;height:0;}",
      ".switch-track{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.15);",
      "  border-radius:12px;transition:background 150ms ease;}",
      ".switch-track:before{content:'';position:absolute;height:20px;width:20px;left:2px;top:2px;",
      "  background:#fff;border-radius:50%;transition:transform 150ms ease;}",
      ".switch input:checked + .switch-track{background:" + ACCENT + ";}",
      ".switch input:checked + .switch-track:before{transform:translateX(20px);}",
      // Shortcuts — key clusters with a label under each group
      ".dpad-row{display:flex;align-items:flex-end;gap:32px;}",
      ".dpad-group{display:flex;flex-direction:column;align-items:center;gap:6px;}",
      ".dpad-group-label{font-size:14px;font-weight:500;color:#dfe2e5;line-height:20px;}",
      ".dpad-keys{display:flex;flex-direction:column;align-items:center;gap:4px;}",
      ".dpad-keys-row{display:flex;gap:4px;}",
      ".mrbd-key{display:flex;align-items:center;justify-content:center;min-width:36px;height:32px;",
      "  padding:0 8px;border-radius:6px;background:rgba(223,226,229,0.2);color:#aaafb5;",
      "  font-size:14px;font-weight:500;line-height:20px;cursor:pointer;user-select:none;",
      "  transition:all 100ms ease;}",
      ".mrbd-key:hover{background:rgba(223,226,229,0.3);color:#dfe2e5;}",
      ".mrbd-key:active{background:rgba(223,226,229,0.4);color:#fff;transform:scale(0.92);}",
      "</style>",
      "<aside class='panel' id='mrbd-panel'>",
      "  <div class='panel-scroll'>",
      "  <div class='brand'>Meta Ray-Ban Display Web App Simulator</div>",
      "  <div>",
      "    <div class='section-title'>Background</div>",
      "    <div class='swatches' id='mrbd-swatches'></div>",
      "  </div>",
      "  <div>",
      "    <div class='section-title'>Display Settings</div>",
      "    <div class='settings-group'>",
      "      <div class='slider-row'>",
      "        <label class='slider-label' for='mrbd-app-brightness'>App Brightness</label>",
      "        <div class='slider-container'>",
      "          <input type='range' class='slider-track' id='mrbd-app-brightness' min='0' max='100' step='1'>",
      "          <span class='slider-value' id='mrbd-app-brightness-val'>100%</span>",
      "        </div>",
      "      </div>",
      "      <div class='slider-row'>",
      "        <label class='slider-label' for='mrbd-blur'>Background Blur</label>",
      "        <div class='slider-container'>",
      "          <input type='range' class='slider-track' id='mrbd-blur' min='0' max='40' step='1'>",
      "          <span class='slider-value' id='mrbd-blur-val'>6px</span>",
      "        </div>",
      "      </div>",
      "      <div class='toggle-row'>",
      "        <label class='slider-label' for='mrbd-frame'>Show Display Frame</label>",
      "        <label class='switch'><input type='checkbox' id='mrbd-frame'><span class='switch-track'></span></label>",
      "      </div>",
      "    </div>",
      "  </div>",
      "  <div>",
      "    <div class='section-title'>Shortcuts</div>",
      "    <div class='dpad-row'>",
      "      <div class='dpad-group'>",
      "        <div class='dpad-keys'>",
      "          <div class='dpad-keys-row'><div class='mrbd-key' data-key='up'>↑</div></div>",
      "          <div class='dpad-keys-row'>",
      "            <div class='mrbd-key' data-key='left'>←</div>",
      "            <div class='mrbd-key' data-key='down'>↓</div>",
      "            <div class='mrbd-key' data-key='right'>→</div>",
      "          </div>",
      "        </div>",
      "        <span class='dpad-group-label'>Navigate</span>",
      "      </div>",
      "      <div class='dpad-group'>",
      "        <div class='mrbd-key' data-key='enter'>return</div>",
      "        <span class='dpad-group-label'>Select</span>",
      "      </div>",
      "      <div class='dpad-group'>",
      "        <div class='mrbd-key' data-key='esc'>esc</div>",
      "        <span class='dpad-group-label'>Back</span>",
      "      </div>",
      "    </div>",
      "  </div>",
      "  </div>",
      "  <div class='collapse-anchor'>",
      "    <button class='collapse-btn' id='mrbd-collapse' type='button' aria-label='Collapse sidebar'>",
      "      <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' stroke-width='2'",
      "           stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>",
      "        <path class='chev-l' d='M10 4L6 8L10 12'/>",
      "        <path class='chev-r' d='M6 4L10 8L6 12'/>",
      "      </svg>",
      "    </button>",
      "  </div>",
      "</aside>",
    ].join("\n");
  }
  } // end boot
})();
