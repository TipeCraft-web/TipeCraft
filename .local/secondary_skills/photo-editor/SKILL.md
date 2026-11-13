---
name: photo-editor
description: Edit, resize, crop, filter, and optimize images — backgrounds, watermarks, and batch processing.
---

# Photo Editor

Resize, crop, filter, and optimize images. Pillow for Python, sharp for Node. Clarify intent before starting.

## Clarify Intent First

When a user asks to "edit a photo" or "change an image," the request could mean two very different things. **Ask before proceeding** if it's ambiguous:

1. **Edit the existing image** — crop, resize, recolor, adjust brightness/contrast, add text, remove background, apply filters, watermark, etc. → Use the tools below (Pillow, sharp, OpenCV).
2. **Generate a new AI image** — create something from scratch or heavily reimagine the photo (e.g., "make this photo look like a painting," "put me on a beach," "create a logo from this concept"). → Use image generation tools instead, not this skill.

### When to ask

- "Can you fix this photo?" → Probably editing. Ask what specifically needs fixing.
- "Make this look better" → Ambiguous. Ask: "Do you want me to adjust the existing photo (brightness, contrast, cropping, etc.) or generate a new version with AI?"
- "Change the background" → Could be either. Ask: "Should I remove the current background (I can make it transparent or a solid color), or do you want an AI-generated scene behind you?"
- "Make a profile picture from this" → Likely crop/resize, but could mean AI enhancement. Clarify.

#### Don't ask when it's obvious

- "Crop this to 1080x1080" → Just crop it.
- "Make this a PNG" → Just convert it.
- "Remove the background" → Use rembg.
- "Generate a photo of a sunset" → No existing photo to edit — use image generation.

## Tool Selection

| Tool | Use when | Install |
|---|---|---|
| **Pillow** | Default: resize, crop, filters, text, format conversion | `pip install Pillow` |
| **OpenCV** | Computer vision: face detection, perspective transform, inpainting, contours | `pip install opencv-python numpy` |
| **sharp** (Node) | High-volume pipelines — 4-5x faster than Pillow (libvips-backed) | `npm install sharp` |
| **rembg** | AI background removal | `pip install rembg` |
| **ImageMagick** | CLI batch ops, 200+ formats. Use the `magick` command, e.g. `magick -size 100x100 xc:blue test2.jpg`. | `apt install imagemagick` |

## Specialized Tasks

Read the matching reference before starting one of these tasks:

- [references/face-aware-cropping.md](references/face-aware-cropping.md) — read for portraits, headshots, or profile pictures, to detect the face with OpenCV and crop around it instead of guessing coordinates.
- [references/watermark-removal.md](references/watermark-removal.md) — read before removing a watermark or logo; it covers locating the watermark, masking, `cv2.inpaint()`, and verifying the result.
- [references/text-and-overlays.md](references/text-and-overlays.md) — read when adding captions, centered text, or a semi-transparent logo watermark with Pillow.
- [references/sharp-opencv-numpy.md](references/sharp-opencv-numpy.md) — read when using sharp in Node, OpenCV directly, or numpy to change many pixels at once.

## Open — ALWAYS Fix Orientation First

```python
from PIL import Image, ImageOps

img = Image.open("photo.jpg")
img = ImageOps.exif_transpose(img)  # CRITICAL: applies EXIF rotation, then strips tag
# Without this, phone photos appear sideways after processing
```

## Resize & Crop

```python
from PIL import Image, ImageOps

# --- Fit inside box, keep aspect ratio (shrink only) ---
img.thumbnail((1080, 1080), Image.Resampling.LANCZOS)  # modifies in place

# --- Exact size, keep aspect, center-crop overflow (best for thumbnails) ---
thumb = ImageOps.fit(img, (300, 300), Image.Resampling.LANCZOS, centering=(0.5, 0.5))

# --- Exact size, keep aspect, pad with color (letterbox) ---
padded = ImageOps.pad(img, (1920, 1080), color=(0, 0, 0))

# --- Exact size, ignore aspect (will distort) ---
stretched = img.resize((800, 600), Image.Resampling.LANCZOS)

# --- Scale by factor ---
half = img.resize((img.width // 2, img.height // 2), Image.Resampling.LANCZOS)

# --- Manual crop (left, upper, right, lower) — NOT (x, y, w, h) ---
cropped = img.crop((100, 50, 900, 650))
```

**Resampling filters:** `LANCZOS` for photo downscale (best quality), `BICUBIC` for upscale, `NEAREST` for pixel art/icons (no smoothing).

## Color & Exposure

```python
from PIL import ImageEnhance, ImageOps

# --- Enhancers: 1.0 = unchanged, <1 less, >1 more ---
img = ImageEnhance.Brightness(img).enhance(1.15)
img = ImageEnhance.Contrast(img).enhance(1.2)
img = ImageEnhance.Color(img).enhance(1.1)  # saturation
img = ImageEnhance.Sharpness(img).enhance(1.5)

# --- Quick ops ---
gray = ImageOps.grayscale(img)
inverted = ImageOps.invert(img.convert("RGB"))
auto = ImageOps.autocontrast(img, cutoff=1)  # stretch histogram, clip 1% extremes
equalized = ImageOps.equalize(img)  # flatten histogram
```

## Filters

```python
from PIL import ImageFilter

img.filter(ImageFilter.GaussianBlur(radius=5))
img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))  # better than SHARPEN
img.filter(ImageFilter.BoxBlur(10))
img.filter(ImageFilter.FIND_EDGES)
img.filter(ImageFilter.MedianFilter(size=3))  # denoise, removes salt-and-pepper
```

## Save & Optimize

```python
# --- JPEG ---
img.convert("RGB").save("out.jpg", quality=85, optimize=True, progressive=True)
# convert("RGB") REQUIRED if source has alpha — JPEG can't store transparency

# --- PNG (lossless — quality param does nothing) ---
img.save("out.png", optimize=True, compress_level=9)

# --- WebP (best web format: ~30% smaller than JPEG at same quality) ---
img.save("out.webp", quality=85, method=6)  # method 0-6, 6=slowest/best compression

# --- AVIF (smallest files, Pillow 11+, slower encode) ---
img.save("out.avif", quality=75)  # 75 ≈ JPEG 85 visually, ~50% smaller

# --- Strip all metadata (privacy) ---
clean = Image.new(img.mode, img.size)
clean.putdata(list(img.getdata()))
clean.save("stripped.jpg", quality=85)
```

**Quality guide:** JPEG/WebP 85 = sweet spot. 90+ = diminishing returns. <70 = visible artifacts. Never re-save JPEGs repeatedly — each save degrades (generation loss).

## Batch Processing

```python
from pathlib import Path
from PIL import Image, ImageOps

out = Path("optimized"); out.mkdir(exist_ok=True)
for p in Path("photos").glob("*.[jJ][pP]*[gG]"):  # matches jpg, jpeg, JPG, JPEG
    img = ImageOps.exif_transpose(Image.open(p))
    img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
    img.convert("RGB").save(out / f"{p.stem}.webp", quality=85, method=6)
```

## Bulk Pixel Changes — Use numpy, Not getpixel/putpixel

**Never loop over pixels with `getpixel()`/`putpixel()`** for large regions — it is extremely slow (minutes for a full image). Convert to a numpy array, operate on the array, then convert back. See [references/sharp-opencv-numpy.md](references/sharp-opencv-numpy.md) for array examples.

## Platform Dimensions

| Platform | Size | Ratio |
|---|---|---|
| Instagram post | 1080x1080 | 1:1 |
| Instagram story / TikTok | 1080x1920 | 9:16 |
| LinkedIn profile photo | 400x400 | 1:1 |
| LinkedIn banner | 1584x396 | 4:1 |
| LinkedIn post | 1200x627 | 1.91:1 |
| Twitter/X profile | 400x400 | 1:1 |
| Twitter/X post | 1200x675 | 16:9 |
| Facebook profile | 320x320 | 1:1 |
| Facebook cover | 851x315 | 2.7:1 |
| YouTube thumbnail | 1280x720 | 16:9 |
| WhatsApp profile | 500x500 | 1:1 |
| Open Graph (link preview) | 1200x630 | 1.91:1 |

## Debug Workflow

When edits don't look right, follow this process instead of re-running the whole pipeline blindly:

1. **Save a debug crop of the target area** before and after processing. View both to confirm what changed.
2. **Work at full resolution first.** Watermarks and artifacts that look small in a thumbnail can be large at native resolution. Always inspect at the original size before resizing.
3. **Save intermediate results.** After each major processing step (watermark removal, crop, resize), save a checkpoint image so you can identify which step introduced a problem.
4. **Spot-check specific pixels** to verify processing took effect:

```python
# Quick pixel check after watermark removal
for (x, y) in [(60, 50), (200, 130), (400, 100)]:
    print(f"({x},{y}): {img.getpixel((x, y))}")
# If these still show watermark colors (e.g. bright blue), removal failed
```

## Gotchas

- **`img.crop()` box is `(left, top, right, bottom)`** — absolute coords, NOT `(x, y, width, height)`
- **`thumbnail()` mutates in place and returns `None`** — don't do `img = img.thumbnail(...)`
- **Paste with transparency** needs the image as the third (mask) arg: `bg.paste(fg, pos, fg)`
- **Palette mode ("P")** breaks many filters — `img.convert("RGB")` first
- **Fonts:** `ImageFont.truetype` needs a real font file. Linux: `/usr/share/fonts/truetype/dejavu/`. Ship a `.ttf` with your code for portability.
- **OpenCV needs numpy** — always `pip install opencv-python numpy` together
- **OpenCV uses BGR, Pillow uses RGB** — convert when switching between them or colors will be wrong
