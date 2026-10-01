import { variants } from './catalog.mjs?v=20261001-zoo';

const byId = new Map(variants.map((variant) => [variant.id, variant]));

function boundedRandom(random) {
  const value = random();
  return Number.isFinite(value) ? Math.min(0.999999999999, Math.max(0, value)) : 0;
}

export function chooseDelayMs(interval, random = Math.random) {
  const { minSec, maxSec } = interval;
  return Math.round((minSec + boundedRandom(random) * (maxSec - minSec)) * 1000);
}

export function createSelector(config, random = Math.random) {
  let variantIndex = 0;
  const motionIndices = new Map();
  let lastVariantId = null;
  let lastMotionId = null;

  return {
    next() {
      const selected = config.variants;
      if (!selected.length) return null;
      let id;
      if (config.order === 'sequential') {
        id = selected[variantIndex % selected.length];
        variantIndex += 1;
      } else {
        const pool = config.avoidRepeat && selected.length > 1
          ? selected.filter((candidate) => candidate !== lastVariantId) : selected;
        id = pool[Math.floor(boundedRandom(random) * pool.length)];
      }
      const variant = byId.get(id);
      const motions = config.motionsByVariant[id];
      let motion;
      if (config.order === 'sequential') {
        const index = motionIndices.get(id) ?? 0;
        motion = motions[index % motions.length];
        motionIndices.set(id, index + 1);
      } else {
        const pool = config.avoidRepeat && motions.length > 1
          ? motions.filter((candidate) => candidate !== lastMotionId) : motions;
        motion = pool[Math.floor(boundedRandom(random) * pool.length)];
      }
      lastVariantId = id;
      lastMotionId = motion;
      return { variant, motion: variant.motions.find(({ id: motionId }) => motionId === motion) };
    },
  };
}
