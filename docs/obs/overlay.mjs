import { makeDefaultConfig, parseConfig } from './config.mjs';
import { createPlayback } from './runtime.mjs';

const stage = document.getElementById('stage');
let hasValidConfig = false;
const playback = createPlayback(stage, {
  onState({ phase, variant, motion, error }) {
    stage.dataset.phase = phase;
    stage.dataset.variant = variant?.id ?? '';
    stage.dataset.motion = motion?.id ?? '';
    if (error) stage.dataset.lastError = error;
    else if (phase === 'playing') delete stage.dataset.lastError;
  },
});

function configFromLocation() {
  if (!location.hash) return makeDefaultConfig();
  const params = new URLSearchParams(location.hash.slice(1));
  const encoded = params.get('c');
  if (!encoded) throw new Error('URLの設定を読み取れません。');
  return parseConfig(encoded);
}

function applyLocation() {
  try {
    playback.configure(configFromLocation());
    hasValidConfig = true;
    if (!window.obsstudio && document.hidden) playback.pause();
  } catch (error) {
    hasValidConfig = false;
    playback.pause();
    stage.dataset.lastError = 'config';
    console.error('Animals OBS: invalid configuration', error);
  }
}

applyLocation();
window.addEventListener('hashchange', applyLocation);
if (window.obsstudio) {
  window.addEventListener('obsSourceVisibleChanged', (event) => {
    if (event.detail?.visible && hasValidConfig) playback.resume();
    else playback.pause();
  });
} else {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) playback.pause();
    else if (hasValidConfig) playback.resume();
  });
}
window.addEventListener('beforeunload', () => playback.destroy());
