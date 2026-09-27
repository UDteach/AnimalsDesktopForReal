import { species, variants } from './catalog.mjs';
import { makeDefaultConfig, validateConfig, parseConfig, serializeConfig, makeOverlayUrl, sizeFor } from './config.mjs';
import { createPlayback } from './runtime.mjs';

const $ = (id) => document.getElementById(id);
const DRAFT_KEY = 'animals-obs-draft-v1';
const PRESETS_KEY = 'animals-obs-presets-v1';
const UI_KEY = 'animals-obs-ui-v1';
const catalog = new Map(variants.map((variant) => [variant.id, variant]));
const groups = new Map(species.map((item) => [item.id, item]));
const copy = (value) => structuredClone(value);
const escaped = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ja';
let config = makeDefaultConfig();
let presets = [];
let activePreset = '';
let filter = 'all';
let intervalMode = 'range';
let playback;
let previewPaused = false;
let previewPhase = '';
let storageWarning = '';
let drag = null;

const labels = {
  en: {
    back:'Main site', title:'Bring animals into OBS', intro:'Choose the animals and motions you want, check the preview, then paste the generated URL into an OBS Browser Source.', animals:'Animals to show', animalsHint:'Choose coats and motions. Changing the filter keeps your selections.', filter:'Filter by species', selectAll:'Select all', clearAll:'Clear selection', selectSpecies:'Select this species', bulkMotions:'Apply motions to the visible species', allMotions:'All motions', bottomOnly:'Bottom peek only', timing:'Appearance', order:'Order', random:'Random', sequential:'In order', start:'First appearance', immediate:'Immediately', wait:'Wait for interval', avoidRepeat:'Avoid showing the same animal twice in a row', intervalMode:'Interval', range:'Random range', fixed:'Fixed interval', minSec:'Minimum (seconds)', maxSec:'Maximum (seconds)', placement:'Size and position', baseSize:'Default size', small:'Small · 160 px', standard:'Standard · 240 px', large:'Large · 320 px', extraLarge:'Extra large · 400 px', custom:'Custom value', basePx:'Size (px at 1080p)', side:'Entry side', left:'Left', right:'Right', renderer:'Playback', autoVideo:'Video (image fallback)', pngOnly:'Image only', opacity:'Opacity', area:'Display area', areaHint:'Drag the rectangle in the preview to move it. Drag its lower-right corner to resize.', width:'Width %', height:'Height %', fullArea:'Use entire canvas', individualSize:'Sizes by species and coat', sizeHint:'Coat overrides species; species overrides default size.', clearOverrides:'Clear all individual sizes', save:'Save and use in OBS', presets:'Presets', presetsHint:'Your draft saves automatically in this browser. Use Save to update a named preset.', savedPresets:'Saved presets', presetName:'Name', load:'Load', savePreset:'Save / update', duplicate:'Duplicate', rename:'Rename', delete:'Delete', import:'Import from a URL', importHint:'Paste an OBS URL', readUrl:'Import', obsUrl:'OBS URL', urlHint:'After changing settings, copy this URL again and replace the URL in OBS.', copyFallback:'If copying fails, select and copy this URL manually', copyUrl:'Copy OBS URL', resetDraft:'Reset the draft to defaults', preview:'Preview', resolution:'Resolution', background:'Preview background', lightBg:'Light', darkBg:'Dark', checkerBg:'Checkerboard', playNow:'Show now', pause:'Pause', resume:'Resume', previewHint:'The frame and background are only for preview. OBS shows the animals alone.', obsSteps:'How to use in OBS', step1:'Copy the OBS URL.', step2:'Add a Browser Source in OBS and paste the URL.', step3:'Set width and height to match your stream canvas (for example, 1920 × 1080).', step4:'Enable “Shutdown source when not visible” and disable “Refresh browser when scene becomes active”.', guideNote:'You can close this page while OBS keeps running. Paste a new URL into OBS after you change settings.', selected:'selected', allSpecies:'All species', motion:'Motions', try:'Try', selectMotions:'All', noMotions:'None', moveUp:'Move up', moveDown:'Move down', selectedOrder:'Selected order', inherited:'Inherited', defaultSize:'Default', removeOverride:'Clear', noPresets:'Choose a saved preset', presetSaved:'Preset saved.', presetLoaded:'Preset loaded.', presetRenamed:'Preset renamed.', presetDeleted:'Preset deleted.', presetDuplicated:'Preset duplicated.', presetNameRequired:'Enter a preset name.', choosePreset:'Choose a preset first.', deleteConfirm:'Delete this preset?', resetConfirm:'Reset the current draft to defaults?', resetDone:'Draft reset.', importDone:'Settings imported from URL.', importFailed:'Could not read this URL.', copied:'OBS URL copied.', copyFailed:'Copy failed. Select the URL above and copy it manually.', storageFailed:'Browser storage is unavailable. You can still edit and copy the URL.', invalidConfig:'Fix the highlighted settings to create a URL.', invalidSaved:'A saved draft or preset was invalid and was ignored.', previewIdle:'Ready', previewInvalid:'Check settings', previewPaused:'Paused', previewPlaying:'Playing', previewWaiting:'Waiting', previewLoading:'Loading', noAnimals:'Choose at least one animal.', noMotion:'Select at least one motion for each selected coat.', speciesAll:'All for this species', speciesNone:'None for this species', previewAtSize:'Visible size', noSelected:'No animals selected', fixedPresets:['10 sec','30–60 sec','60–180 sec','5 min'], duplicateSuffix:' copy'
  },
  ja: {
    back:'公式サイトへ', title:'OBSで動物を出そう', intro:'出したい動物と動きを選び、プレビューで見た目を確認。できたURLをOBSのブラウザソースに貼るだけです。', animals:'表示する動物', animalsHint:'毛色を選び、動きを設定します。絞り込みを変えても選択は残ります。', filter:'種で絞り込む', selectAll:'全選択', clearAll:'選択解除', selectSpecies:'この種を全選択', bulkMotions:'表示中の種に動きを一括適用', allMotions:'すべての動き', bottomOnly:'下から顔を出すだけ', timing:'出方', order:'表示順', random:'ランダム', sequential:'順番に表示', start:'最初の表示', immediate:'すぐ表示', wait:'間隔を待つ', avoidRepeat:'同じ動物が続くのを避ける', intervalMode:'出現間隔', range:'範囲でランダム', fixed:'一定間隔', minSec:'最短（秒）', maxSec:'最長（秒）', placement:'大きさと場所', baseSize:'基本サイズ', small:'小 · 160 px', standard:'標準 · 240 px', large:'大 · 320 px', extraLarge:'特大 · 400 px', custom:'数値で指定', basePx:'サイズ（1080p時のpx）', side:'出現する側', left:'左', right:'右', renderer:'再生方法', autoVideo:'動画（失敗時は画像）', pngOnly:'画像のみ', opacity:'不透明度', area:'表示エリア', areaHint:'プレビューの枠をドラッグして移動。右下をドラッグすると大きさを変えられます。', width:'幅 %', height:'高さ %', fullArea:'画面全体に戻す', individualSize:'種・毛色ごとのサイズ', sizeHint:'毛色の設定が最優先。未指定なら種、基本サイズを使います。', clearOverrides:'個別設定をすべて解除', save:'保存とOBSへの設定', presets:'プリセット', presetsHint:'編集中の内容はこのブラウザに自動保存します。名前付きプリセットは保存ボタンで更新します。', savedPresets:'保存済み', presetName:'名前', load:'読み込む', savePreset:'保存・更新', duplicate:'複製', rename:'名前を変更', delete:'削除', import:'URLから設定を読み込む', importHint:'OBS用URLを貼り付け', readUrl:'読み込む', obsUrl:'OBS用URL', urlHint:'設定を変えたらURLをコピーし直し、OBSのブラウザソースに貼り替えてください。', copyFallback:'コピーできない場合は、ここを選択して手動でコピー', copyUrl:'OBS用URLをコピー', resetDraft:'編集中の設定を初期値に戻す', preview:'プレビュー', resolution:'解像度', background:'確認用の背景', lightBg:'明るい', darkBg:'暗い', checkerBg:'市松模様', playNow:'今すぐ表示', pause:'一時停止', resume:'再開', previewHint:'枠と背景は確認用です。OBSには動物だけが表示されます。', obsSteps:'OBSでの使い方', step1:'「OBS用URLをコピー」を押します。', step2:'OBSで「ブラウザ」ソースを追加し、URL欄に貼ります。', step3:'幅と高さを配信キャンバスに合わせます（例：1920 × 1080）。', step4:'「表示されていないときにソースをシャットダウン」をオン、「シーンがアクティブになったときにブラウザを更新」をオフにします。', guideNote:'設定ページを閉じてもOBS内の動物は動きます。設定を変えたら新しいURLを貼り直してください。', selected:'種類選択中', allSpecies:'すべての種', motion:'動き', try:'試す', selectMotions:'全部', noMotions:'解除', moveUp:'上へ', moveDown:'下へ', selectedOrder:'選択中の表示順', inherited:'継承', defaultSize:'基本', removeOverride:'解除', noPresets:'保存済みを選択', presetSaved:'プリセットを保存しました。', presetLoaded:'プリセットを読み込みました。', presetRenamed:'名前を変更しました。', presetDeleted:'削除しました。', presetDuplicated:'複製しました。', presetNameRequired:'プリセット名を入力してください。', choosePreset:'プリセットを選択してください。', deleteConfirm:'このプリセットを削除しますか？', resetConfirm:'編集中の設定を初期値に戻しますか？', resetDone:'編集中の設定を初期値に戻しました。', importDone:'URLから設定を読み込みました。', importFailed:'URLを読み込めませんでした。', copied:'OBS用URLをコピーしました。', copyFailed:'コピーできませんでした。上のURLを選択して手動でコピーしてください。', storageFailed:'ブラウザへの保存ができません。設定の編集とURLコピーは使えます。', invalidConfig:'修正が必要な設定があります。URLを発行できません。', invalidSaved:'保存済みの下書きかプリセットが壊れていたため読み込みませんでした。', previewIdle:'準備完了', previewInvalid:'設定を確認', previewPaused:'一時停止中', previewPlaying:'再生中', previewWaiting:'待機中', previewLoading:'読み込み中', noAnimals:'動物を1種類以上選んでください。', noMotion:'選択中の毛色には動きを1つ以上選んでください。', speciesAll:'この種を全部', speciesNone:'この種を解除', previewAtSize:'実際のサイズ', noSelected:'動物が選ばれていません', fixedPresets:['10秒','30–60秒','60–180秒','5分'], duplicateSuffix:' コピー'
  }
};
const t = (key) => labels[language][key] ?? key;
const name = (item) => item?.name?.[language] || item?.name?.ja || item?.id || '';
const speciesName = (id) => name(groups.get(id)) || id;
const validConfig = (value) => { try { return validateConfig(value).length === 0; } catch { return false; } };
function editableDraft(value) {
  const record = (item) => item !== null && typeof item === 'object' && !Array.isArray(item);
  if (!value || typeof value !== 'object' || value.version !== 1 || !Array.isArray(value.variants) ||
      !record(value.motionsByVariant) || !record(value.interval) || !record(value.size) ||
      !record(value.size.bySpecies) || !record(value.size.byVariant) || !record(value.area)) return false;
  if (value.variants.some((id) => !catalog.has(id)) || new Set(value.variants).size !== value.variants.length) return false;
  if (Object.keys(value.motionsByVariant).some((id) => !value.variants.includes(id))) return false;
  if (value.variants.some((id) => !Array.isArray(value.motionsByVariant[id]) || value.motionsByVariant[id].some((motion) => !catalog.get(id).motions.some((item) => item.id === motion)))) return false;
  if (Object.keys(value.size.bySpecies).some((id) => !groups.has(id)) || Object.keys(value.size.byVariant).some((id) => !catalog.has(id))) return false;
  try {
    return validateConfig(value).every(({ path }) => path === 'variants' || path.startsWith('motionsByVariant.') || path === 'interval' || path === 'size' || path.startsWith('size.') || path === 'area');
  } catch { return false; }
}
function errorText(error) {
  if (!error) return '';
  if (language === 'ja') return error.message;
  const path = error.path;
  if (path === 'variants') return t('noAnimals');
  if (path.startsWith('motionsByVariant')) return t('noMotion');
  if (path === 'interval') return 'Use whole seconds from 1 to 86400, with the minimum no greater than the maximum.';
  if (path.startsWith('size')) return 'Enter whole pixel sizes from 80 to 600.';
  if (path === 'area') return 'Keep the display area inside the canvas, with width and height at least 10%.';
  return 'Check this setting.';
}

function showStatus(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); storageWarning = ''; return true; }
  catch { storageWarning = t('storageFailed'); showStatus(storageWarning, true); return false; }
}
function readStorage(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function applyLanguage() {
  document.documentElement.lang = language;
  document.title = language === 'en' ? 'Use in OBS | Animals Desktop - for Real' : 'OBSで使う | Animals Desktop - for Real';
  $('language').value = language;
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('#interval-presets button').forEach((node, index) => { node.textContent = t('fixedPresets')[index]; });
  $('import-url').placeholder = 'https://…/overlay.html#c=…';
  $('preset-name').placeholder = language === 'en' ? 'Example: Stream' : '例：配信用';
  renderSpeciesFilter(); renderVariants(); renderOrder(); renderSizeOverrides(); renderPresets();
  refreshValidation();
}
function renderSpeciesFilter() {
  $('species-filter').replaceChildren(new Option(t('allSpecies'), 'all'), ...species.map((item) => new Option(name(item), item.id)));
  $('species-filter').value = filter;
  $('select-species').hidden = filter === 'all';
  $('bulk-motion').querySelector('legend').textContent = filter === 'all' ? (language === 'en' ? 'Apply motions to all selected animals' : '選択中の全動物に動きを一括適用') : `${speciesName(filter)} · ${t('motion')}`;
}
function ensureSelected(id) {
  const variant = catalog.get(id);
  if (!variant || config.variants.includes(id)) return;
  config.variants.push(id);
  config.motionsByVariant[id] = variant.motions.map((motion) => motion.id);
}
function deselect(id) {
  config.variants = config.variants.filter((item) => item !== id);
  delete config.motionsByVariant[id];
}
function renderVariants() {
  const visible = filter === 'all' ? variants : variants.filter((item) => item.species === filter);
  $('selected-count').textContent = `${config.variants.length} / ${variants.length} ${t('selected')}`;
  $('variant-list').innerHTML = visible.map((variant) => {
    const selected = config.variants.includes(variant.id);
    const allowed = config.motionsByVariant[variant.id] || [];
    const motions = selected ? `<div class="motion-set"><div class="motion-header"><span>${t('motion')}</span><span class="motion-actions"><button type="button" class="text-button" data-action="all-motion" data-id="${escaped(variant.id)}">${t('selectMotions')}</button><button type="button" class="text-button" data-action="no-motion" data-id="${escaped(variant.id)}">${t('noMotions')}</button></span></div><div class="motion-grid">${variant.motions.map((motion) => `<div class="motion-row"><label><input type="checkbox" data-action="motion" data-id="${escaped(variant.id)}" data-motion="${escaped(motion.id)}" ${allowed.includes(motion.id) ? 'checked' : ''}><span>${escaped(name(motion))}</span></label><button type="button" class="try-button" data-action="try" data-id="${escaped(variant.id)}" data-motion="${escaped(motion.id)}">${t('try')}</button></div>`).join('')}</div></div>` : '';
    return `<article class="variant-card ${selected ? 'selected' : ''}"><label class="variant-main"><input type="checkbox" data-action="variant" data-id="${escaped(variant.id)}" ${selected ? 'checked' : ''}><img src="${escaped(variant.image)}" alt="" loading="lazy"><span class="variant-label"><strong>${escaped(name(variant))}</strong><small>${escaped(speciesName(variant.species))}</small></span></label>${motions}</article>`;
  }).join('');
}
function renderOrder() {
  $('selected-order').innerHTML = `<h3>${t('selectedOrder')}</h3>${config.variants.length ? `<div class="order-list">${config.variants.map((id, index) => `<div class="order-item"><span>${index + 1}. ${escaped(name(catalog.get(id)))}</span><button type="button" data-shift="-1" data-index="${index}" aria-label="${t('moveUp')}: ${escaped(name(catalog.get(id)))}" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-shift="1" data-index="${index}" aria-label="${t('moveDown')}: ${escaped(name(catalog.get(id)))}" ${index === config.variants.length - 1 ? 'disabled' : ''}>↓</button></div>`).join('')}</div>` : `<p class="hint">${t('noSelected')}</p>`}`;
}
function renderSizeOverrides() {
  const source = (variant) => config.size.byVariant[variant.id] != null ? (language === 'en' ? 'Coat' : '毛色') : config.size.bySpecies[variant.species] != null ? speciesName(variant.species) : t('defaultSize');
  const [canvasWidth, canvasHeight] = ($('resolution').value || '1920x1080').split('x').map(Number);
  const actualSize = (variant) => {
    const requested = sizeFor(config, variant);
    if (!Number.isFinite(requested) || !Number.isFinite(config.area.width) || !Number.isFinite(config.area.height)) return '?';
    return Math.round(Math.min(requested * canvasHeight / 1080, canvasHeight * config.area.height / 100 * .9, canvasWidth * config.area.width / 100 * .9 * 9 / 16));
  };
  $('size-overrides').innerHTML = species.map((group) => `<div class="override-group"><h4>${escaped(name(group))}</h4><div class="override-row"><label>${language === 'en' ? 'Species size' : '種別サイズ'}<span class="inherited">${config.size.bySpecies[group.id] == null ? `${t('inherited')}: ${config.size.base} px` : `${config.size.bySpecies[group.id]} px`}</span></label><input type="number" min="80" max="600" step="1" data-size-kind="species" data-id="${escaped(group.id)}" value="${config.size.bySpecies[group.id] ?? ''}" placeholder="${config.size.base}"><button type="button" class="text-button" data-clear-size="species" data-id="${escaped(group.id)}">${t('removeOverride')}</button></div>${variants.filter((variant) => variant.species === group.id).map((variant) => `<div class="override-row"><label>${escaped(name(variant))}<span class="inherited">${t('previewAtSize')}: ${actualSize(variant)} px · ${escaped(source(variant))}</span></label><input type="number" min="80" max="600" step="1" data-size-kind="variant" data-id="${escaped(variant.id)}" value="${config.size.byVariant[variant.id] ?? ''}" placeholder="${config.size.bySpecies[group.id] ?? config.size.base}"><button type="button" class="text-button" data-clear-size="variant" data-id="${escaped(variant.id)}">${t('removeOverride')}</button></div>`).join('')}</div>`).join('');
}
function syncForm() {
  $('order').value = config.order;
  $('avoid-repeat').checked = config.avoidRepeat;
  $('start').value = config.start;
  $('interval-mode').value = intervalMode;
  $('min-sec').value = config.interval.minSec ?? '';
  $('max-sec').value = config.interval.maxSec ?? '';
  $('max-wrap').hidden = $('interval-mode').value === 'fixed';
  $('base-size').value = config.size.base ?? '';
  $('base-size-preset').value = [160,240,320,400].includes(config.size.base) ? String(config.size.base) : 'custom';
  $('side').value = config.side;
  $('renderer').value = config.renderer;
  $('opacity').value = config.opacity;
  $('opacity-value').textContent = `${config.opacity}%`;
  for (const key of ['x','y','width','height']) $(`area-${key}`).value = config.area[key] ?? '';
  positionArea();
}
function positionArea() {
  const area = config.area;
  const box = $('area-box');
  box.style.left = `${clamp(Number(area.x) || 0, 0, 100)}%`;
  box.style.top = `${clamp(Number(area.y) || 0, 0, 100)}%`;
  box.style.width = `${clamp(Number(area.width) || 10, 10, 100)}%`;
  box.style.height = `${clamp(Number(area.height) || 10, 10, 100)}%`;
}
function setError(id, message) { const node = $(id); node.textContent = message; node.hidden = !message; }
function refreshValidation() {
  let errors;
  try { errors = validateConfig(config); }
  catch (error) { errors = [{ path: '', message: error.message }]; }
  const first = (prefix) => errors.find((item) => item.path === prefix || item.path.startsWith(`${prefix}.`) || item.path.startsWith(`${prefix}[`));
  setError('animal-error', errorText(first('variants') || first('motionsByVariant')));
  setError('interval-error', errorText(first('interval')));
  setError('area-error', errorText(first('area')));
  setError('size-error', errorText(first('size')));
  const otherError = errors.find((item) => !['variants','motionsByVariant','interval','area','size'].some((p) => item.path.startsWith(p)));
  setError('config-error', errors.length ? `${t('invalidConfig')}${otherError ? ` ${errorText(otherError)}` : ''}` : '');
  $('copy-url').disabled = errors.length > 0;
  $('preset-save').disabled = errors.length > 0;
  $('play-now').disabled = errors.length > 0;
  $('preview-resume').disabled = errors.length > 0;
  if (errors.length) {
    $('overlay-url').value = '';
    playback?.pause();
    $('preview-state').textContent = t('previewInvalid');
    return false;
  }
  try { $('overlay-url').value = makeOverlayUrl(config); }
  catch (error) { $('overlay-url').value = ''; $('copy-url').disabled = true; setError('config-error', error.message); return false; }
  $('preview-state').textContent = previewPaused ? t('previewPaused') : ({ waiting:t('previewWaiting'), loading:t('previewLoading'), playing:t('previewPlaying'), paused:t('previewPaused') })[previewPhase] || t('previewIdle');
  return true;
}
function commit({ cards = false, sizes = false, order = false } = {}) {
  previewPaused = false;
  if (cards) renderVariants();
  if (cards || order) renderOrder();
  if (sizes) renderSizeOverrides();
  $('selected-count').textContent = `${config.variants.length} / ${variants.length} ${t('selected')}`;
  saveStorage(DRAFT_KEY, config);
  if (refreshValidation()) {
    try { playback?.configure(config); }
    catch (error) { showStatus(error.message, true); }
  }
}
function restoreConfig(next) {
  if (!validConfig(next)) { showStatus(t('invalidSaved'), true); return false; }
  config = copy(next);
  intervalMode = config.interval.minSec === config.interval.maxSec ? 'fixed' : 'range';
  previewPaused = false;
  syncForm(); renderVariants(); renderOrder(); renderSizeOverrides();
  commit();
  return true;
}

function bindAnimals() {
  $('species-filter').addEventListener('change', () => { filter = $('species-filter').value; renderSpeciesFilter(); renderVariants(); });
  $('select-all').addEventListener('click', () => { variants.forEach((variant) => ensureSelected(variant.id)); commit({ cards:true }); });
  $('clear-all').addEventListener('click', () => { config.variants = []; config.motionsByVariant = {}; commit({ cards:true }); });
  $('select-species').addEventListener('click', () => { variants.filter((variant) => variant.species === filter).forEach((variant) => ensureSelected(variant.id)); commit({ cards:true }); });
  $('variant-list').addEventListener('change', (event) => {
    const { action, id, motion } = event.target.dataset;
    if (action === 'variant') { event.target.checked ? ensureSelected(id) : deselect(id); commit({ cards:true }); }
    if (action === 'motion') {
      const allowed = config.motionsByVariant[id] || [];
      config.motionsByVariant[id] = catalog.get(id).motions.map((item) => item.id).filter((motionId) => motionId === motion ? event.target.checked : allowed.includes(motionId));
      commit({ cards:true });
    }
  });
  $('variant-list').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const { action, id, motion } = button.dataset;
    if (action === 'try') {
      if (!refreshValidation()) { showStatus(t('invalidConfig'), true); return; }
      previewPaused = true;
      try { playback?.playNow(id, motion); $('preview-state').textContent = t('previewPlaying'); }
      catch (error) { showStatus(error.message, true); }
      return;
    }
    config.motionsByVariant[id] = action === 'all-motion' ? catalog.get(id).motions.map((item) => item.id) : [];
    commit({ cards:true });
  });
  $('selected-order').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-shift]'); if (!button) return;
    const from = Number(button.dataset.index), to = from + Number(button.dataset.shift);
    if (to < 0 || to >= config.variants.length) return;
    [config.variants[from], config.variants[to]] = [config.variants[to], config.variants[from]];
    commit({ order:true });
  });
  $('motions-all').addEventListener('click', () => { for (const id of config.variants) if (filter === 'all' || catalog.get(id).species === filter) config.motionsByVariant[id] = catalog.get(id).motions.map((motion) => motion.id); commit({ cards:true }); });
  $('motions-bottom').addEventListener('click', () => { for (const id of config.variants) if (filter === 'all' || catalog.get(id).species === filter) config.motionsByVariant[id] = catalog.get(id).motions.filter((motion) => motion.id === 'bottom-pop').map((motion) => motion.id); commit({ cards:true }); });
}
function bindValues() {
  for (const [id, apply] of Object.entries({ order:(value) => { config.order = value; }, start:(value) => { config.start = value; }, side:(value) => { config.side = value; }, renderer:(value) => { config.renderer = value; } })) $(id).addEventListener('change', (event) => { apply(event.target.value); commit(); });
  $('avoid-repeat').addEventListener('change', (event) => { config.avoidRepeat = event.target.checked; commit(); });
  $('interval-mode').addEventListener('change', (event) => { intervalMode = event.target.value; $('max-wrap').hidden = intervalMode === 'fixed'; if (intervalMode === 'fixed') config.interval.maxSec = config.interval.minSec; else if (config.interval.maxSec <= config.interval.minSec) config.interval.maxSec = Math.min(86400, Math.max(config.interval.minSec + 1, 180)); syncForm(); commit(); });
  $('min-sec').addEventListener('input', (event) => { config.interval.minSec = event.target.value === '' ? null : Number(event.target.value); if ($('interval-mode').value === 'fixed') config.interval.maxSec = config.interval.minSec; commit(); });
  $('max-sec').addEventListener('input', (event) => { config.interval.maxSec = event.target.value === '' ? null : Number(event.target.value); commit(); });
  $('interval-presets').addEventListener('click', (event) => { const button = event.target.closest('button[data-min]'); if (!button) return; config.interval = { minSec:Number(button.dataset.min), maxSec:Number(button.dataset.max) }; intervalMode = config.interval.minSec === config.interval.maxSec ? 'fixed' : 'range'; syncForm(); commit(); });
  $('base-size-preset').addEventListener('change', (event) => { if (event.target.value !== 'custom') { config.size.base = Number(event.target.value); syncForm(); commit({ sizes:true }); } else $('base-size').focus(); });
  $('base-size').addEventListener('input', (event) => { config.size.base = event.target.value === '' ? null : Number(event.target.value); $('base-size-preset').value = [160,240,320,400].includes(config.size.base) ? String(config.size.base) : 'custom'; commit({ sizes:true }); });
  $('opacity').addEventListener('input', (event) => { config.opacity = Number(event.target.value); $('opacity-value').textContent = `${config.opacity}%`; commit(); });
  for (const key of ['x','y','width','height']) $(`area-${key}`).addEventListener('input', (event) => { config.area[key] = event.target.value === '' ? null : Number(event.target.value); positionArea(); commit({ sizes:true }); });
  $('reset-area').addEventListener('click', () => { config.area = { x:0, y:0, width:100, height:100 }; syncForm(); commit({ sizes:true }); });
  $('size-overrides').addEventListener('input', (event) => { const { sizeKind, id } = event.target.dataset; if (!sizeKind) return; const target = sizeKind === 'species' ? config.size.bySpecies : config.size.byVariant; if (event.target.value === '') delete target[id]; else target[id] = Number(event.target.value); commit(); });
  $('size-overrides').addEventListener('change', (event) => { if (event.target.dataset.sizeKind) renderSizeOverrides(); });
  $('size-overrides').addEventListener('click', (event) => { const button = event.target.closest('button[data-clear-size]'); if (!button) return; delete (button.dataset.clearSize === 'species' ? config.size.bySpecies : config.size.byVariant)[button.dataset.id]; commit({ sizes:true }); });
  $('clear-overrides').addEventListener('click', () => { config.size.bySpecies = {}; config.size.byVariant = {}; commit({ sizes:true }); });
}
function bindAreaDrag() {
  const box = $('area-box'), surface = $('preview-surface');
  box.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); box.setPointerCapture(event.pointerId);
    drag = { mode:event.target.id === 'area-handle' ? 'resize' : 'move', x:event.clientX, y:event.clientY, area:copy(config.area) };
  });
  box.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = (event.clientX - drag.x) * 100 / surface.clientWidth;
    const dy = (event.clientY - drag.y) * 100 / surface.clientHeight;
    const a = drag.area;
    if (drag.mode === 'move') { config.area.x = Math.round(clamp(a.x + dx,0,100-a.width)*10)/10; config.area.y = Math.round(clamp(a.y + dy,0,100-a.height)*10)/10; }
    else { config.area.width = Math.round(clamp(a.width + dx,10,100-a.x)*10)/10; config.area.height = Math.round(clamp(a.height + dy,10,100-a.y)*10)/10; }
    for (const key of ['x','y','width','height']) $(`area-${key}`).value = config.area[key];
    positionArea();
  });
  const end = () => { if (!drag) return; drag = null; commit({ sizes:true }); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
}
function renderPresets() {
  const selected = activePreset;
  $('preset-select').replaceChildren(new Option(t('noPresets'), ''), ...presets.map((preset) => new Option(preset.name, preset.id)));
  $('preset-select').value = presets.some((preset) => preset.id === selected) ? selected : '';
}
function savePresets() { saveStorage(PRESETS_KEY, presets); renderPresets(); }
function selectedPreset() { return presets.find((item) => item.id === $('preset-select').value); }
function bindPresets() {
  $('preset-select').addEventListener('change', () => { activePreset = $('preset-select').value; $('preset-name').value = selectedPreset()?.name || ''; });
  $('preset-save').addEventListener('click', () => {
    if (!validConfig(config)) return showStatus(t('invalidConfig'), true);
    const label = $('preset-name').value.trim(); if (!label) return showStatus(t('presetNameRequired'), true);
    const current = selectedPreset();
    if (current) { current.name = label; current.config = copy(config); activePreset = current.id; }
    else { const entry = { id:crypto.randomUUID(), name:label, config:copy(config) }; presets.push(entry); activePreset = entry.id; }
    savePresets(); showStatus(t('presetSaved'));
  });
  $('preset-load').addEventListener('click', () => { const current = selectedPreset(); if (!current) return showStatus(t('choosePreset'), true); if (restoreConfig(current.config)) showStatus(t('presetLoaded')); });
  $('preset-duplicate').addEventListener('click', () => { const current = selectedPreset(); if (!current) return showStatus(t('choosePreset'), true); const entry = { id:crypto.randomUUID(), name:current.name + t('duplicateSuffix'), config:copy(current.config) }; presets.push(entry); activePreset = entry.id; $('preset-name').value = entry.name; savePresets(); showStatus(t('presetDuplicated')); });
  $('preset-rename').addEventListener('click', () => { const current = selectedPreset(); if (!current) return showStatus(t('choosePreset'), true); const label = $('preset-name').value.trim(); if (!label) return showStatus(t('presetNameRequired'), true); current.name = label; savePresets(); showStatus(t('presetRenamed')); });
  $('preset-delete').addEventListener('click', () => { const current = selectedPreset(); if (!current) return showStatus(t('choosePreset'), true); if (!confirm(t('deleteConfirm'))) return; presets = presets.filter((item) => item.id !== current.id); activePreset = ''; $('preset-name').value = ''; savePresets(); showStatus(t('presetDeleted')); });
  $('reset-config').addEventListener('click', () => { if (!confirm(t('resetConfirm'))) return; activePreset = ''; $('preset-name').value = ''; renderPresets(); restoreConfig(makeDefaultConfig()); showStatus(t('resetDone')); });
}
function encodedFromInput(value) {
  const input = value.trim(); if (!input) throw new Error(t('importFailed'));
  if (/^[A-Za-z0-9_-]+$/.test(input)) return input;
  const url = new URL(input);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const encoded = fragment.get('c') || url.searchParams.get('c');
  if (!encoded) throw new Error(t('importFailed'));
  return encoded;
}
function bindSharing() {
  $('import-button').addEventListener('click', () => {
    try { restoreConfig(parseConfig(encodedFromInput($('import-url').value))); activePreset = ''; $('preset-name').value = ''; renderPresets(); showStatus(t('importDone')); }
    catch (error) { showStatus(`${t('importFailed')}${language === 'ja' ? ` ${error.message}` : ''}`, true); }
  });
  $('copy-url').addEventListener('click', async () => {
    const value = $('overlay-url').value; if (!value) return;
    try { await navigator.clipboard.writeText(value); showStatus(t('copied')); }
    catch { $('overlay-url').focus(); $('overlay-url').select(); showStatus(t('copyFailed'), true); }
  });
}
function bindPreview() {
  const stored = readStorage(UI_KEY, {});
  $('resolution').value = ['1920x1080','1280x720','1080x1920'].includes(stored.resolution) ? stored.resolution : '1920x1080';
  $('preview-bg').value = ['light','dark','checker'].includes(stored.background) ? stored.background : 'light';
  const update = () => {
    $('preview-surface').className = `preview-surface bg-${$('preview-bg').value}${$('resolution').value === '1080x1920' ? ' portrait' : ''}`;
    saveStorage(UI_KEY, { resolution:$('resolution').value, background:$('preview-bg').value });
    renderSizeOverrides();
    if (refreshValidation() && !previewPaused) playback?.configure(config);
  };
  $('resolution').addEventListener('change', update);
  $('preview-bg').addEventListener('change', update);
  $('preview-surface').className = `preview-surface bg-${$('preview-bg').value}${$('resolution').value === '1080x1920' ? ' portrait' : ''}`;
  playback = createPlayback($('preview-stage'), { onState:(state) => {
    const value = typeof state === 'string' ? state : state?.phase || state?.state || state?.status || '';
    previewPhase = value;
    if (!previewPaused && validateConfig(config).length === 0) $('preview-state').textContent = ({ waiting:t('previewWaiting'), loading:t('previewLoading'), playing:t('previewPlaying'), paused:t('previewPaused') })[value] || t('previewIdle');
  }});
  $('play-now').addEventListener('click', () => { if (!refreshValidation()) return; previewPaused = false; playback.playNow(); $('preview-state').textContent = t('previewPlaying'); });
  $('preview-pause').addEventListener('click', () => { previewPaused = true; playback.pause(); $('preview-state').textContent = t('previewPaused'); });
  $('preview-resume').addEventListener('click', () => { if (!refreshValidation()) return; previewPaused = false; playback.resume(); $('preview-state').textContent = t('previewWaiting'); });
  window.addEventListener('pagehide', () => playback.pause());
  window.addEventListener('pageshow', (event) => { if (event.persisted && validConfig(config)) { previewPaused = false; playback.configure(config); } });
}

function init() {
  const saved = readStorage(DRAFT_KEY, null);
  const invalidSaved = saved && !editableDraft(saved);
  if (saved && !invalidSaved) config = saved;
  intervalMode = config.interval.minSec === config.interval.maxSec ? 'fixed' : 'range';
  const storedPresets = readStorage(PRESETS_KEY, []);
  if (Array.isArray(storedPresets)) presets = storedPresets.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && validConfig(item.config));
  bindAnimals(); bindValues(); bindAreaDrag(); bindPresets(); bindSharing(); bindPreview();
  $('language').addEventListener('change', () => { language = $('language').value; const url = new URL(location.href); url.searchParams.set('lang', language); history.replaceState(null, '', url); applyLanguage(); });
  applyLanguage(); syncForm(); refreshValidation();
  if (validateConfig(config).length === 0) playback.configure(config);
  if (invalidSaved || (Array.isArray(storedPresets) && presets.length !== storedPresets.length)) showStatus(t('invalidSaved'), true);
  window.addEventListener('error', (event) => { if (event.message) showStatus(event.message, true); });
}
init();
