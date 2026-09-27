const WALK = new Set(['explore', 'shuffle', 'trot']);

function effectFor(variant, motion) {
  if (motion.id === 'bottom-pop') return 'bottom';
  if (motion.id === 'glide') return 'glide';
  if (motion.id === 'dash') return 'dash';
  if (WALK.has(motion.id) || (variant.species === 'hamster' && motion.id === 'forage')) return 'walk';
  return 'pop';
}

function inspectFrame(video, frameHeight, shouldAlignGround) {
  if (!video.videoWidth || !video.videoHeight) return false;
  const width = 160;
  const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
  let margin = 0.17;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let transparent = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 245) { transparent = true; break; }
    }
    if (!transparent) return false;
    if (!shouldAlignGround) return true;
    for (let y = height - 1; y >= 0; y -= 1) {
      let opaque = 0;
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] > 80) opaque += 1;
      }
      if (opaque >= 3) {
        margin = (height - y - 1) / height;
        break;
      }
    }
  } catch { return false; }
  video.style.bottom = `${Math.round((0.1 - margin) * frameHeight + 4)}px`;
  return true;
}

export function createRenderer(stage, { onEnded = () => {}, onError = () => {} } = {}) {
  let generation = 0;
  let video = null;
  let loadingTimer = null;
  let watchdog = null;

  function clear() {
    generation += 1;
    clearTimeout(loadingTimer);
    clearTimeout(watchdog);
    loadingTimer = null;
    watchdog = null;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video = null;
    }
    stage.replaceChildren();
  }

  function play({ variant, motion, sizePx, side, area, opacity, renderer = 'auto' }) {
    clear();
    const current = generation;
    let complete = false;
    let fallbackStarted = false;
    const finish = (result = 'finished') => {
      if (current !== generation || complete) return;
      complete = true;
      clearTimeout(loadingTimer);
      clearTimeout(watchdog);
      loadingTimer = null;
      watchdog = null;
      onEnded(result);
    };

    const stageWidth = Math.max(1, stage.clientWidth);
    const stageHeight = Math.max(1, stage.clientHeight);
    const areaWidth = stageWidth * area.width / 100;
    const areaHeight = stageHeight * area.height / 100;
    const frameHeight = Math.max(1, Math.min(sizePx * stageHeight / 1080, areaHeight * 0.9, areaWidth * 0.9 * 9 / 16));
    const frameWidth = frameHeight * 16 / 9;
    const effect = effectFor(variant, motion);
    const location = side === 'random' ? (Math.random() < 0.5 ? 'left' : 'right') : side;

    const clip = document.createElement('div');
    clip.className = 'obs-area';
    Object.assign(clip.style, {
      left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%`,
      opacity: String(opacity / 100),
    });
    const actor = document.createElement('div');
    actor.className = `obs-actor obs-${effect}${location === 'right' && effect !== 'bottom' ? ' is-right' : ''}`;
    actor.style.width = `${frameWidth}px`;
    actor.style.height = `${frameHeight}px`;
    actor.style.setProperty('--travel', `${areaWidth + 2 * frameWidth}px`);
    actor.style.setProperty('--travel-half', `${(areaWidth + 2 * frameWidth) / 2}px`);
    actor.style.setProperty('--dash-mid', `${areaWidth * 0.7}px`);
    actor.style.setProperty('--dash-travel', `${areaWidth + frameWidth}px`);
    if (effect === 'glide') {
      actor.style[location === 'right' ? 'right' : 'left'] = `${-frameWidth}px`;
      actor.style.bottom = `${Math.round(areaHeight * 0.22)}px`;
    } else if (effect === 'bottom') {
      const percent = side === 'left' ? 25 : side === 'right' ? 75 : 24 + Math.random() * 52;
      actor.style.left = `${percent}%`;
      actor.style.transform = `translateX(-50%)${location === 'right' ? ' scaleX(-1)' : ''}`;
    } else {
      actor.style[location] = '0';
    }
    clip.append(actor);
    stage.append(clip);

    watchdog = setTimeout(() => finish('timeout'), 12000);

    function showImage(reason) {
      if (current !== generation || complete || fallbackStarted) return;
      fallbackStarted = true;
      clearTimeout(loadingTimer);
      loadingTimer = null;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.remove();
        video = null;
      }
      if (reason) onError(reason);
      const image = document.createElement('img');
      image.className = 'obs-media obs-image';
      image.alt = '';
      image.decoding = 'async';
      image.addEventListener('load', () => {
        if (current !== generation || complete) return;
        image.style.setProperty('--duration', '4s');
        // A layout read restarts the animation after rapid source changes.
        void image.offsetWidth;
        image.classList.add('is-playing');
      }, { once: true });
      image.addEventListener('error', () => finish('failed'), { once: true });
      image.addEventListener('animationend', () => finish(), { once: true });
      actor.append(image);
      image.src = new URL(variant.image, document.baseURI).href;
    }

    if (renderer === 'png') {
      showImage();
      return;
    }
    const media = document.createElement('video');
    video = media;
    media.className = 'obs-media obs-video';
    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    media.preload = 'auto';
    media.addEventListener('loadeddata', () => {
      if (current !== generation || complete || video !== media) return;
      if (!inspectFrame(media, frameHeight, effect !== 'bottom' && effect !== 'glide')) {
        showImage('video-alpha');
        return;
      }
      Promise.resolve(media.play()).then(() => {
        if (current !== generation || complete || video !== media) return;
        clearTimeout(loadingTimer);
        loadingTimer = null;
        media.style.setProperty('--duration', `${Math.max(3.8, Math.min(4.5, media.duration || 4))}s`);
        void media.offsetWidth;
        media.classList.add('is-playing');
      }).catch(() => showImage('video-play'));
    }, { once: true });
    media.addEventListener('error', () => showImage('video-error'), { once: true });
    media.addEventListener('ended', () => finish(), { once: true });
    if (effect !== 'bottom') media.addEventListener('animationend', () => finish(), { once: true });
    actor.append(media);
    loadingTimer = setTimeout(() => showImage('video-timeout'), 5000);
    media.src = new URL(motion.video, document.baseURI).href;
    media.load();
  }

  return { play, stop: clear, destroy: clear };
}
