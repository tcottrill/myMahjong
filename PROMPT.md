# Recreating My Mahjong with Claude

This document is a self-contained project brief. Paste the entire contents (everything below the line) into [claude.ai](https://claude.ai) — or any capable LLM — and you should get back a working, single-file implementation of My Mahjong that matches the version in this repository.

Tested with Claude Sonnet 4.6+ and Opus 4.7. For best results, request the file in one shot rather than in parts; the model will keep the HTML, CSS, JavaScript, embedded SVGs, and base64 images coherent across the whole document.

If you want to use different tile artwork or backgrounds, swap them in after the model produces the file — see the **Asset pipeline** section at the end.

---

## Project: My Mahjong — a single-file Mahjong solitaire PWA

Build a complete, production-quality Mahjong solitaire game in a **single `index.html` file** with no build step, no server, no external dependencies, and no network calls after page load. The game must look and feel like the classic Mahjong solitaire that ships with every operating system: a 3-D pile of tiles where the player matches identical free tiles to clear the board.

The entire game — HTML markup, CSS, JavaScript, **all 44 tile graphics** (as inline SVGs), the **logo** (as an inline SVG), and **five nature background photos** (as base64-encoded JPEGs) — must live in one file. No `fetch`, no XHR, no service workers required for gameplay.

### Target platforms

- iPhone Safari 16.4+ (primary). Portrait orientation. Add-to-Home-Screen as a PWA.
- Android Chrome (secondary). Same PWA install flow.
- Desktop Chrome / Edge / Firefox (tertiary, mostly for playtesting).

The layout is mobile-first portrait. The whole board, including all four layout shapes, must fit within a ~390 × 844 px viewport without scrolling.

---

## Game rules

Mahjong solitaire (not the four-player game). 144 standard tiles arranged in a 3-D pile.

**A tile is "free" when:**
1. No tile is sitting directly on top of it (no tile at `z + 1` with `|Δx| < 2` AND `|Δy| < 2`).
2. At least one of its left or right neighbours at the same `z` is missing (a tile at the *same* `z` with the same `y` (within ±1) blocks the side if it sits at `x ± 2`).

**A pair matches** when:
- Standard tiles: same suit (`bamboo` / `char` / `dot`) **and** same value (1–9), **or** same wind (E/S/W/N), **or** same dragon (red/green/white).
- **Flowers all match each other** (any flower with any flower).
- **Seasons all match each other** (any season with any season).

**Player wins** when every tile has been removed.

**Player is deadlocked** when at least one active tile remains but no matching pair of currently-free tiles exists.

### Tile counts

The full deck is 144 tiles:

- **Suits** (3 × 9 = 27 unique faces × 4 each = 108 tiles): `bamboo 1-9`, `char 1-9` (characters / 万), `dot 1-9` (circles / 筒)
- **Winds** (4 × 4 = 16 tiles): East (Ton 東), South (Nan 南), West (Shaa 西), North (Pei 北)
- **Dragons** (3 × 4 = 12 tiles): Red (Chun 中), Green (Hatsu 發), White (Haku 白)
- **Flowers** (4 × 1 = 4 tiles): plum, orchid, chrysanthemum, bamboo
- **Seasons** (4 × 1 = 4 tiles): spring, summer, autumn, winter

Total: 34 standard faces × 4 + 8 bonus = 144.

For layouts shorter than 144 tiles, slice the deck — the shuffle just uses fewer tiles.

### Solvable-board generation (critical)

Naive pair-assignment (force every pair `tile[i+1] = copy(tile[i])` then shuffle) does NOT guarantee solvability — the topology of stacks can lock you out. Generate solvable boards using **reverse-removal simulation**:

```
function generateRemovalSequence(layout):
    present = set of all position indices
    sequence = []
    while present.size >= 2:
        free = positions in present where isFreeAmong(pos, present)
        if free.size < 2: return null   # retry
        pick 2 random positions a, b from free
        sequence.push([a, b])
        present.remove(a, b)
    return sequence  # length = layout.length / 2

function initGame:
    sequence = retry generateRemovalSequence up to 30 times
    bag = shuffle(fullDeck).slice(layout.length), then force-pair adjacent indices
    for each posPair in sequence at index i:
        face = bag[i * 2]
        tiles[posPair[0]].suit/val = face
        tiles[posPair[1]].suit/val = face
```

Because the sequence is a valid removal order, the resulting board has a known solution. Greedy random selection succeeds on the first try in >99% of cases for the layouts in this game.

---

## Layouts (all portrait-shaped)

Each tile position is `{ x, y, z }`. The grid unit is **half a tile**: tile positions advance by 2 units between adjacent tiles, the tile sprite renders at 2 units wide × 2.8 units tall, and the z-stack offset shifts a tile up & left by `0.4 * z` units. Each layout's tile count must be even (so pairs work).

### Turtle — 144 tiles

```
Layer 0 (78 tiles):
  Main grid 8 cols × 9 rows: x ∈ {2,4,…,16}, y ∈ {2,4,…,18}     → 72
  Ears (half-row offset):   (0,9), (0,11), (18,9), (18,11)       →  4
  Head:                     (8,0), (10,0)                         →  2

Layer 1 (42 tiles):
  6×7 grid: x ∈ {4,6,…,14}, y ∈ {4,6,…,16}                       → 42

Layer 2 (16 tiles):
  4×4 grid: x ∈ {6,8,10,12}, y ∈ {6,8,10,12}                     → 16

Layer 3 (6 tiles):
  2 cols × 3 rows: x ∈ {8,10}, y ∈ {7,9,11}                       →  6

Layer 4 (2 tiles):
  Apex: (9,8), (9,10)                                             →  2
```

### Pyramid — 120 tiles

```
Layer 0: 8×8 = 64    x ∈ {2,4,…,16}, y ∈ {2,4,…,16}
Layer 1: 6×6 = 36    x ∈ {4,6,…,14}, y ∈ {4,6,…,14}
Layer 2: 4×4 = 16    x ∈ {6,8,10,12}, y ∈ {6,8,10,12}
Layer 3: 2×2 =  4    x ∈ {8,10}, y ∈ {8,10}
```

### Dragon — 140 tiles

```
Layer 0:
  Body 4×12 = 48     x ∈ {4,6,8,10}, y ∈ {2,4,…,24}
  Head fan 6×1 =  6   x ∈ {2,4,…,12}, y = 0
  Tail fan 6×1 =  6   x ∈ {2,4,…,12}, y = 26
  Scales L  4   x = 2,  y ∈ {7,11,15,19}    (half-row offset)
  Scales R  4   x = 12, y ∈ {7,11,15,19}

Layer 1: 4×10 = 40   x ∈ {4,6,8,10}, y ∈ {4,6,…,22}
Layer 2: 2×8  = 16   x ∈ {6,8},      y ∈ {6,8,…,20}
Layer 3: 2×6  = 12   x ∈ {6,8},      y ∈ {8,10,…,18}
```

### Simple — 72 tiles

```
Layer 0: 6×8 = 48    x ∈ {4,6,…,14}, y ∈ {2,4,…,16}
Layer 1: 4×4 = 16    x ∈ {6,8,10,12}, y ∈ {6,8,10,12}
Layer 2: 2×4 =  8    x ∈ {8,10},      y ∈ {6,8,10,12}
```

---

## Visual design

### Colour palette

| Role | Value |
| --- | --- |
| Page background base | `#0a2615` (deep forest) |
| Felt overlay (no-bg states) | `rgba(0, 30, 10, 0.4)` |
| Bg dim overlay (PLAY state) | `rgba(0, 15, 5, 0.55)` |
| Body text | `#fdf6e3` (parchment) |
| Subtle text | `#cdb88a` |
| Accent gold | `#fdd835` |
| Tile face top | `#fffaeb` (FluffyStuff fronts use their own gradients — keep them) |
| Tile face bottom | `#e8d9b2` |
| Tile side (bevel) | `#cdb88a` → `#7a6033` |
| Selection scale-up | gold border, scale up to 1.06 with subtle breathing |
| Hint pulse | `rgba(255, 193, 7, …)` pulsing border, 1.8 s duration |
| Ghost (matched) glow | `rgba(255, 220, 100, 0.7)` fading |
| Layout button — Turtle | `#1565c0` (blue) |
| Layout button — Pyramid | `#e65100` (orange) |
| Layout button — Dragon | `#c62828` (red) |
| Layout button — Simple | `#2e7d32` (green) |
| In-game HINT button | `#0277bd` |
| In-game SHUFFLE button | `#555` |
| In-game UNDO button | `#6a1b9a` (active) / `#3a2050` (empty stack) |
| In-game QUIT button | `#d32f2f` |
| Dialog background | `#1a3a25` with `#fdd835` 2 px border |

### Typography

- All UI text: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` for buttons and HUD.
- Headings inside SVG logo / dialogs: `Georgia, "Times New Roman", serif`.
- Logo wordmark: `Georgia` 116 px bold, letter-spacing 6 px, gold gradient fill with dark stroke for outline, plus drop shadow.

### Whole-page layout

- `<body>` and `<html>`: `margin:0`, `overflow:hidden`, `touch-action: none`, `user-select: none`, `-webkit-tap-highlight-color: transparent`.
- Single full-window `<canvas id="gameCanvas">` sized to `window.innerWidth × window.innerHeight`. Re-size on `resize` and `orientationchange`.
- Behind the canvas in z-order: nothing — the canvas paints everything including the rotating nature background as the first thing in `draw()`.

### Tile rendering on canvas

Each tile renders inside a `2*scale` wide × `2.8*scale` tall rounded-rect:

1. **Side (3-D bevel)**: solid `#8a7649` rounded-rect at `(px + 0.18*scale, py + 0.18*scale)`.
2. **Drop shadow under tile**: `rgba(0,0,0,0.35)` rounded-rect at `(px + 0.36*scale, py + 0.36*scale)`.
3. **Tile face**: draw `TILE_IMAGES['Front']` (the FluffyStuff Front.svg loaded as an Image) at `(px, py, tileW, tileH)`. If not yet loaded, fall back to `#fdf6e3` rounded-rect.
4. **Glyph**: draw `TILE_IMAGES[spriteName(suit, val)]` inset by `(0.10 * tileW, 0.08 * tileH)`. The `spriteName` function maps:

   ```
   bamboo N → "Sou{N}"
   char N   → "Man{N}"
   dot N    → "Pin{N}"
   wind N   → ["Ton", "Nan", "Shaa", "Pei"][N-1]
   dragon N → ["Chun", "Hatsu", "Haku"][N-1]   // red, green, white
   flower N → "Flower{N}"
   season N → "Season{N}"
   ```

5. **Selection state**: when `t.selected`, draw a 35%-opacity gold fill over the tile and a 3 px `#fdd835` border. Apply a scale transform (see Animations below).
6. **Blocked state** (only if `showFreeTiles` toggle is on): when `!isFree(t)`, draw a 22% black overlay.
7. **Hint highlight** (when tile is in `hintTiles`): pulsing gold border 4 px wide, `rgba(255,193,7, 0.6 + 0.4 * pulse * alpha)` where `pulse = 0.5 + 0.5 * sin(now / 120)` and `alpha = clamp((hintExpires - now) / 600, 0, 1)`.
8. **Outer border**: `rgba(80, 60, 30, 0.5)` 1 px stroke around the rounded-rect.

Tiles are drawn back-to-front sorted by `(z, y, x)` ascending so closer tiles overlay farther ones.

---

## Tile artwork (the inline SVG sprite)

A hidden `<svg id="tile-sprite" style="position:absolute;width:0;height:0;overflow:hidden">` block at the top of `<body>` holds:

1. A **logo** `<svg id="logo" viewBox="0 0 900 320">` (described below).
2. **36 FluffyStuff tile graphics** as child `<svg id="…">` elements. Use the public-domain SVGs from [https://github.com/FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (Regular subfolder). You need: `Front`, `Back`, `Man1-9`, `Pin1-9`, `Sou1-9`, `Ton`, `Nan`, `Shaa`, `Pei`, `Chun`, `Haku`, `Hatsu`.
3. **8 custom flower & season tiles** as child SVGs. Use the same `viewBox="0 0 300 400"` so they line up with the FluffyStuff fronts.

### Important: namespace internal SVG IDs

The FluffyStuff SVGs use named gradients / clip-paths / markers referenced via `url(#…)`. When you combine many SVGs in one document, the IDs collide. **Prefix every internal ID with the tile name** (e.g. `Front_linearGradient10055`) **and** rewrite every `url(#xxx)` and `href="#xxx"` reference in lockstep. A Python script that strips Inkscape namespace junk and rewrites IDs is the easiest approach.

### Custom flower & season tiles

```
function flower_svg(N, id, color):
    <svg id="{id}" viewBox="0 0 300 400">
      <g transform="translate(150,200)">
        <circle r="100" fill="none" stroke="{color}" stroke-width="8"/>
        <circle cx="0"  cy="-62" r="28" fill="{color}"/>
        <circle cx="60" cy="-18" r="28" fill="{color}"/>
        <circle cx="37" cy="52"  r="28" fill="{color}"/>
        <circle cx="-37" cy="52" r="28" fill="{color}"/>
        <circle cx="-60" cy="-18" r="28" fill="{color}"/>
        <circle cx="0" cy="0" r="18" fill="#f4b400"/>
        <text x="0" y="148" text-anchor="middle" font-family="Georgia, serif"
              font-size="64" font-weight="bold" fill="{color}">{N}</text>
      </g>
    </svg>

function season_svg(N, id, color, glyph):
    <svg id="{id}" viewBox="0 0 300 400">
      <g transform="translate(150,200)">
        <rect x="-100" y="-130" width="200" height="190" rx="16"
              fill="none" stroke="{color}" stroke-width="8"/>
        <text x="0" y="30" text-anchor="middle" font-family="Georgia, serif"
              font-size="170" font-weight="bold" fill="{color}">{glyph}</text>
        <text x="0" y="148" text-anchor="middle" font-family="Georgia, serif"
              font-size="64" font-weight="bold" fill="{color}">{N}</text>
      </g>
    </svg>

Flowers (id, color):
  Flower1 #c2185b   (plum, pink/red)
  Flower2 #7b1fa2   (orchid, purple)
  Flower3 #f9a825   (chrysanthemum, yellow)
  Flower4 #2e7d32   (bamboo, green)

Seasons (id, color, glyph):
  Season1 #1565c0  "Sp"   (Spring blue)
  Season2 #c62828  "Su"   (Summer red)
  Season3 #ef6c00  "Au"   (Autumn orange)
  Season4 #37474f  "Wi"   (Winter slate)
```

(Use ASCII labels for the seasons rather than CJK characters — guarantees they render consistently when rasterized into an `Image` from a Blob URL across all platforms.)

### Loading tiles for canvas

On boot:

```js
const host = document.getElementById('tile-sprite');
const tileEls = host.querySelectorAll(':scope > svg[id]');
const serializer = new XMLSerializer();
for (const el of tileEls) {
    const clone = el.cloneNode(true);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([serializer.serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = ...; img.onerror = ...;
    img.src = url;
    TILE_IMAGES[el.id] = img;
}
await Promise.all(...);  // resolve before switching state from LOADING to MENU
```

This works from `file://` (no fetch needed) which is why the inline approach matters.

---

## Logo

The logo is `<svg id="logo" viewBox="0 0 900 320">` containing:

- **Definitions block**: `linearGradient logo_gold` (4-stop `#fff3b0` → `#f4c75e` → `#c89132` → `#8a5b16`); `linearGradient logo_tileFace` (`#fffaeb` → `#e8d9b2`); `linearGradient logo_tileSide` (`#cdb88a` → `#7a6033`); `filter logo_shadow` with `feDropShadow dx=0 dy=6 stdDeviation=6 flood-color=#000 flood-opacity=0.55`.
- **Left tile**: `<g transform="translate(40,40) rotate(-14 90 90)" filter="url(#logo_shadow)">` with a tile side path + face rect (rx=18) + red `中` character at font-size 150 fill `#b71c1c`.
- **Right tile**: same shape, `translate(686,40) rotate(14 90 90)`, green `發` character fill `#2e7d32`.
- **Wordmark**: `<text x="450" y="158" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="116" font-weight="bold" letter-spacing="6" stroke="#3d1a05" stroke-width="6" paint-order="stroke" fill="url(#logo_gold)">MAHJONG</text>` inside the shadow filter.
- **Flourish underline**: a small `transform="translate(450,260)"` group: thin gold bar 300 px wide with two dots at the ends and a diamond shape in the middle.
- **Subtitle**: `<text x="450" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" letter-spacing="3" fill="#cdb88a">CLASSIC SOLITAIRE</text>`.

ViewBox must be tall enough (320) to contain the rotated tile bottoms — rotation around `(90,90)` makes the bottom-left corner of the left tile swing down to y≈278.

On the menu, the logo is sized to `min(width - 32, 380)` wide, pinned to `y = max(20, height * 0.06)`, with buttons positioned `max(26, height * 0.10)` below it.

---

## Backgrounds (the rotating nature scenes)

Five JPEGs embedded as base64 data URIs in a `const BG_URLS = [...]` array. Suggested scenes:

1. Misty forest path with sunbeams
2. Lotus blossom on a pond
3. Waterfall over mossy stones
4. Misty blue mountain layers at dawn
5. Mt. Fuji + Japanese pagoda at sunset

Source from Unsplash (free), resize to max 1280 px on the long edge, compress to JPEG quality ~68 with `-strip -interlace JPEG`. Target ~80–230 KB each, ~550 KB raw total → ~735 KB as base64.

```js
const BG_URLS = ['data:image/jpeg;base64,…', '…', …];
const BG_IMAGES = BG_URLS.map(url => { const img = new Image(); img.src = url; return img; });
let currentBg = null;
function pickRandomBg() { return BG_IMAGES.length ? BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)] : null; }
```

`currentBg` is set in `initGame()` (a new game picks a fresh one) and in `shuffleBoard()` (a shuffle picks another fresh one — visual surprise to match the tile re-shuffle).

Render with **object-fit: cover** behaviour:

```js
function drawImageCover(img, dx, dy, dw, dh) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const targetAr = dw / dh, ar = iw / ih;
    let sw, sh, sx, sy;
    if (ar > targetAr) { sh = ih; sw = ih * targetAr; sx = (iw - sw) / 2; sy = 0; }
    else               { sw = iw; sh = iw / targetAr; sx = 0; sy = (ih - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
```

Drawing rule in `draw()`:

```js
const inGameState = state === 'PLAY' || state === 'DEADLOCK' || state === 'CONFIRM_QUIT' || state === 'WIN';
if (inGameState && !disableBackgrounds && currentBg && (currentBg.complete || currentBg.naturalWidth)) {
    drawImageCover(currentBg, 0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 15, 5, 0.55)';   // darker overlay for tile readability
    ctx.fillRect(0, 0, width, height);
} else {
    ctx.fillStyle = 'rgba(0, 30, 10, 0.4)';
    ctx.fillRect(0, 0, width, height);
}
```

The MENU keeps the dark felt look — no background image on the menu.

---

## Board sizing & centering

The crucial bit that's easy to get wrong: when a layout doesn't start at `x=0` / `y=0`, the "empty" left/top columns must not count toward the layout's bounding box.

```js
function layoutBounds(layout) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const p of layout) {
        const lx = p.x - p.z * 0.4;       // top-left of rendered tile
        const ty = p.y - p.z * 0.4;
        if (lx < l) l = lx;
        if (ty < t) t = ty;
        if (lx + 2   > r) r = lx + 2;     // 2 = tile width in grid units
        if (ty + 2.8 > b) b = ty + 2.8;   // 2.8 = tile height in grid units
    }
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
}
```

Version 1.1 uses device safe-area insets instead of fixed top/bottom padding.
Read all four `env(safe-area-inset-*)` values through the computed padding of a
hidden, fixed, non-interactive DOM element on every resize. Use zero as fallback.
Keep the canvas full-screen and scrolling disabled. Share the board rectangle
between scaling and centering:

```js
function getBoardRect() {
    const buttons = getGameButtonRects();
    const x = safeArea.left + 8;
    const y = buttons.quit.y + buttons.quit.h + 8;
    return {
        x, y,
        w: Math.max(1, width - x - safeArea.right - 8),
        h: Math.max(1, buttons.hint.y - 12 - y),
    };
}
```

Compute scale & offsets:

```js
function resize() {
    // Refresh safeArea from the hidden element's computed padding first.
    canvas.width  = width  = window.innerWidth;
    canvas.height = height = window.innerHeight;
    const bb = layoutBounds(activeLayout());
    const board = getBoardRect();
    scale = Math.min(board.w / bb.width, board.h / bb.height);
    draw();
}

function getLayoutOffsets() {
    const bb = layoutBounds(activeLayout());
    const visualW = bb.width  * scale;
    const visualH = bb.height * scale;
    const board = getBoardRect();
    const offsetX = board.x + (board.w - visualW) / 2 - bb.left * scale;
    const offsetY = board.y + (board.h - visualH) / 2 - bb.top * scale;
    return { offsetX, offsetY };
}

// Per-tile render position:
//   px = offsetX + t.x * scale - t.z * 0.4 * scale
//   py = offsetY + t.y * scale - t.z * 0.4 * scale
```

The `bb.left * scale` and `bb.top * scale` subtractions are essential — they shift the centered start back so the *actual leftmost tile* lands at the centered position, not the imaginary `x=0` anchor.

---

## Menu screen

Vertical stack from top:

1. **Logo** — banner SVG image (see Logo section above).
2. **Four layout buttons** in a column (Turtle, Pyramid, Dragon, Simple), each 220 × 52 px with their distinct colours, separated by 12 px gaps.
3. **Three toggle rows** (each 36 px tall, 8 px gap between rows):
   - "Show free tiles" — bool, default false
   - "Disable backgrounds" — bool, default false
   - "Mute sounds" — bool, default false

Each toggle renders as a checkbox-style square (sized `h - 6`) on the left, filled `#4CAF50` with a white checkmark when on, outlined `#cdb88a` when off. A 16 px label sits to the right of the box, click anywhere in the row toggles it.

All three toggle states persist in `localStorage` (`mahjong.showFreeTiles`, `mahjong.disableBackgrounds`, `mahjong.muteSounds`).

```js
function getMenuRects() {
    const logoMaxW = 380;
    const logoW = Math.min(width - 32, logoMaxW);
    const logoH = logoW * (320 / 900);
    const logoY = Math.max(20, height * 0.06);
    const logoX = (width - logoW) / 2;
    const btnW = 220, btnH = 52, gap = 12;
    const togH = 36, togGap = 22;
    const btnsTop = logoY + logoH + Math.max(26, height * 0.10);
    // ... returns rects for logo, 4 layout buttons, 3 toggles
}
```

---

## In-game UI

### Top strip

- **QUIT button** at `(safeArea.left + 20, safeArea.top + 6, 90, 38)` — red `#d32f2f`, font size 16.
- **HUD pill** immediately to the right of QUIT, same height, extending to `width - safeArea.right - 20` with 12 px gap from QUIT. `rgba(0,0,0,0.45)` fill, `rgba(253,246,227,0.18)` 1 px border, rounded 8 px corners. Inside:
  - Left-aligned `m:ss` time string at 16 px Arial 600.
  - Right-aligned `matches / totalPairs` counter (e.g. `18 / 72`).

HUD updates once per second via a `setInterval` that only redraws when `state === 'PLAY'`. The timer is `Math.floor((performance.now() - gameStartTime) / 1000)`.

### Bottom button row

Three buttons centered horizontally within the safe width — `HINT | SHUFFLE | UNDO` — sized to `min(width - safeArea.left - safeArea.right - 16, 360)` total width with two 8 px gaps between them. Their top is `height - safeArea.bottom - 8 - 48`. 48 px tall, 18 px font. UNDO is dimmed (`#3a2050`) when `undoStack.length === 0` and fully purple (`#6a1b9a`) otherwise.

### Tile interaction

- **First tap on free tile**: select it. `t.selected = true; t.selectedAt = performance.now(); selectedTile = t;` Play click sound.
- **Tap selected tile again**: deselect. Play click.
- **Tap a different free matching tile**:
  - Both `t1.active = false; t2.active = false`
  - `ghostTiles.push({tile: t1, partner: t2, startTime: now}); push({tile: t2, partner: t1, ...})`
  - `undoStack.push([t1, t2]); moves++;`
  - Play match chime
  - Start the animation loop
  - Check win → set state to `WIN`, play win arpeggio, stop timer
  - If not won, check deadlock (after the ghost fade completes — `setTimeout(450)`) → set state to `DEADLOCK`, play deadlock tone, redraw
- **Tap a different free non-matching tile**: deselect the old, select the new. Play click.
- **Tap a non-free tile**: nothing happens (consider adding a subtle "thunk" if desired).

---

## Animations

### Selection scale-up + breathing

```js
function getSelectionScale(t) {
    if (!t.selected || !t.selectedAt) return 1.0;
    const elapsed = performance.now() - t.selectedAt;
    const popIn = Math.min(1, elapsed / 140);
    const eased = 1 - Math.pow(1 - popIn, 3);   // ease-out cubic
    const base = 1.0 + 0.06 * eased;             // pop up to 1.06
    const breathe = 0.012 * Math.sin(elapsed / 240);
    return base + breathe;
}
```

Apply via `ctx.save(); translate(cx,cy); scale(s,s); translate(-cx,-cy);` around the tile body draw.

### Ghost (matched-pair fade-slide)

380 ms total. Each ghost slides outward away from its partner + lifts upward, grows ~18%, fades to 0 % alpha, with a brief gold glow border. Drawn *on top* of active tiles.

```js
function drawGhostTile(g, now, layoutX, layoutY, tileW, tileH) {
    const t = g.tile;
    const elapsed = now - g.startTime;
    const progress = Math.min(1, elapsed / 380);
    if (progress >= 1) return;
    const dxSign = Math.sign(t.x - g.partner.x) || 0;
    const eased = 1 - Math.pow(1 - progress, 3);
    const slide = scale * 0.55 * eased;
    const offX = dxSign * slide;
    const offY = -slide * 0.7;
    const alpha = 1.0 - progress;
    const gs = 1.0 + 0.18 * progress;
    // ... draw face + glyph at (px + offX, py + offY) with globalAlpha = alpha and scale gs around tile centre
    // ... draw gold glow border: rgba(255, 220, 100, 0.7 * (1 - progress))
}
```

### Hint pulse

When the player taps HINT, find any two currently-free tiles that match (any pair will do — first hit in a double-loop is fine). Set `hintTiles = [a, b]; hintExpires = now + 1800`. Each frame while `hintTiles` is set, the unified animation loop redraws and the per-tile renderer draws a pulsing gold border around hinted tiles:

```js
const pulse = 0.5 + 0.5 * Math.sin(now / 120);
const alpha = clamp((hintExpires - now) / 600, 0, 1);
ctx.strokeStyle = `rgba(255, 193, 7, ${0.6 + 0.4 * pulse * alpha})`;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(px - 2, py - 2, tileW + 4, tileH + 4, 8);
ctx.stroke();
```

### Unified animation loop

```js
let animRafId = null;
function hasActiveAnimations() {
    return !!(selectedTile || ghostTiles.length > 0 || hintTiles);
}
function ensureAnimLoop() {
    if (animRafId !== null) return;
    const tick = () => {
        const now = performance.now();
        if (hintTiles && now >= hintExpires) hintTiles = null;
        if (ghostTiles.length) ghostTiles = ghostTiles.filter(g => now - g.startTime < 380);
        if (!hasActiveAnimations()) { animRafId = null; draw(); return; }
        draw();
        animRafId = requestAnimationFrame(tick);
    };
    animRafId = requestAnimationFrame(tick);
}
```

Call `ensureAnimLoop()` whenever you start a new animation (selection, ghost, hint). The loop self-terminates when nothing's animating — no wasted frames on an idle board.

---

## Audio (WebAudio synthesis — no external files)

Lazily-created `AudioContext` on first user gesture:

```js
let audioCtx = null;
function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { return null; }
    return audioCtx;
}

function playTone(freq, dur, type='sine', vol=0.12, delay=0) {
    if (muteSounds) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
}
```

Sound recipes:

| Event | Recipe |
| --- | --- |
| `playClick` | `playTone(880, 0.05, 'square', 0.04)` |
| `playMatch` | `playTone(659.25, 0.18, 'sine', 0.10)` then 70 ms later `playTone(987.77, 0.24, 'sine', 0.08)` (E5 → B5 chime) |
| `playWin` | Ascending arpeggio `[523.25, 659.25, 783.99, 1046.50]` (C5 E5 G5 C6), each `playTone(f, 0.32, 'triangle', 0.13)` staggered by 120 ms |
| `playDeadlock` | `playTone(392, 0.4, 'sine', 0.08)` then 180 ms later `playTone(311.13, 0.5, 'sine', 0.08)` (G4 → Eb4 descending) |
| `playUndo` | `playTone(550, 0.10, 'triangle', 0.06)` |
| `playShuffle` | Three quick beeps: 700 → 900 → 700 Hz, sine, 0.05 vol, staggered by 50 ms |

---

## States & transitions

```
LOADING ──load tiles──▶ MENU ──pick layout──▶ PLAY ──match all──▶ WIN ──tap──▶ MENU
                                              │  │
                                              │  ├─ no legal pairs ─▶ DEADLOCK ──shuffle──▶ PLAY
                                              │  │                              └─ menu ─▶ MENU
                                              │  └─ QUIT mid-game ─▶ CONFIRM_QUIT ──cancel──▶ PLAY
                                              │                                  └─ quit ─▶ MENU
                                              └─ checkWin / checkDeadlock after every match
```

### LOADING

Plain "Loading tiles…" text centered on the felt background. Boot path:

```js
(async function boot() {
    resize(); draw();
    try {
        await loadTileSprites();   // serialize each <svg id=...> to Blob URL, load as Image, await all
        state = 'MENU';
        resize();
    } catch (err) {
        console.error(err);
        // draw an error message centered
    }
})();
```

### MENU

Logo + 4 layout buttons + 3 toggles, as described above.

### PLAY

The board + the HUD strip + the HINT / SHUFFLE / UNDO row + QUIT button + selected tiles + hint pulses.

### DEADLOCK

Renders board + UI underneath, then a dimmed overlay (`rgba(0,0,0,0.7)`) and a centered dialog (`min(width - 40, 320)` × 220 px) titled **"No moves available"** with subtitle "All remaining pairs are blocked." Two buttons stacked: green **SHUFFLE** and red **BACK TO MENU**. Sound: descending deadlock tone with a 350 ms delay so it doesn't step on the match chime.

### CONFIRM_QUIT

Same dialog skin (200 px tall, `min(width-40, 320)` wide): title **"Quit game?"** subtitle "Your progress will be lost." Two buttons side-by-side at the bottom: grey **CANCEL** and red **QUIT**. Track `preConfirmState` so cancel returns to whatever state was active (PLAY or DEADLOCK).

Trigger only on QUIT when a game's actually in progress:

```js
const inProgress = tiles.some(t => t.active) && (undoStack.length + moves) > 0;
if (inProgress) showQuitConfirm(); else { stopTimer(); state = 'MENU'; draw(); }
```

The DEADLOCK dialog's "BACK TO MENU" skips the confirm — game's already over.

### WIN

Board behind, full-screen dark overlay (`rgba(0,0,0,0.8)`), centered "YOU WIN!" 50 px bold, subtitle "Tap to play again" 20 px. Tap anywhere → state = MENU. Stop timer.

---

## PWA setup

Head tags:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>Classic Mahjong</title>

<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mahjong">
<meta name="theme-color" content="#0a2615">

<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="shortcut icon" href="favicon.ico">
<link rel="manifest" href="site.webmanifest">
```

`site.webmanifest`:

```json
{
  "name": "Classic Mahjong",
  "short_name": "Mahjong",
  "description": "Classic Mahjong solitaire — match identical tiles to clear the board.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a2615",
  "theme_color": "#0a2615",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## Icon design

Create `icon-master.svg` with `viewBox="0 0 512 512"`:

- Rounded-square background (`rx="96"`), `radialGradient` from `#1a5d2b` (center) to `#0a2615` (edge).
- Two stacked tiles in the centre, tilted at opposing angles:
  - Back tile slightly behind, rotated −6°, with a stylized bamboo glyph (four green sticks in `#1b5e20` with `#2e7d32` segment rings).
  - Front tile, rotated +8°, with a large `中` character in `#b71c1c` at font-size 220, Georgia serif.
- Both tiles use the same gradient-filled face and bevelled side.
- Subtle white-alpha gloss highlight in the top-right corner.

Generate PNGs from this SVG with ImageMagick (use `-density 600` for sharp output):

```sh
magick -background none -density 600 icon-master.svg -resize 512x512  icon-512.png
magick -background none -density 600 icon-master.svg -resize 192x192  icon-192.png
magick -background none -density 600 icon-master.svg -resize 180x180  apple-touch-icon.png
magick -background none -density 600 icon-master.svg -resize 167x167  apple-touch-icon-167x167.png
magick -background none -density 600 icon-master.svg -resize 152x152  apple-touch-icon-152x152.png
magick -background none -density 600 icon-master.svg -resize 32x32    favicon-32x32.png
magick -background none -density 600 icon-master.svg -resize 16x16    favicon-16x16.png
magick -background none -density 600 icon-master.svg -resize 32x32    favicon.ico
```

---

## Asset pipeline (for regeneration)

1. **Tile sprite**: Python script downloads the 36 needed FluffyStuff SVGs from their GitHub repo (Regular subfolder), strips Inkscape namespace junk and metadata, prefixes every internal `id` with the tile name (e.g. `Man1_path5527`), rewrites every `url(#…)` and `href="#…"` reference in lockstep, then concatenates each as a child `<svg id="…">` of a wrapper `<svg style="position:absolute;width:0;height:0">`. Append the 8 custom flower/season SVGs at the end. Write to `tiles.svg`.

2. **Embed tiles into index.html**: a second Python script reads `tiles.svg`, strips the outer wrapper, and writes the contents between marker comments inside `index.html`'s `<svg id="tile-sprite">` block. **Use a marker name that does NOT appear in any surrounding comment text** — otherwise the regex substitution lands in the wrong place.

3. **Backgrounds**: Pick 5 calming Asian-nature scenes from Unsplash. Resize with `magick "$src" -resize "1280x1280>" -quality 68 -strip -interlace JPEG out.jpg`. Base64-encode each: `base64.b64encode(open(p, 'rb').read()).decode('ascii')` and emit a JS array entry `'data:image/jpeg;base64,…'`. Substitute into `index.html` between a clean unique marker (use a different marker name from the tiles one).

4. **Icons**: Generate from `icon-master.svg` with the ImageMagick commands above.

---

## Implementation order

If you build this incrementally, this order minimises rework:

1. **HTML skeleton + canvas + felt background**. Resize handler. Empty `draw()` switch on `state`.
2. **Tile sprite block** with placeholder SVGs (or fetch a few from FluffyStuff). The boot loader and `TILE_IMAGES` map. `LOADING → MENU` transition.
3. **One layout (Turtle, 144 tiles)** + the deck + naive pair-forcing. `initGame`, `drawBoard`, `isFree`, `isMatch`. Click handling, selection, match removal, win detection.
4. **Layout bounds + centering** (the `layoutBounds` helper). Verify all four layouts centre correctly.
5. **Menu screen** with logo placeholder + four layout buttons + toggle template.
6. **Three settings toggles** (Show free tiles, Disable backgrounds, Mute sounds) with `localStorage`.
7. **Solvable-board generator** (replace naive pair-forcing).
8. **HINT, UNDO** buttons + `undoStack`.
9. **Deadlock detection** + CONFIRM_QUIT dialog.
10. **Backgrounds** (start with one, then bulk-embed five).
11. **Logo** SVG.
12. **Audio** (WebAudio synthesis).
13. **HUD strip** (timer + moves counter).
14. **Animations** (selection scale-up, ghost fade-slide, hint pulse, unified RAF loop).
15. **PWA tags + manifest + icons**.

Test on a real phone (iOS Safari + Android Chrome) before declaring done. The desktop preview misses touch-handling and viewport-fit edge cases.

---

## Definition of done

- Single `index.html` file plus a tiny set of icon files + `site.webmanifest`. No build step, no node_modules, no external CDN.
- Opens directly via `file://` in Chrome and works fully (board renders, plays, win and deadlock both reachable, sounds play, animations smooth).
- On a 390 × 844 px phone in portrait, the largest layout (Turtle, 144 tiles) fits with room for QUIT, HUD, and HINT/SHUFFLE/UNDO without the tiles overlapping any button.
- All four layouts (Turtle, Pyramid, Dragon, Simple) are reachable from the menu and centred properly on screen.
- Every generated board is winnable (test by undoing repeatedly back to the start — `findHint()` should never return null until the player removes a tile that wasn't matched in the planned sequence, and even then a shuffle plus new generator pass restores solvability).
- All three settings toggles persist across reloads.
- PWA installs cleanly on iOS Safari (Add to Home Screen) and Android Chrome (Install app), launches full-screen, runs offline.
