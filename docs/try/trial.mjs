const $ = (id) => document.getElementById(id);
const language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ja';
const strings = {
  ja: {
    title: 'Webでおためし', back: '公式サイトへ',
    intro: 'インストールせずに、小さな訪問者たちを。全画面にして、のんびり眺めることもできます。',
    welcome: 'もうすぐ、会いにきます。', showNow: '今すぐ表示', pause: '一時停止', resume: '再開',
    fullscreen: '全画面にする', expand: '大きく表示', exit: '元に戻す',
    fullscreenHint: 'マウスを動かすか、画面をタップすると操作できます。Escで戻れます。',
    expanded: 'このブラウザでは、ページいっぱいに広げて表示しています。',
    animal: '動物', coat: '毛色・模様', interval: '出現間隔', size: '大きさ', background: '背景',
    all: 'すべての動物', random: 'おまかせ', sec5: '5秒', sec10: '10秒', sec30: '30秒', sec60: '1分',
    small: '小さめ', medium: 'ふつう', large: '大きめ', meadow: '草原', light: '明るい', dark: '暗い',
    scope: '動物はこのページの中に表示されます。音は出ません。',
    videoBackground: 'この端末では、動画に合わせて明るい背景で表示します。',
    nextTitle: 'いつものデスクトップにも。', nextBody: 'アプリなら、作業中の画面に動物が現れます。壁紙はそのまま、マウス操作も続けられます。',
    download: 'アプリをダウンロード ↗', obs: '配信に出したい方は、OBSで使う ↗',
    paused: '一時停止中。「再開」でまた会えます。', waiting: '次の動物が来るまで、少しひと休み。',
    fallback: '動画を再生できないため、画像で表示しています。', failed: '動物を読み込めませんでした。「今すぐ表示」で再度おためしください。',
    scene: '動物のおためし画面', options: 'おためしの設定', navigation: 'ページ移動',
  },
  en: {
    title: 'Try in your browser', back: 'Back to the website',
    intro: 'Meet your little visitors, no installation needed. Go fullscreen and watch them come and go.',
    welcome: 'A little visitor is on the way.', showNow: 'Show now', pause: 'Pause', resume: 'Resume',
    fullscreen: 'Go fullscreen', expand: 'Expand view', exit: 'Back to page',
    fullscreenHint: 'Move your mouse or tap the screen for controls. Press Esc to return.',
    expanded: 'This browser is showing an expanded view within the page.',
    animal: 'Animal', coat: 'Coat / pattern', interval: 'Interval', size: 'Size', background: 'Background',
    all: 'All animals', random: 'Random', sec5: '5 seconds', sec10: '10 seconds', sec30: '30 seconds', sec60: '1 minute',
    small: 'Small', medium: 'Medium', large: 'Large', meadow: 'Meadow', light: 'Light', dark: 'Dark',
    scope: 'Animals appear within this page. Playback is silent.',
    videoBackground: 'This device uses a light background to match the video.',
    nextTitle: 'Bring them to your desktop.', nextBody: 'With the app, animals visit while you work. Your wallpaper stays in place, and clicks pass through.',
    download: 'Download the app ↗', obs: 'Want them on stream? Use with OBS ↗',
    paused: 'Paused. Select Resume for another visit.', waiting: 'A little break before the next visitor.',
    fallback: 'Showing an image because the video could not play.', failed: 'Could not load the animal. Select Show now to try again.',
    scene: 'Animal preview', options: 'Preview settings', navigation: 'Page navigation',
  },
};
const t = (key) => strings[language][key];
document.documentElement.lang = language;
document.title = `${t('title')} | Animals Desktop - for Real`;
for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
$('scene').setAttribute('aria-label', t('scene'));
document.querySelector('.trial-options').setAttribute('aria-label', t('options'));
document.querySelector('.trial-topbar nav').setAttribute('aria-label', t('navigation'));
if (language === 'en') {
  $('home-link').href = $('back-link').href = '../index-en.html';
  $('download-link').href = '../download-en.html';
  $('obs-link').href = '../obs/?lang=en';
  Object.assign($('language-link'), { href: '?lang=ja', lang: 'ja', textContent: 'JA' });
  $('language-link').setAttribute('aria-label', '日本語で読む');
  document.querySelector('meta[name=description]').content = strings.en.intro;
}

async function init() {
  // Dynamic imports keep a useful error message available if a module fails to load.
  const [{ species, variants }, { makeDefaultConfig }, { createPlayback }] = await Promise.all([
    import('../obs/catalog.mjs?v=20260927-mp4'), import('../obs/config.mjs?v=20260927-mp4'), import('../obs/runtime.mjs?v=20260927-mp4'),
  ]);
  const key = 'animals-web-trial-v1';
  let saved;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
  const preferences = {
    animal: species.some(({ id }) => id === saved?.animal) ? saved.animal : 'all',
    coat: 'all',
    interval: [5, 10, 30, 60].includes(saved?.interval) ? saved.interval : 10,
    size: [240, 360, 480].includes(saved?.size) ? saved.size : 360,
    background: ['meadow', 'light', 'dark'].includes(saved?.background) ? saved.background : 'meadow',
  };
  if (preferences.animal !== 'all' && variants.some(({ id, species: group }) => id === saved?.coat && group === preferences.animal)) preferences.coat = saved.coat;
  let userPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pageAway = false;
  let phase = 'paused';
  let opaqueVideo = false;
  let videoBackground = '';
  let resizeTimer;
  let hideTimer;
  let keyboardInput = false;
  const scene = $('scene');
  const hud = $('scene-controls');
  const nativeFullscreen = () => document.fullscreenElement === scene;
  const immersive = () => nativeFullscreen() || scene.classList.contains('is-expanded');
  const canFullscreen = () => Boolean(scene.requestFullscreen && document.fullscreenEnabled);

  function populateAnimals() {
    $('animal').replaceChildren(new Option(t('all'), 'all'), ...species.map(({ id, name }) => new Option(name[language], id)));
    $('animal').value = preferences.animal;
    populateCoats();
  }
  function populateCoats() {
    const coats = variants.filter((variant) => variant.species === preferences.animal);
    $('coat').replaceChildren(new Option(t('random'), 'all'), ...coats.map(({ id, name }) => new Option(name[language], id)));
    $('coat').value = preferences.coat;
    $('coat').disabled = !coats.length;
  }
  function configuration() {
    const config = makeDefaultConfig();
    const selected = variants.filter((variant) => preferences.animal === 'all' ||
      (variant.species === preferences.animal && (preferences.coat === 'all' || variant.id === preferences.coat)));
    config.variants = selected.map(({ id }) => id);
    config.motionsByVariant = Object.fromEntries(selected.map((variant) => [variant.id, variant.motions.map(({ id }) => id)]));
    config.interval = { minSec: preferences.interval, maxSec: preferences.interval };
    config.size.base = preferences.size;
    // Configure without showing a frame first, so paused settings stay paused.
    config.start = 'wait';
    return config;
  }
  function syncBackground() {
    scene.dataset.background = opaqueVideo ? 'light' : preferences.background;
    scene.style.backgroundColor = opaqueVideo ? videoBackground : '';
    $('background').value = opaqueVideo ? 'light' : preferences.background;
    $('background').disabled = opaqueVideo;
    $('background-note').hidden = !opaqueVideo;
  }
  const playback = createPlayback($('stage'), { allowOpaqueVideo: true, onState(state) {
    phase = state.phase;
    if (state.format) {
      opaqueVideo = state.format === 'mp4';
      videoBackground = state.backgroundColor || '';
      syncBackground();
    }
    if (state.variant) {
      const group = species.find(({ id }) => id === state.variant.species);
      $('animal-name').textContent = `${group.name[language]} · ${state.variant.name[language]}`;
    }
    $('playback-status').textContent = ['failed', 'timeout'].includes(state.result) ? t('failed') : state.error ? t('fallback') :
      state.phase === 'paused' ? t('paused') : state.phase === 'waiting' ? t('waiting') : state.motion?.name[language] ?? '';
  }});
  function syncPauseButton() { $('pause').textContent = t(userPaused ? 'resume' : 'pause'); }
  function applySettings() {
    syncBackground();
    playback.configure(configuration());
    if (userPaused || document.hidden || pageAway) playback.pause();
    else playback.playNow();
    syncPauseButton();
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* The demo still works without saving. */ }
  }
  for (const id of ['interval', 'size', 'background']) $(id).value = String(preferences[id]);
  for (const element of document.querySelectorAll('button, select')) element.disabled = false;
  populateAnimals();
  $('animal').addEventListener('change', () => {
    preferences.animal = $('animal').value;
    preferences.coat = 'all';
    populateCoats();
    applySettings();
  });
  for (const id of ['coat', 'interval', 'size', 'background']) $(id).addEventListener('change', () => {
    preferences[id] = ['interval', 'size'].includes(id) ? Number($(id).value) : $(id).value;
    applySettings();
  });
  $('show-now').addEventListener('click', () => {
    userPaused = false;
    playback.playNow();
    syncPauseButton();
  });
  $('pause').addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) playback.pause(); else playback.playNow();
    syncPauseButton();
  });

  function revealControls() {
    clearTimeout(hideTimer);
    scene.classList.remove('controls-hidden');
    if (!immersive()) return;
    hideTimer = setTimeout(() => {
      if (keyboardInput && hud.contains(document.activeElement)) return;
      scene.classList.add('controls-hidden');
    }, 3500);
  }
  function syncFullscreen() {
    const active = immersive();
    scene.classList.toggle('is-immersive', active);
    document.body.classList.toggle('trial-expanded', active);
    // Make content outside the expanded scene unavailable to keyboard focus as well.
    document.querySelector('.trial-topbar').inert = active;
    for (const child of document.querySelector('.trial-main').children) if (child !== scene) child.inert = active;
    $('fullscreen').textContent = t(active ? 'exit' : canFullscreen() ? 'fullscreen' : 'expand');
    $('fullscreen').setAttribute('aria-pressed', String(active));
    $('screen-notice').hidden = !scene.classList.contains('is-expanded');
    $('screen-notice').textContent = t('expanded');
    revealControls();
  }
  async function leaveFullscreen() {
    if (nativeFullscreen()) {
      try { await document.exitFullscreen(); } catch { revealControls(); }
    } else {
      scene.classList.remove('is-expanded');
      syncFullscreen();
    }
    $('fullscreen').focus({ preventScroll: true });
  }
  $('fullscreen').addEventListener('click', async () => {
    if (immersive()) { await leaveFullscreen(); return; }
    if (canFullscreen()) {
      try { await scene.requestFullscreen(); } catch { scene.classList.add('is-expanded'); }
    } else scene.classList.add('is-expanded');
    syncFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  scene.addEventListener('pointermove', revealControls);
  scene.addEventListener('pointerdown', () => { keyboardInput = false; revealControls(); });
  scene.addEventListener('focusin', revealControls);
  document.addEventListener('keydown', (event) => {
    keyboardInput = true;
    revealControls();
    if (event.key === 'Escape' && scene.classList.contains('is-expanded')) leaveFullscreen();
  });
  // Resize the active animal after fullscreen/orientation changes using the shared renderer.
  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    if (phase !== 'playing') return;
    resizeTimer = setTimeout(() => {
      if (userPaused || document.hidden || pageAway || phase !== 'playing') return;
      playback.playNow();
    }, 180);
  });
  observer.observe($('stage'));

  function restorePlayback() {
    if (!userPaused && !document.hidden && !pageAway) playback.playNow();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) playback.pause(); else restorePlayback();
  });
  window.addEventListener('pagehide', () => {
    pageAway = true;
    clearTimeout(hideTimer);
    clearTimeout(resizeTimer);
    playback.pause();
  });
  window.addEventListener('pageshow', (event) => {
    pageAway = false;
    if (event.persisted) { restorePlayback(); syncFullscreen(); }
  });
  syncFullscreen();
  applySettings();
}

init().catch((error) => {
  $('load-error').hidden = false;
  console.error('Animal preview could not start:', error);
});
