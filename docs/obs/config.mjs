import { species, variants } from './catalog.mjs';

const variantById = new Map(variants.map((variant) => [variant.id, variant]));
const speciesIds = new Set(species.map((group) => group.id));
const sizeRange = (value) => Number.isInteger(value) && value >= 80 && value <= 600;
const number = (value) => typeof value === 'number' && Number.isFinite(value);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export function makeDefaultConfig() {
  return {
    version: 1,
    variants: variants.map((variant) => variant.id),
    motionsByVariant: Object.fromEntries(variants.map((variant) => [
      variant.id, variant.motions.map((motion) => motion.id),
    ])),
    order: 'random',
    avoidRepeat: true,
    interval: { minSec: 60, maxSec: 180 },
    start: 'immediate',
    size: { base: 240, bySpecies: {}, byVariant: {} },
    side: 'random',
    area: { x: 0, y: 0, width: 100, height: 100 },
    opacity: 100,
    renderer: 'auto',
  };
}

export function sizeFor(config, variant) {
  return config.size.byVariant[variant.id] ?? config.size.bySpecies[variant.species] ?? config.size.base;
}

export function validateConfig(value) {
  const errors = [];
  const add = (path, message) => errors.push({ path, message });
  if (!object(value)) return [{ path: '', message: '設定データが正しくありません。' }];
  const allowed = new Set(['version', 'variants', 'motionsByVariant', 'order', 'avoidRepeat',
    'interval', 'start', 'size', 'side', 'area', 'opacity', 'renderer']);
  for (const key of Object.keys(value)) if (!allowed.has(key)) add(key, '対応していない設定です。');
  if (value.version !== 1) add('version', '対応していない設定の版です。');
  if (!Array.isArray(value.variants) || !value.variants.length || value.variants.length > variants.length) {
    add('variants', '動物を1種類以上選んでください。');
  } else {
    const seen = new Set();
    for (const id of value.variants) {
      if (typeof id !== 'string' || !variantById.has(id)) add('variants', '収録されていない動物が含まれています。');
      if (seen.has(id)) add('variants', '同じ動物が重複しています。');
      seen.add(id);
    }
  }
  if (!object(value.motionsByVariant)) {
    add('motionsByVariant', '動きを選んでください。');
  } else {
    const selected = new Set(Array.isArray(value.variants) ? value.variants : []);
    for (const id of selected) {
      const variant = variantById.get(id);
      if (!variant) continue;
      const motions = value.motionsByVariant[id];
      const approved = new Set(variant.motions.map((motion) => motion.id));
      if (!Array.isArray(motions) || !motions.length || motions.length > approved.size) {
        add(`motionsByVariant.${id}`, 'この動物の動きを1つ以上選んでください。');
      } else {
        const seen = new Set();
        for (const motion of motions) {
          if (typeof motion !== 'string' || !approved.has(motion)) add(`motionsByVariant.${id}`, '選べない動きが含まれています。');
          if (seen.has(motion)) add(`motionsByVariant.${id}`, '同じ動きが重複しています。');
          seen.add(motion);
        }
      }
    }
    for (const id of Object.keys(value.motionsByVariant)) {
      if (!selected.has(id)) add(`motionsByVariant.${id}`, '選択していない動物の動きが含まれています。');
    }
  }
  if (!['random', 'sequential'].includes(value.order)) add('order', '表示順を選んでください。');
  if (typeof value.avoidRepeat !== 'boolean') add('avoidRepeat', '連続表示の設定が正しくありません。');
  if (!object(value.interval) || !Number.isInteger(value.interval.minSec) ||
      !Number.isInteger(value.interval.maxSec) || value.interval.minSec < 1 ||
      value.interval.maxSec > 86400 || value.interval.minSec > value.interval.maxSec) {
    add('interval', '間隔は1〜86400秒で、最短が最長以下になるようにしてください。');
  }
  if (!['immediate', 'wait'].includes(value.start)) add('start', '初回表示の設定が正しくありません。');
  if (!object(value.size) || !sizeRange(value.size.base) ||
      !object(value.size.bySpecies) || !object(value.size.byVariant)) {
    add('size', 'サイズは80〜600 pxで指定してください。');
  } else {
    for (const [id, size] of Object.entries(value.size.bySpecies)) {
      if (!speciesIds.has(id) || !sizeRange(size)) add(`size.bySpecies.${id}`, '種類別サイズが正しくありません。');
    }
    for (const [id, size] of Object.entries(value.size.byVariant)) {
      if (!variantById.has(id) || !sizeRange(size)) add(`size.byVariant.${id}`, '毛色別サイズが正しくありません。');
    }
  }
  if (!['left', 'right', 'random'].includes(value.side)) add('side', '出現する側を選んでください。');
  if (!object(value.area) || !['x', 'y', 'width', 'height'].every((key) => number(value.area[key])) ||
      value.area.x < 0 || value.area.y < 0 || value.area.width < 10 || value.area.height < 10 ||
      value.area.x + value.area.width > 100 || value.area.y + value.area.height > 100) {
    add('area', '表示エリアを画面の内側に指定してください。');
  }
  if (!Number.isInteger(value.opacity) || value.opacity < 20 || value.opacity > 100) {
    add('opacity', '不透明度は20〜100%で指定してください。');
  }
  if (!['auto', 'png'].includes(value.renderer)) add('renderer', '再生方法を選んでください。');
  return errors;
}

function canonicalConfig(config) {
  const selected = config.variants;
  const motionsByVariant = Object.fromEntries(selected.map((id) => {
    const approved = variantById.get(id).motions.map((motion) => motion.id);
    return [id, approved.filter((motion) => config.motionsByVariant[id].includes(motion))];
  }));
  const bySpecies = Object.fromEntries(species.filter(({ id }) => own(config.size.bySpecies, id))
    .map(({ id }) => [id, config.size.bySpecies[id]]));
  const byVariant = Object.fromEntries(variants.filter(({ id }) => own(config.size.byVariant, id))
    .map(({ id }) => [id, config.size.byVariant[id]]));
  return {
    version: 1,
    variants: [...selected],
    motionsByVariant,
    order: config.order,
    avoidRepeat: config.avoidRepeat,
    interval: { minSec: config.interval.minSec, maxSec: config.interval.maxSec },
    start: config.start,
    size: { base: config.size.base, bySpecies, byVariant },
    side: config.side,
    area: { x: config.area.x, y: config.area.y, width: config.area.width, height: config.area.height },
    opacity: config.opacity,
    renderer: config.renderer,
  };
}

export function serializeConfig(config) {
  const errors = validateConfig(config);
  if (errors.length) throw new Error(errors[0].message);
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalConfig(config)));
  const base64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (base64.length > 16 * 1024) throw new Error('設定が長すぎます。');
  return base64;
}

export function parseConfig(encoded) {
  if (typeof encoded !== 'string' || !encoded || encoded.length > 16 * 1024 || !/^[\w-]+$/.test(encoded)) {
    throw new Error('URLの設定を読み取れません。');
  }
  let config;
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    config = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('URLの設定を読み取れません。');
  }
  const errors = validateConfig(config);
  if (errors.length) throw new Error(errors[0].message);
  return canonicalConfig(config);
}

export function makeOverlayUrl(config) {
  const url = new URL('overlay.html', import.meta.url);
  url.hash = `c=${serializeConfig(config)}`;
  return url.href;
}
