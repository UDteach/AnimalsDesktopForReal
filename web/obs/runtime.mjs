import { makeDefaultConfig, serializeConfig, parseConfig, sizeFor } from './config.mjs?v=20260927-mp4';
import { chooseDelayMs, createSelector } from './scheduler.mjs?v=20260927-mp4';
import { createRenderer } from './shared/overlay/renderer.mjs?v=20260927-mp4';
import { variants } from './catalog.mjs?v=20260927-mp4';

export function createPlayback(stage, { onState = () => {}, random = Math.random, allowOpaqueVideo = false } = {}) {
  let config = makeDefaultConfig();
  let selector = createSelector(config, random);
  let nextTimer = null;
  let nextAt = null;
  let paused = true;
  let destroyed = false;
  let previewOnly = false;
  let current = null;
  let state = 'paused';

  function emit(phase, extra = {}) {
    state = phase;
    onState({ phase, variant: current?.variant ?? null, motion: current?.motion ?? null,
      nextAt, ...extra });
  }

  function clearWait() {
    clearTimeout(nextTimer);
    nextTimer = null;
    nextAt = null;
  }

  const renderer = createRenderer(stage, {
    allowOpaqueVideo,
    onFormat(details) { if (!destroyed) emit(state, details); },
    onEnded(result) {
      renderer.stop();
      current = null;
      if (destroyed || paused) return;
      if (previewOnly) {
        paused = true;
        previewOnly = false;
        emit('paused', { result });
      } else {
        schedule(result);
      }
    },
    onError(reason) { if (!destroyed) emit(state, { error: reason }); },
  });

  function run(choice) {
    if (destroyed || paused) return;
    clearWait();
    current = choice ?? selector.next();
    if (!current || !current.motion) {
      paused = true;
      emit('paused', { error: 'selection' });
      return;
    }
    const side = config.side === 'random' ? (random() < 0.5 ? 'left' : 'right') : config.side;
    emit('playing');
    renderer.play({ ...current, sizePx: sizeFor(config, current.variant), side,
      area: config.area, opacity: config.opacity, renderer: config.renderer });
  }

  function schedule(result) {
    if (destroyed || paused) return;
    clearWait();
    const delay = chooseDelayMs(config.interval, random);
    nextAt = Date.now() + delay;
    emit('waiting', { result });
    nextTimer = setTimeout(() => run(), delay);
  }

  function configure(value) {
    if (destroyed) return;
    // Round-trip makes the active settings immutable and validates all external input.
    config = parseConfig(serializeConfig(value));
    selector = createSelector(config, random);
    paused = false;
    previewOnly = false;
    current = null;
    clearWait();
    renderer.stop();
    if (config.start === 'immediate') run();
    else schedule();
  }

  function playNow(variantId, motionId) {
    if (destroyed) return;
    if (variantId || motionId) {
      const variant = selectorVariant(variantId);
      const motion = variant?.motions.find(({ id }) => id === motionId);
      if (!variant || !motion) return;
      previewOnly = true;
      paused = false;
      renderer.stop();
      run({ variant, motion });
      return;
    }
    previewOnly = false;
    paused = false;
    renderer.stop();
    run();
  }

  function selectorVariant(id) {
    // Only configured animals may be previewed or shown.
    if (!config.variants.includes(id)) return null;
    return variants.find((variant) => variant.id === id) ?? null;
  }

  function pause() {
    if (destroyed) return;
    paused = true;
    previewOnly = false;
    current = null;
    clearWait();
    renderer.stop();
    emit('paused');
  }

  function resume() {
    if (destroyed) return;
    paused = false;
    previewOnly = false;
    current = null;
    clearWait();
    renderer.stop();
    if (config.start === 'immediate') run();
    else schedule();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    paused = true;
    clearWait();
    renderer.destroy();
  }

  return { configure, playNow, pause, resume, destroy };
}
