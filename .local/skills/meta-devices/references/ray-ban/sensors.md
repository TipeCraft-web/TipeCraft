# Add Device Sensors to a Meta Ray-Ban Display Glasses Web App

Add IMU and GPS integration using standard Web APIs — no SDK required. The glasses
expose sensors through two families:

- **DeviceMotionEvent / DeviceOrientationEvent** — IMU (accelerometer, gyroscope,
  compass heading, tilt), fired continuously as the glasses move.
- **navigator.geolocation** — GPS from the paired companion phone (the glasses have
  no GPS hardware). Permission is granted by the glasses host app.

> **Stack-agnostic.** These are standard browser APIs — identical whether you write
> JavaScript or TypeScript, vanilla or in a framework. The snippets are plain-JS
> reference; port them to your stack. What matters is the behavior, especially the
> performance rules below.

## Performance rules (these matter most for sensors)

Sensors run continuously and drain battery fast. Follow these or the app overheats
and dies:

- **Always stop sensors when leaving their screen.** Remove listeners / call
  `clearWatch`. This is the single most important rule here.
- **Throttle to what the UI needs:** 10–30 Hz for display updates. Only go 60+ Hz
  when motion *analysis* (step detection, gesture recognition) genuinely requires it.
- **No continuous loops while idle.** Start listening on demand; stop on exit.
- **Batch DOM writes** in the handler — update text/transform, don't thrash layout.

## Sensor reference

### DeviceOrientationEvent (heading / tilt)

| Property | Range | Meaning |
|----------|-------|---------|
| `alpha` | 0–360° | Rotation around Z (compass heading; 0 = North) |
| `beta` | −180°–180° | Front-to-back tilt |
| `gamma` | −90°–90° | Left-to-right tilt |
| `absolute` | boolean | true if relative to Earth's frame |

### DeviceMotionEvent (accel / gyro)

| Property | Unit | Meaning |
|----------|------|---------|
| `accelerationIncludingGravity.x/y/z` | m/s² | Acceleration incl. gravity |
| `acceleration.x/y/z` | m/s² | Acceleration, gravity removed (may be null) |
| `rotationRate.alpha/beta/gamma` | deg/s | Gyroscope rotation rate |
| `interval` | ms | Time between events |

### Geolocation (from companion phone)

`latitude`, `longitude`, `accuracy` (m), plus nullable `altitude`,
`altitudeAccuracy`, `speed`, `heading`. Expect 5–50 m accuracy; the first fix may
take several seconds.

## Steps

### 1. Ask

- **Which sensors?** Motion, orientation (compass/tilt), geolocation?
- **What for?** Compass, level, step counter, head tracking, location display?
- **Continuous or one-shot?** (geolocation: `watchPosition` vs `getCurrentPosition`)

### 2. Add display UI + start/stop controls

```html
<div class="data-grid">
  <div class="card"><div class="card-subtitle">X</div><div class="card-value" id="sensor-x">0.00</div></div>
  <div class="card"><div class="card-subtitle">Y</div><div class="card-value" id="sensor-y">0.00</div></div>
  <div class="card"><div class="card-subtitle">Z</div><div class="card-value" id="sensor-z">0.00</div></div>
  <div class="card"><div class="card-subtitle">Magnitude</div><div class="card-value" id="sensor-mag">0.00</div></div>
</div>
<nav class="nav-bar">
  <button class="nav-item focusable primary" data-action="start-sensors">Start</button>
  <button class="nav-item focusable danger" data-action="stop-sensors">Stop</button>
</nav>
```

### 3. Motion & orientation listeners

```javascript
var motionListening = false, orientationListening = false;
var lastMotionUpdate = 0, lastOrientationUpdate = 0;

function onDeviceMotion(e) {
  var now = Date.now();
  if (now - lastMotionUpdate < 1000 / 30) return;
  lastMotionUpdate = now;
  var a = e.accelerationIncludingGravity;   // m/s², includes gravity
  if (!a || a.x === null || a.y === null || a.z === null) return;   // sample unavailable
  document.getElementById('sensor-x').textContent = a.x.toFixed(2);
  document.getElementById('sensor-y').textContent = a.y.toFixed(2);
  document.getElementById('sensor-z').textContent = a.z.toFixed(2);
  var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  document.getElementById('sensor-mag').textContent = mag.toFixed(2);
  // e.rotationRate.{alpha,beta,gamma} = gyroscope, deg/s
}

function onDeviceOrientation(e) {
  var now = Date.now();
  if (now - lastOrientationUpdate < 1000 / 30) return;
  lastOrientationUpdate = now;
  var heading = e.alpha;   // 0–360°, 0 = North; null when unavailable
  if (heading === null) return;
  var headingEl = document.getElementById('compass-heading');
  if (headingEl) headingEl.textContent = Math.round(heading) + '°';
  var needle = document.getElementById('compass-needle');
  if (needle) needle.style.transform = 'rotate(' + (-heading) + 'deg)';
  // e.beta = front-back tilt, e.gamma = left-right tilt
}

async function startMotionSensors() {
  // iOS-style permission gate — required on some platforms
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    var perm;
    try { perm = await DeviceOrientationEvent.requestPermission(); }
    catch (err) { showToast('Sensor permission error', 'error'); return false; }
    if (perm !== 'granted') { showToast('Sensor permission denied', 'error'); return false; }
  }
  window.addEventListener('devicemotion', onDeviceMotion);       motionListening = true;
  window.addEventListener('deviceorientation', onDeviceOrientation); orientationListening = true;
  return true;
}

function stopMotionSensors() {
  if (motionListening) { window.removeEventListener('devicemotion', onDeviceMotion); motionListening = false; }
  if (orientationListening) { window.removeEventListener('deviceorientation', onDeviceOrientation); orientationListening = false; }
}
```

Action handlers:

```javascript
case 'start-sensors':
  startMotionSensors().then(function(started) { if (started) showToast('Sensors started', 'success'); });
  break;
case 'stop-sensors':  stopMotionSensors();  showToast('Sensors stopped'); break;
```

### 4. Geolocation

```javascript
// One-shot — use a generous timeout for phone GPS acquisition
function getLocation(callback) {
  navigator.geolocation.getCurrentPosition(
    function(p) { callback(p.coords.latitude, p.coords.longitude, p.coords.accuracy); },
    function(err) { showToast('Location error: ' + err.message, 'error'); },  // code 1=denied 2=unavailable 3=timeout
    { timeout: 15000 }
  );
}

// Continuous — ALWAYS clearWatch when done to save battery
var watchId = null;
function startLocationWatch(onUpdate) {
  if (watchId !== null) return;
  watchId = navigator.geolocation.watchPosition(
    function(p) { onUpdate(p.coords.latitude, p.coords.longitude, p.coords.accuracy); },
    function(err) { showToast('Location error: ' + err.message, 'error'); }
  );
}
function stopLocationWatch() {
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}
```

### 5. Clean up on screen exit (required)

In `navigateTo()`, before switching screens:

```javascript
stopMotionSensors();
stopLocationWatch();
```

---

## Common patterns

Each pattern below is a named handler. Register it with `addEventListener` when
the screen opens and remove the same function reference in `stopMotionSensors()`
(or the screen's exit hook). Anonymous listeners cannot be removed, so they keep
running after the user leaves.

### Compass — `alpha` for heading

```javascript
var lastCompassUpdate = 0;
function onCompass(e) {
  if (e.alpha === null) return;
  var now = Date.now();
  if (now - lastCompassUpdate < 1000 / 30) return;
  lastCompassUpdate = now;
  document.getElementById('compass-heading').textContent = Math.round(e.alpha) + '°';
  document.getElementById('compass-needle').style.transform = 'rotate(' + (-e.alpha) + 'deg)';
}
// start: window.addEventListener('deviceorientation', onCompass);
// stop:  window.removeEventListener('deviceorientation', onCompass);
```

### Level tool — `beta` / `gamma` for tilt

```javascript
var lastLevelUpdate = 0;
function onLevel(e) {
  if (e.beta === null || e.gamma === null) return;
  var now = Date.now();
  if (now - lastLevelUpdate < 1000 / 30) return;
  lastLevelUpdate = now;
  var bubbleX = Math.max(-120, Math.min(120, e.gamma * 4));  // left-right
  var bubbleY = Math.max(-120, Math.min(120, e.beta * 4));   // front-back
  document.getElementById('level-bubble').style.transform =
    'translate(calc(-50% + ' + bubbleX + 'px), calc(-50% + ' + bubbleY + 'px))';
  var angle = Math.sqrt(e.beta * e.beta + e.gamma * e.gamma);
  document.getElementById('level-reading').textContent = angle.toFixed(1) + '°';
}
// start: window.addEventListener('deviceorientation', onLevel);
// stop:  window.removeEventListener('deviceorientation', onLevel);
```

### Step counter — acceleration magnitude peaks

```javascript
var stepCount = 0, lastMag = 0, threshold = 12;
function onStep(e) {
  var a = e.accelerationIncludingGravity;
  if (!a || a.x === null || a.y === null || a.z === null) return;
  var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  if (lastMag < threshold && mag >= threshold) {
    document.getElementById('steps').textContent = ++stepCount;
  }
  lastMag = mag;
}
// start: window.addEventListener('devicemotion', onStep);
// stop:  window.removeEventListener('devicemotion', onStep);
```

### Shake detection

```javascript
var shakeThreshold = 15, lastShake = 0;
function onShakeMotion(e) {
  var a = e.accelerationIncludingGravity;
  if (!a || a.x === null || a.y === null || a.z === null) return;
  var mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  if (mag > shakeThreshold && Date.now() - lastShake > 1000) { lastShake = Date.now(); onShake(); }
}
// start: window.addEventListener('devicemotion', onShakeMotion);
// stop:  window.removeEventListener('devicemotion', onShakeMotion);
```

Head-tilt game control, head nod/shake detection, and AR overlays (fusing `alpha`
heading with GPS) follow the same shape — read the relevant event, throttle, map to
UI, and stop on exit.

### Compass / level UI

```html
<div class="compass-container">
  <div class="compass-ring">
    <div class="compass-needle" id="compass-needle"></div>
    <div class="compass-label">N</div>
  </div>
  <div class="compass-heading" id="compass-heading">0&deg;</div>
</div>
```

```css
.compass-container, .level-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px; }
.compass-ring, .level-surface { width: 300px; height: 300px; border: 4px solid var(--bg-tertiary); border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; }
.level-surface { overflow: hidden; }
.compass-needle { width: 4px; height: 120px; background: linear-gradient(to top, var(--danger) 50%, var(--text-primary) 50%); border-radius: 2px; transform-origin: center bottom; position: absolute; bottom: 50%; transition: transform 0.1s ease; }
.compass-label { position: absolute; top: 12px; font-size: 20px; font-weight: 700; color: var(--danger); }
.compass-heading, .level-reading { font-size: 48px; font-weight: 700; color: var(--accent-primary); }
.level-bubble { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-primary); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: transform 0.1s ease; box-shadow: 0 0 20px var(--focus-glow); }
```

## Verify

- [ ] Start/stop controls work via D-pad + Enter
- [ ] Orientation updates smoothly (heading / tilt)
- [ ] Motion updates (accelerometer values)
- [ ] Geolocation returns coordinates (may take a few seconds on first call)
- [ ] **Sensors stop when leaving the screen** and `clearWatch` is called
- [ ] Handler updates are throttled to what the UI needs (10–30 Hz for display)
- [ ] "Sensors started" appears only after permission is granted and listeners are attached
- [ ] Handlers skip null readings instead of throwing

## Related references

- [UI](ui.md) — display rules for screens that show sensor data
- [App creation](create-app.md) — scaffold a new app
- [Performance](performance.md) — keep sensor polling and rendering within budget
