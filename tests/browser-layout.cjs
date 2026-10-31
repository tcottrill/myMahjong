// Real-browser smoke check, with simulated iPhone safe-area values.
// Usage: node tests/browser-layout.cjs [path-to-Chrome-or-Edge]
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mahjong-layout-'));
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const check = `<script>
window.addEventListener('load', () => {
    try {
        const reports = [];
        const check = (ok, message) => { if (!ok) throw new Error(message); };
        for (const [w, h, top, right, bottom, left] of [
            [393, 852, 59, 0, 34, 0], [430, 932, 59, 0, 34, 0],
            [852, 393, 0, 59, 21, 59], [320, 480, 0, 0, 0, 0]
        ]) {
            Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
            Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
            document.documentElement.style.width = document.body.style.width = w + 'px';
            document.documentElement.style.height = document.body.style.height = h + 'px';
            document.getElementById('safe-area').style.padding = [top, right, bottom, left].map(n => n + 'px').join(' ');
            resize();
            check(safeArea.top === top && safeArea.left === left, 'CSS safe-area values not consumed');
            for (const layout of Object.keys(LAYOUTS)) {
                currentLayout = layout;
                tiles = activeLayout().map((p, i) => ({ ...p, id: i, active: true, suit: 'dot', val: 1 }));
                state = 'PLAY';
                resize();
                const B = getGameButtonRects();
                check(B.quit.y >= top + 4, 'Unsafe top row');
                check(B.hint.y + B.hint.h <= h - bottom - 4, 'Unsafe bottom row');
                const rect = canvas.getBoundingClientRect();
                check(rect.width === w && rect.height === h, 'Canvas stretched or clipped');
                check(document.body.scrollWidth <= w && document.body.scrollHeight <= h, 'Page overflow');
                check(getComputedStyle(document.body).overflow === 'hidden', 'Scrolling enabled');
                undoStack = []; moves = 0;
                handleInput(B.quit.x + B.quit.w / 2, B.quit.y + B.quit.h / 2);
                check(state === 'MENU', 'QUIT hit target did not follow drawing');
                draw();
            }
            reports.push(w + 'x' + h);
        }
        const result = document.createElement('pre');
        result.id = 'test-result';
        result.textContent = 'PASS: rendered all layouts, no page overflow, CSS inset propagation and QUIT input: ' + reports.join(', ');
        document.body.appendChild(result);
    } catch (error) {
        const result = document.createElement('pre');
        result.id = 'test-result';
        result.textContent = 'FAIL: ' + error.stack;
        document.body.appendChild(result);
    }
});
</script>`;
const file = path.join(temp, 'test.html');
fs.writeFileSync(file, source.replace('</body>', check + '</body>'));
const browser = process.argv[2] || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const run = spawnSync(browser, ['--headless', '--disable-gpu', '--no-first-run',
    '--user-data-dir=' + path.join(temp, 'profile'), '--dump-dom', '--virtual-time-budget=3000',
    'file:///' + file.replaceAll('\\', '/')], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 });
const result = run.stdout?.match(/<pre id="test-result">([\s\S]*?)<\/pre>/)?.[1];
console.log(result || run.error || run.stderr || 'Browser returned no test result');
process.exit(result?.startsWith('PASS:') ? 0 : 1);
