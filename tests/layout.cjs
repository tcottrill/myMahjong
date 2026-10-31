// Run with: node tests/layout.cjs
// Exercise the shipped layout functions with device viewport/safe-area inputs.
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Also check syntax of the entire application.
const section = (start, end) => script.slice(script.indexOf(start), script.indexOf(end));
const code = `let width, height, scale, currentLayout = 'TURTLE';
${section('// --- LAYOUTS', '// --- TILE SPRITE LOADER')}
${section('// --- RESIZE & SCALING', '// --- GAME LOGIC')}
${section('function getGameButtonRects()', 'function drawUI()')}
${section('function getLayoutOffsets()', 'function drawBoard()')}`;

const cases = [
    { w: 393, h: 852, top: 59, bottom: 34, side: 0, preserve: true },
    { w: 430, h: 932, top: 59, bottom: 34, side: 0, preserve: true },
    { w: 375, h: 667, top: 20, bottom: 0, side: 0, preserve: true },
    { w: 393, h: 650, top: 59, bottom: 34, side: 0, preserve: true },
    { w: 852, h: 393, top: 0, bottom: 21, side: 59 },
    { w: 320, h: 480, top: 0, bottom: 0, side: 0 },
    { w: 1280, h: 800, top: 0, bottom: 0, side: 0, preserve: true },
];
for (const c of cases) {
    const context = vm.createContext({
        window: { innerWidth: c.w, innerHeight: c.h, addEventListener() {} },
        document: { getElementById() { return {}; } },
        getComputedStyle() { return { paddingTop: `${c.top}px`, paddingBottom: `${c.bottom}px`, paddingLeft: `${c.side}px`, paddingRight: `${c.side}px` }; },
        canvas: {}, draw() {},
    });
    vm.runInContext(code, context);
    for (const name of ['TURTLE', 'PYRAMID', 'DRAGON', 'SIMPLE']) {
        const r = vm.runInContext(`currentLayout = '${name}'; resize();
            ({ buttons: getGameButtonRects(), offsets: getLayoutOffsets(), bounds: layoutBounds(activeLayout()), scale, count: activeLayout().length })`, context);
        const b = r.buttons;
        const label = `${name} ${c.w}x${c.h}`;
        assert(b.quit.y >= c.top + 4, `${label}: top controls enter unsafe area`);
        assert(b.quit.x >= c.side + 4, `${label}: QUIT enters side unsafe area`);
        assert(b.undo.x + b.undo.w <= c.w - c.side - 4, `${label}: bottom controls enter side unsafe area`);
        assert(b.hint.y + b.hint.h <= c.h - c.bottom - 4, `${label}: bottom controls enter home indicator area`);
        const left = r.offsets.offsetX + r.bounds.left * r.scale;
        const top = r.offsets.offsetY + r.bounds.top * r.scale;
        assert(left >= c.side + 4 - 1e-6, `${label}: board outside safe width`);
        assert(top >= b.quit.y + b.quit.h + 4, `${label}: board overlaps top row`);
        assert(top + r.bounds.height * r.scale <= b.hint.y - 4, `${label}: board overlaps bottom row`);
        if (name === 'TURTLE') {
            assert.equal(r.count, 144);
            if (c.preserve) {
                const oldScale = Math.min((c.w - 16) / r.bounds.width, (c.h - 190) / r.bounds.height);
                assert(r.scale >= oldScale - 1e-6, `${label}: turtle tiles shrank`);
            }
        }
    }
}
console.log(`PASS: ${cases.length * 4} layout/device cases; turtle tile sizes preserved on portrait phones and desktop.`);
