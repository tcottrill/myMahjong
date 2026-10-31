# Release notes

## 1.1 — 2026-10-30

- Place QUIT and the time/score row 6 CSS pixels below the device's safe-area boundary to avoid the Dynamic Island and notch.
- Keep bottom controls clear of the home indicator and respect landscape side insets.
- Fit the board between the actual controls, reclaiming unused fixed margins without adding scrolling.
- Retain all 144 Turtle tiles and preserve tile sizes on the tested portrait phone viewports. Short and landscape viewports still scale to fit.
- Add 28 layout/device regression cases and headless Chrome rendering, overflow, and QUIT-input checks.

Validation: both Node.js test scripts passed with simulated safe-area insets. Actual iPhone Safari and home-screen appearance still requires on-device confirmation.
