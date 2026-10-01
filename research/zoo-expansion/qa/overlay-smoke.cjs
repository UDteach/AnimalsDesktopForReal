// Exercise the shipped renderer and preload with all eight new video/PNG paths.
// Run from the repository root: node_modules/.bin/electron research/zoo-expansion/qa/overlay-smoke.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const { actionsBySpecies } = require(path.join(root, 'shared/motions.cjs'));
const rows = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
app.setPath('userData', path.join(app.getPath('temp'), 'animals-zoo-overlay-qa'));
app.whenReady().then(async () => {
  if (app.dock) app.dock.hide();
  const window = new BrowserWindow({ width: 1280, height: 720, show: false, frame: false,
    transparent: true, webPreferences: { offscreen: true, backgroundThrottling: false,
      preload: path.join(root, 'electron/preload.js'), contextIsolation: true,
      nodeIntegration: false, sandbox: true } });
  await window.loadFile(path.join(root, 'electron/overlay.html'));
  for (const [species, variant] of [['shoebill', 'shoebill-natural'], ['marmot', 'marmot-alpine-natural']]) {
    for (const kind of ['video', 'image']) {
      for (const action of actionsBySpecies[species]) {
        const id = `${variant}-${action}`;
        const file = kind === 'video' ? `assets/motions/${id}.webm` : `assets/animals/${variant}.png`;
        const ended = new Promise((resolve) => ipcMain.once('animation-ended', resolve));
        const started = Date.now();
        window.webContents.send('play', { url: pathToFileURL(path.join(root, file)).href,
          fallbackUrl: pathToFileURL(path.join(root, `assets/animals/${variant}.png`)).href,
          motion: `${species}-${action}`, scale: 0.68, kind });
        await sleep(1400);
        const state = await window.webContents.executeJavaScript(`(() => {
          const video = document.getElementById('motion-video');
          const image = document.getElementById('animal');
          const media = video.hidden ? image : video;
          const style = getComputedStyle(media);
          const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
          const ctx = canvas.getContext('2d'); ctx.drawImage(media, 0, 0, 160, 90);
          const alphas = Array.from(ctx.getImageData(0, 0, 160, 90).data).filter((_, i) => i % 4 === 3);
          return { kind: video.hidden ? 'image' : 'video', animation: style.animationName,
            opacity: Number(style.opacity), currentTime: video.currentTime,
            width: video.hidden ? image.naturalWidth : video.videoWidth,
            height: video.hidden ? image.naturalHeight : video.videoHeight,
            error: video.error?.message || null,
            alphaMin: Math.min(...alphas), alphaMax: Math.max(...alphas) };
        })()`);
        assert.equal(state.kind, kind, `${id}: unexpected fallback`);
        assert.ok(state.width > 0 && state.height > 0, `${id}: did not decode`);
        assert.equal(state.error, null);
        assert.equal(state.alphaMin, 0, `${id}: missing transparency`);
        assert.ok(state.alphaMax >= 240 && state.opacity > 0.5, `${id}: invisible`);
        const expected = kind === 'video' && action === 'bottom-pop' ? 'none' :
          ['walk', 'shuffle'].includes(action) ? 'edge-walk' : 'edge-pop';
        assert.equal(state.animation, expected, `${id}: missing entrance`);
        if (kind === 'video') assert.ok(state.currentTime > 0.5, `${id}: playback stalled`);
        fs.writeFileSync(path.join(__dirname, `${id}-${kind}-runtime.png`),
          (await window.webContents.capturePage()).toPNG());
        await Promise.race([ended, sleep(6000).then(() => { throw new Error(`${id}: did not finish`); })]);
        rows.push({ id, ...state, completedMs: Date.now() - started });
        console.log(`${id} ${kind}: decoded, transparent, visible, completed`);
      }
    }
  }
  fs.writeFileSync(path.join(__dirname, 'overlay-smoke.json'), JSON.stringify(rows, null, 2) + '\n');
  window.destroy(); app.quit();
}).catch((error) => { console.error(error); app.exit(1); });
