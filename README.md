# My Mahjong

A mobile-friendly Mahjong solitaire — match identical free tiles to clear the board. Built as a single self-contained `index.html` with no build step, no server, and no network calls after the first page load. The whole tileset, logo, and five soothing nature backgrounds are embedded inline.

**Play it now:** [https://tcottrill.github.io/myMahjong/](https://tcottrill.github.io/myMahjong/)

Four classic layouts (Turtle, Pyramid, Dragon, Simple), provably solvable boards, hint and undo, deadlock detection, animated tile selection and fade-out matches, synthesized sound effects, and a rotating nature scene behind each game. It is also a Progressive Web App (PWA), so you can pin it to your iPhone, Android, or desktop and play it like a native app, full-screen and offline.

## Free and open

This project is released into the **public domain** under the [Unlicense](LICENSE). It is **100% free**:

- No purchase, subscription, or in-app payment.
- No ads, no trackers, no analytics.
- No account or sign-in.
- No network calls — once the page is loaded, the game runs entirely on your device.

You may copy, modify, redistribute, or sell it for any purpose.

## How to play

Mahjong solitaire is a matching puzzle, not the four-player game it shares a name with. The 144 tiles (or fewer, depending on the layout) are stacked into a 3-D pile. Your job is to remove every tile by pairing identical faces.

- **Tap a free tile** to select it. A tile is *free* if no tile is sitting on top of it **and** at least one of its left or right neighbours at the same layer is missing.
- **Tap a second matching tile** to remove the pair. Standard tiles match exactly (same suit, same number). Flowers all match each other; seasons all match each other.
- Clear the entire board to win.

### Layouts

Pick one from the menu — each is a different 3-D shape:

| Layout | Tiles | Feel |
| --- | --- | --- |
| **Turtle** | 144 | Classic shell with ears and head/tail accents |
| **Pyramid** | 120 | Square stepped pyramid, no overhangs |
| **Dragon** | 140 | Long, narrow body with crown ridge and head/tail fans |
| **Simple** | 72 | Flat-ish three-layer rectangle, fast play |

Every board is **provably solvable**. The board generator simulates removing the tiles in pairs in advance, so a valid winning sequence is guaranteed to exist.

### In-game controls

| Button | What it does |
| --- | --- |
| **HINT** | Pulses a gold border on any one currently-matchable pair |
| **SHUFFLE** | Re-randomises the remaining tile faces and picks a fresh background |
| **UNDO** | Restores the last matched pair (greyed out when there's nothing to undo) |
| **QUIT** | Opens a confirm dialog mid-game; goes straight to menu otherwise |

A small HUD strip in the top-right shows elapsed time (`m:ss`) and progress (`matches / total`).

### Settings (menu toggles)

- **Show free tiles** — dim blocked tiles so only legal ones are at full brightness. Off by default (the classic Mahjong puzzle is partly figuring out which tiles are free).
- **Disable backgrounds** — fall back to the dark felt look if the rotating nature scenes are distracting.
- **Mute sounds** — silence the click / match-chime / win-arpeggio sound effects.

Each setting is remembered in `localStorage` across visits.

### Deadlock detection

If you make a match that leaves no legal pairs anywhere on the board, the game pops a *"No moves available"* dialog with a **SHUFFLE** or **BACK TO MENU** option. You'll never sit there clicking and wondering why nothing happens.

## Install on your iPhone (pin to home screen)

Because it is a PWA, you can add the game to your home screen and launch it like any other app — full-screen, no Safari address bar.

1. On your iPhone, open **Safari** (this only works in Safari — not Chrome or Firefox on iOS) and navigate to [https://tcottrill.github.io/myMahjong/](https://tcottrill.github.io/myMahjong/).
2. Tap the **Share** button (the square with the up arrow) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name (it will default to "Mahjong") and tap **Add** in the top-right.

A "Mahjong" icon now appears on your home screen. Tap it to launch the game full-screen — it will look and feel like a native app, with no browser chrome.

### Notes (iPhone)

- iOS requires the page be loaded over **HTTPS** for the home-screen app to launch in standalone mode. The GitHub Pages URL above is HTTPS, so it works out of the box.
- The icon and splash background use the `apple-touch-icon.png` and theme colour already configured in `index.html` and `site.webmanifest`.
- To remove the app, long-press the icon on the home screen and choose **Remove App → Delete Bookmark**.

## Install on your Android phone (pin to home screen)

Yes — Android supports the same PWA install flow, and on Android it produces an even more app-like result: the game installs through the system's WebAPK mechanism, gets its own entry in the app drawer, and runs in its own window without any browser UI.

### Chrome (recommended)

1. Open **Chrome** on your Android phone and go to [https://tcottrill.github.io/myMahjong/](https://tcottrill.github.io/myMahjong/).
2. You may see an "Install app" or "Add to Home screen" prompt at the bottom of the screen — tap it and confirm.
3. If no prompt appears, tap the **⋮** (three-dot menu) in the top-right, then choose **Install app** (or **Add to Home screen** on older versions of Chrome).
4. Confirm the name and tap **Install** / **Add**.

A "Mahjong" icon will appear on your home screen and in your app drawer. Tap it to launch the game full-screen.

### Other Android browsers

- **Samsung Internet:** menu → **Add page to** → **Home screen**.
- **Firefox:** menu → **Install** (or **Add to Home screen**), depending on version.
- **Edge:** menu → **Add to phone**.

### Notes (Android)

- To uninstall, long-press the icon and tap **Uninstall** (or drag it to the **Uninstall** target at the top of the screen) — same as any other app.
- Because Android installs it as a WebAPK, the game will also appear under **Settings → Apps**.

## Install on desktop

In Chrome or Edge, the install icon appears in the address bar when the page is loaded over HTTPS. Click it, or open the **⋮** menu and choose **Install Mahjong…**. The game gets its own window with no browser chrome and an entry in your Start menu / Dock.

## Run locally

Open `index.html` directly in any modern browser. That's it — the whole game is self-contained, so double-clicking the file works.

To test the PWA install flow on desktop, serve the folder over HTTP — for example:

```sh
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## How the assets work

`index.html` is a single ~1.3 MB file that contains:

1. **44 inline SVG tile graphics** as hidden `<svg id="...">` children of a `#tile-sprite` block. On boot, each is serialized through `XMLSerializer`, turned into a Blob URL, and loaded as an `Image` for canvas drawing. 36 of these are the lovely [FluffyStuff riichi tileset](https://github.com/FluffyStuff/riichi-mahjong-tiles) (Man / Pin / Sou 1–9 + 4 winds + 3 dragons + Front + Back); the 8 flower and season tiles are drawn by hand to match.
2. **A logo SVG** in the same sprite block — gold-gradient "MAHJONG" wordmark with two tilted dragon tiles flanking it.
3. **Five JPEG nature backgrounds** as base64 data URIs (misty forest, lotus on pond, waterfall, misty mountain layers, Mt. Fuji + pagoda). Each game picks one at random; shuffle picks a fresh one.
4. **The full game** — HTML, CSS, JavaScript — including the solvable-board generator, animations, audio synthesis, settings, and dialogs.

No `fetch`, no XHR, no service workers required. The page loads in well under a second even from disk.

## Files

- `index.html` — the entire game (markup, CSS, JS, embedded tiles, logo, backgrounds).
- `site.webmanifest` — PWA manifest (name, icons, theme colour).
- `apple-touch-icon.png`, `apple-touch-icon-152x152.png`, `apple-touch-icon-167x167.png`, `icon-192.png`, `icon-512.png`, `favicon-*.png`, `favicon.ico` — app and tab icons.
- `icon-master.svg` — vector source for the icons.
- `tiles.svg` — the standalone tile sprite (also inlined into `index.html`; this file is kept as a regeneration source).
- [`PROMPT.md`](PROMPT.md) — a self-contained project brief you can paste into [claude.ai](https://claude.ai) to regenerate this game from scratch. Captures every visual, mechanical, and technical decision in the codebase as a structured spec.
- `LICENSE` — public domain dedication.

## Development

The entire codebase — every line of HTML, CSS, and JavaScript in `index.html`, plus all documentation in this repository — was generated by [Claude](https://claude.ai), Anthropic's AI assistant, over several iterations of prompting, refinement, and play-testing. A human directed the work, made the design and gameplay decisions, and verified the result; Claude wrote the code.

[`PROMPT.md`](PROMPT.md) distills that design conversation into a single self-contained spec, so anyone can recreate this game from scratch in their own LLM session.

## Credits

- Tile artwork: [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles), [CC0 public domain](https://creativecommons.org/publicdomain/zero/1.0/).
- Background photos: [Unsplash](https://unsplash.com) (free for any use, no attribution required).
- Code & docs: generated by [Claude](https://claude.ai) (Anthropic).

## License

[Unlicense](LICENSE) — public domain.
