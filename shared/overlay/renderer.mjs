const WALK = new Set(['explore', 'shuffle', 'trot']);

function effectFor(variant, motion) {
  if (motion.id === 'bottom-pop') return 'bottom';
  if (motion.id === 'glide') return 'glide';
  if (motion.id === 'dash') return 'dash';
  if (WALK.has(motion.id) || (variant.species === 'hamster' && motion.id === 'forage')) return 'walk';
  return 'pop';
}

function inspectFrame(video, frameHeight, shouldAlignGround, requireAlpha = true) {
  if (!video.videoWidth || !video.videoHeight) return false;
  const width = 160;
  const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
  let margin = 0.17;
  let backgroundColor = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    if (!requireAlpha) backgroundColor = `rgb(${pixels[0]}, ${pixels[1]}, ${pixels[2]})`;
    let transparent = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 245) { transparent = true; break; }
    }
    if (requireAlpha && !transparent) return false;
    if (!shouldAlignGround) return { backgroundColor };
    for (let y = height - 1; y >= 0; y -= 1) {
      let opaque = 0;
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        // MP4 has a flat matte: compare against the corner instead of its opaque alpha.
        const foreground = requireAlpha ? pixels[offset + 3] > 80 :
          Math.max(...[0, 1, 2].map((channel) => Math.abs(pixels[offset + channel] - pixels[channel]))) > 18;
        if (foreground) opaque += 1;
      }
      if (opaque >= 3) {
        margin = (height - y - 1) / height;
        break;
      }
    }
  } catch { if (requireAlpha) return false; }
  video.style.bottom = `${Math.round((0.1 - margin) * frameHeight + 4)}px`;
  return { backgroundColor };
}

export function createRenderer(stage, {
  onEnded = () => {}, onError = () => {}, onFormat = () => {}, allowOpaqueVideo = false,
} = {}) {
  let generation = 0;
  let video = null;
  let loadingTimer = null;
  let watchdog = null;
  let preferMp4 = false;

  function releaseVideo() {
    if (!video) return;
    const media = video;
    video = null;
    media.pause();
    media.removeAttribute('src');
    media.load();
    media.remove();
  }

  function clear() {
    generation += 1;
    clearTimeout(loadingTimer);
    clearTimeout(watchdog);
    loadingTimer = null;
    watchdog = null;
    releaseVideo();
    stage.replaceChildren();
  }

  function play({ variant, motion, sizePx, side, area, opacity, renderer = 'auto' }) {
    clear();
    const current = generation;
    let complete = false;
    let fallbackStarted = false;
    let mp4Attempted = false;
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

    // Two video formats may each spend five seconds loading before the PNG fallback.
    watchdog = setTimeout(() => finish('timeout'), allowOpaqueVideo ? 18000 : 12000);

    function showImage(reason) {
      if (current !== generation || complete || fallbackStarted) return;
      fallbackStarted = true;
      clearTimeout(loadingTimer);
      loadingTimer = null;
      releaseVideo();
      if (reason) onError(reason);
      const image = document.createElement('img');
      image.className = 'obs-media obs-image';
      image.alt = '';
      image.decoding = 'async';
      image.addEventListener('load', () => {
        if (current !== generation || complete) return;
        onFormat({ format: 'png', error: reason });
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
    function playVideo(url, format) {
      clearTimeout(loadingTimer);
      releaseVideo();
      const media = document.createElement('video');
      video = media;
      if (format === 'mp4') mp4Attempted = true;
      media.className = 'obs-media obs-video';
      media.dataset.format = format;
      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;
      media.preload = 'auto';
      function failed(reason) {
        if (current !== generation || complete || video !== media) return;
        if (allowOpaqueVideo && motion.fallbackVideo && !mp4Attempted) {
          if (reason === 'video-alpha') preferMp4 = true;
          playVideo(motion.fallbackVideo, 'mp4');
        } else showImage(reason);
      }
      media.addEventListener('loadeddata', () => {
        if (current !== generation || complete || video !== media) return;
        const frame = inspectFrame(media, frameHeight, effect !== 'bottom' && effect !== 'glide', format === 'webm');
        if (!frame) {
          failed('video-alpha');
          return;
        }
        Promise.resolve(media.play()).then(() => {
          if (current !== generation || complete || video !== media) return;
          clearTimeout(loadingTimer);
          loadingTimer = null;
          onFormat({ format, backgroundColor: frame.backgroundColor });
          media.style.setProperty('--duration', `${Math.max(3.8, Math.min(4.5, media.duration || 4))}s`);
          void media.offsetWidth;
          media.classList.add('is-playing');
        }).catch(() => failed('video-play'));
      }, { once: true });
      media.addEventListener('error', () => failed('video-error'), { once: true });
      const ended = () => { if (video === media) finish(); };
      media.addEventListener('ended', ended, { once: true });
      if (effect !== 'bottom') media.addEventListener('animationend', ended, { once: true });
      actor.append(media);
      loadingTimer = setTimeout(() => failed('video-timeout'), 5000);
      media.src = new URL(url, document.baseURI).href;
      media.load();
    }
    if (preferMp4 && allowOpaqueVideo && motion.fallbackVideo) playVideo(motion.fallbackVideo, 'mp4');
    else playVideo(motion.video, 'webm');
  }

  return { play, stop: clear, destroy: clear };
}
