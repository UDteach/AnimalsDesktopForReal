const { app, BrowserWindow, Menu, Tray, nativeImage, screen, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { species, variants } = require('./catalog');
const { defaultModes, validModes, pomodoroPhase } = require('./modes');

const motionsBySpecies = {
  chinchilla: ['chinchilla-hop', 'chinchilla-perch', 'chinchilla-peek', 'chinchilla-bottom-pop'],
  hamster: ['hamster-forage', 'hamster-explore', 'hamster-peek', 'hamster-bottom-pop'],
  djungarian: ['djungarian-dash', 'djungarian-pause', 'djungarian-peek', 'djungarian-bottom-pop'],
  'macaroni-mouse': ['macaroni-emerge', 'macaroni-shuffle', 'macaroni-settle', 'macaroni-bottom-pop'],
  'sugar-glider': ['sugar-glider-glide', 'sugar-glider-perch', 'sugar-glider-peek', 'sugar-glider-bottom-pop'],
  'guinea-pig': ['guinea-pig-trot', 'guinea-pig-forage', 'guinea-pig-popcorn', 'guinea-pig-bottom-pop'],
  rabbit: ['rabbit-hop', 'rabbit-sniff', 'rabbit-periscope', 'rabbit-bottom-pop'],
};
const frequencies = [
  { label: { ja: '1〜30秒ごと', en: 'Every 1–30 seconds' }, min: 1, max: 30 },
  { label: { ja: '1〜3分ごと', en: 'Every 1–3 minutes' }, min: 60, max: 180 },
  { label: { ja: '3〜6分ごと', en: 'Every 3–6 minutes' }, min: 180, max: 360 },
  { label: { ja: '5〜10分ごと', en: 'Every 5–10 minutes' }, min: 300, max: 600 },
  { label: { ja: '10〜20分ごと', en: 'Every 10–20 minutes' }, min: 600, max: 1200 },
];
const sizes = [
  { label: { ja: '小さめ', en: 'Small' }, scale: 0.32 },
  { label: { ja: '標準', en: 'Standard' }, scale: 0.44 },
  { label: { ja: '大きめ', en: 'Large' }, scale: 0.56 },
  { label: { ja: '特大', en: 'Extra large' }, scale: 0.68 },
];
const copy = {
  ja: { show: '今すぐ表示', pause: '一時停止', resume: '再開', animals: '動物', all: '全種類ランダム', one: '1種類だけ表示', selected: '選択した種類からランダム', interval: '出現間隔', custom: 'カスタム間隔…', size: '表示サイズ', language: '言語', quit: '終了', pomodoro: 'ポモドーロ', enabled: 'ポモドーロを使う', showTimer: '残り時間を画面に表示', modes: '時間の設定…', focus: '集中', break: '休憩', longBreak: '長い休憩', minutesLeft: '残り{n}分' },
  en: { show: 'Show now', pause: 'Pause', resume: 'Resume', animals: 'Animals', all: 'Random from all', one: 'One variant only', selected: 'Random from selected variants', interval: 'Appearance interval', custom: 'Custom interval…', size: 'Display size', language: 'Language', quit: 'Quit', pomodoro: 'Pomodoro', enabled: 'Use Pomodoro', showTimer: 'Show remaining time on screen', modes: 'Time settings…', focus: 'Focus', break: 'Break', longBreak: 'Long break', minutesLeft: '{n} min left' },
};

let tray;
let overlay;
let intervalWindow;
let modesWindow;
let timerWindow;
let nextTimer;
let stopTimer;
let available = [];
let lastVariant;
let lastMotion;
let paused = false;
let lastAllowed;
let lastMenuStatus = '';
let settings = { frequency: 2, customInterval: { min: 180, max: 360 }, size: 1, language: 'ja', all: true, selected: [], modes: structuredClone(defaultModes) };

function animalDir() {
  return app.isPackaged ? path.join(process.resourcesPath, 'animals') : path.join(__dirname, '..', 'assets', 'animals');
}
function motionDir() {
  return app.isPackaged ? path.join(process.resourcesPath, 'motions') : path.join(__dirname, '..', 'assets', 'motions');
}

function settingsPath() { return path.join(app.getPath('userData'), 'settings.json'); }
function validInterval(value) {
  return value && Number.isInteger(value.min) && Number.isInteger(value.max) &&
    value.min >= 1 && value.max <= 86400 && value.min <= value.max;
}
function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
    if (Number.isInteger(saved.frequency) && frequencies[saved.frequency]) settings.frequency = saved.frequency;
    if (saved.frequency === 'custom' && validInterval(saved.customInterval)) settings.frequency = 'custom';
    if (validInterval(saved.customInterval)) settings.customInterval = saved.customInterval;
    if (Number.isInteger(saved.size) && sizes[saved.size]) settings.size = saved.size;
    if (saved.language === 'ja' || saved.language === 'en') settings.language = saved.language;
    if (typeof saved.all === 'boolean') settings.all = saved.all;
    if (Array.isArray(saved.selected)) settings.selected = saved.selected.filter((id) => typeof id === 'string');
    if (validModes(saved.modes)) settings.modes = saved.modes;
    if (settings.modes.pomodoro.enabled && !settings.modes.pomodoro.startedAt) settings.modes.pomodoro.startedAt = Date.now();
  } catch { /* first launch uses defaults */ }
}
function saveSettings() {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings));
}
function discoverAssets() {
  available = variants.filter((variant) => fs.existsSync(path.join(animalDir(), `${variant.id}.png`)));
  const ids = new Set(available.map((variant) => variant.id));
  settings.selected = [...new Set(settings.selected)].filter((id) => ids.has(id));
  if (!settings.all && settings.selected.length === 0 && available.length) settings.selected = [available[0].id];
}
function chosenVariants() { return settings.all ? available : available.filter((v) => settings.selected.includes(v.id)); }
function label(variant, language) { return variant.name[language]; }
function setOnly(id) { settings.all = false; settings.selected = [id]; saveSettings(); refreshMenu(); }
function toggle(id) {
  if (settings.all) { settings.all = false; settings.selected = available.map((v) => v.id); }
  if (settings.selected.includes(id)) {
    if (settings.selected.length > 1) settings.selected = settings.selected.filter((item) => item !== id);
  } else settings.selected.push(id);
  saveSettings(); refreshMenu();
}
function groupedVariantMenu(language, action, checked) {
  return species.map((group) => ({
    label: group.name[language],
    submenu: available.filter((v) => v.species === group.id).map((variant) => ({
      label: label(variant, language), type: 'checkbox', checked: checked(variant.id),
      click: () => action(variant.id),
    })),
  })).filter((item) => item.submenu.length);
}
function pomodoroStatus(language) {
  const phase = pomodoroPhase(settings.modes.pomodoro);
  if (!phase) return null;
  const t = copy[language];
  return `${t[phase.kind]} ${phase.round}/4 · ${t.minutesLeft.replace('{n}', String(Math.ceil(phase.remainingMs / 60000)))}`;
}
function togglePomodoro() {
  const pomodoro = settings.modes.pomodoro;
  pomodoro.enabled = !pomodoro.enabled;
  pomodoro.startedAt = pomodoro.enabled ? Date.now() : null;
  saveSettings(); reconcileRuntime(); refreshMenu();
}
function toggleShowTimer() {
  settings.modes.showTimer = !settings.modes.showTimer;
  saveSettings(); syncTimerWindow(); refreshMenu();
}
function menu() {
  const language = settings.language;
  const t = copy[language];
  return Menu.buildFromTemplate([
    { label: t.show, enabled: available.length > 0, click: () => playNext(true) },
    { label: paused ? t.resume : t.pause, click: () => { paused = !paused; reconcileRuntime(); refreshMenu(); } },
    { type: 'separator' },
    { label: t.animals, submenu: [
      { label: t.all, type: 'checkbox', checked: settings.all, click: () => { settings.all = true; saveSettings(); refreshMenu(); } },
      { label: t.one, submenu: groupedVariantMenu(language, setOnly, (id) => !settings.all && settings.selected.length === 1 && settings.selected[0] === id) },
      { label: t.selected, submenu: groupedVariantMenu(language, toggle, (id) => settings.all || settings.selected.includes(id)) },
    ] },
    { label: t.interval, submenu: [
      ...frequencies.map((item, index) => ({ label: item.label[language], type: 'radio', checked: settings.frequency === index,
        click: () => { settings.frequency = index; saveSettings(); schedule(); refreshMenu(); } })),
      { label: t.custom, type: 'radio', checked: settings.frequency === 'custom', click: openIntervalWindow },
    ] },
    { label: t.size, submenu: sizes.map((item, index) => ({ label: item.label[language], type: 'radio', checked: settings.size === index,
      click: () => { settings.size = index; saveSettings(); refreshMenu(); } })) },
    { label: t.pomodoro, submenu: [
      { label: t.enabled, type: 'checkbox', checked: settings.modes.pomodoro.enabled, click: togglePomodoro },
      { label: t.showTimer, type: 'checkbox', checked: settings.modes.showTimer, click: toggleShowTimer },
      ...(settings.modes.pomodoro.enabled ? [{ label: pomodoroStatus(language), enabled: false }] : []),
      { type: 'separator' },
      { label: t.modes, click: openModesWindow },
    ] },
    { label: t.language, submenu: [
      { label: '日本語', type: 'radio', checked: language === 'ja', click: () => { settings.language = 'ja'; saveSettings(); refreshMenu(); } },
      { label: 'English', type: 'radio', checked: language === 'en', click: () => { settings.language = 'en'; saveSettings(); refreshMenu(); } },
    ] },
    { type: 'separator' },
    { label: t.quit, role: 'quit' },
  ]);
}
function refreshMenu() { tray?.setContextMenu(menu()); }
function stop() {
  clearTimeout(nextTimer); clearTimeout(stopTimer);
  nextTimer = undefined; stopTimer = undefined;
  if (overlay && !overlay.isDestroyed()) overlay.hide();
}
function schedule() {
  clearTimeout(nextTimer);
  if (!canAutoPlay()) return;
  const range = settings.frequency === 'custom' ? settings.customInterval : frequencies[settings.frequency];
  nextTimer = setTimeout(() => playNext(), (range.min + Math.random() * (range.max - range.min)) * 1000);
}
function canAutoPlay() {
  const phase = pomodoroPhase(settings.modes.pomodoro);
  return !paused && !intervalWindow && !modesWindow && chosenVariants().length > 0 && (!phase || phase.kind !== 'focus');
}
function reconcileRuntime() {
  const allowed = canAutoPlay();
  if (allowed !== lastAllowed) {
    lastAllowed = allowed;
    stop();
    if (allowed) playNext();
  }
  const status = pomodoroStatus(settings.language) || '';
  if (status !== lastMenuStatus) { lastMenuStatus = status; refreshMenu(); }
  syncTimerWindow();
}
function syncTimerWindow() {
  const phase = pomodoroPhase(settings.modes.pomodoro);
  if (!settings.modes.showTimer || !phase) {
    if (timerWindow && !timerWindow.isDestroyed()) timerWindow.hide();
    return;
  }
  if (!timerWindow || timerWindow.isDestroyed()) {
    timerWindow = new BrowserWindow({ width: 190, height: 64, show: false, frame: false, transparent: true,
      backgroundColor: '#00000000', skipTaskbar: true, focusable: false, hasShadow: false, resizable: false,
      webPreferences: { preload: path.join(__dirname, 'timer-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    timerWindow.setIgnoreMouseEvents(true, { forward: true });
    timerWindow.setAlwaysOnTop(true, 'screen-saver');
    if (process.platform === 'darwin') {
      timerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      timerWindow.setFullScreenable(false);
    }
    timerWindow.loadFile(path.join(__dirname, 'timer.html'));
    timerWindow.webContents.once('did-finish-load', syncTimerWindow);
    timerWindow.on('closed', () => { timerWindow = undefined; });
    return;
  }
  if (timerWindow.webContents.isLoading()) return;
  const area = screen.getPrimaryDisplay().workArea;
  timerWindow.setBounds({ x: area.x + area.width - 206, y: area.y + 14, width: 190, height: 64 });
  const totalSeconds = Math.ceil(phase.remainingMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  timerWindow.webContents.send('timer:update', {
    label: `${copy[settings.language][phase.kind]} ${phase.round}/4`,
    time: `${minutes}:${seconds}`, kind: phase.kind,
  });
  timerWindow.showInactive();
}
function ensureOverlay() {
  if (overlay && !overlay.isDestroyed()) return overlay;
  overlay = new BrowserWindow({ show: false, frame: false, transparent: true, backgroundColor: '#00000000',
    skipTaskbar: true, focusable: false, hasShadow: false, resizable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlay.setFullScreenable(false);
  }
  overlay.loadFile(path.join(__dirname, 'overlay.html'));
  overlay.on('closed', () => { overlay = undefined; });
  return overlay;
}
function playNext(manual = false) {
  if (!manual && !canAutoPlay()) return;
  const choices = chosenVariants();
  if (!choices.length) return;
  stop();
  const variantPool = choices.length > 1 ? choices.filter((v) => v.id !== lastVariant) : choices;
  const variant = variantPool[Math.floor(Math.random() * variantPool.length)];
  const motions = motionsBySpecies[variant.species].filter((item) => {
    if (item === 'sugar-glider-glide') return fs.existsSync(path.join(motionDir(), `${variant.id}-glide.webm`));
    if (item.endsWith('-bottom-pop')) return fs.existsSync(path.join(motionDir(), `${variant.id}-bottom-pop.webm`));
    return true;
  });
  const motionPool = motions.filter((m) => m !== lastMotion);
  const motion = motionPool[Math.floor(Math.random() * motionPool.length)];
  lastVariant = variant.id; lastMotion = motion;
  const action = motion.endsWith('-bottom-pop') ? 'bottom-pop' : motion.slice(motion.lastIndexOf('-') + 1);
  const videoFile = path.join(motionDir(), `${variant.id}-${action}.webm`);
  const imageFile = path.join(animalDir(), `${variant.id}.png`);
  const isVideo = fs.existsSync(videoFile);
  const file = isVideo ? videoFile : imageFile;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const window = ensureOverlay();
  window.setBounds(display.bounds);
  const send = () => {
    window.webContents.send('play', {
      url: pathToFileURL(file).href, fallbackUrl: pathToFileURL(imageFile).href,
      motion, scale: sizes[settings.size].scale, kind: isVideo ? 'video' : 'image',
    });
    window.showInactive();
    stopTimer = setTimeout(() => { stop(); schedule(); }, 7000);
  };
  if (window.webContents.isLoading()) window.webContents.once('did-finish-load', send);
  else send();
}
function openIntervalWindow() {
  if (intervalWindow && !intervalWindow.isDestroyed()) { intervalWindow.focus(); return; }
  stop();
  intervalWindow = new BrowserWindow({ width: 420, height: 420, show: false, resizable: false, autoHideMenuBar: true,
    title: 'Animals Desktop - for Real',
    webPreferences: { preload: path.join(__dirname, 'interval-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  intervalWindow.loadFile(path.join(__dirname, 'interval.html'));
  intervalWindow.once('ready-to-show', () => intervalWindow.show());
  intervalWindow.on('closed', () => { intervalWindow = undefined; reconcileRuntime(); });
  reconcileRuntime();
}
function openModesWindow() {
  if (modesWindow && !modesWindow.isDestroyed()) { modesWindow.focus(); return; }
  stop();
  modesWindow = new BrowserWindow({ width: 500, height: 480, show: false, resizable: false, autoHideMenuBar: true,
    title: 'Animals Desktop - for Real',
    webPreferences: { preload: path.join(__dirname, 'modes-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  modesWindow.loadFile(path.join(__dirname, 'modes.html'));
  modesWindow.once('ready-to-show', () => modesWindow.show());
  modesWindow.on('closed', () => { modesWindow = undefined; reconcileRuntime(); });
  reconcileRuntime();
}
ipcMain.handle('modes:get', (event) => {
  if (event.sender !== modesWindow?.webContents) return null;
  return { language: settings.language, modes: settings.modes };
});
ipcMain.handle('modes:save', (event, value) => {
  if (event.sender !== modesWindow?.webContents || !value || typeof value !== 'object') return false;
  const candidate = { pomodoro: { ...value.pomodoro, startedAt: null }, showTimer: value.showTimer };
  if (!validModes(candidate)) return false;
  const old = settings.modes.pomodoro;
  const next = candidate.pomodoro;
  const sameTimer = old.enabled && next.enabled && old.focus === next.focus &&
    old.shortBreak === next.shortBreak && old.longBreak === next.longBreak;
  next.startedAt = next.enabled ? (sameTimer ? old.startedAt : Date.now()) : null;
  settings.modes = candidate;
  saveSettings(); refreshMenu();
  setImmediate(() => modesWindow?.close());
  return true;
});
ipcMain.handle('interval:get', (event) => {
  if (event.sender !== intervalWindow?.webContents) return null;
  const range = settings.frequency === 'custom' ? settings.customInterval : frequencies[settings.frequency];
  return { language: settings.language, min: range.min, max: range.max };
});
ipcMain.handle('interval:save', (event, value) => {
  if (event.sender !== intervalWindow?.webContents || !validInterval(value)) return false;
  settings.customInterval = { min: value.min, max: value.max }; settings.frequency = 'custom';
  saveSettings(); refreshMenu(); setImmediate(() => intervalWindow?.close()); return true;
});
ipcMain.on('animation-ended', (event) => {
  if (event.sender !== overlay?.webContents) return;
  stop(); schedule();
});
app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide();
  loadSettings(); discoverAssets();
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icons', 'tray.png')));
  tray.setToolTip('Animals Desktop - for Real'); refreshMenu();
  reconcileRuntime();
  setInterval(reconcileRuntime, 1000);
});
app.on('window-all-closed', () => {});
app.on('before-quit', stop);
