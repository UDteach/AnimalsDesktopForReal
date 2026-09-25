const motionGroups = {
  chinchilla: ['hop', 'perch', 'peek', 'bottom-pop'],
  hamster: ['forage', 'explore', 'peek', 'bottom-pop'],
  djungarian: ['dash', 'pause', 'peek', 'bottom-pop'],
  'macaroni-mouse': ['emerge', 'shuffle', 'settle', 'bottom-pop'],
  'sugar-glider': ['glide', 'perch', 'peek'],
  'guinea-pig': ['trot', 'forage', 'popcorn', 'bottom-pop'],
};

const motionCopy = {
  ja: {
    hop: '跳ぶ', perch: '立ち止まる', peek: 'のぞく',
    forage: '小走り', explore: '探索', dash: '走る', pause: 'ひと休み',
    emerge: '顔を出す', shuffle: 'ちょこちょこ', settle: 'ぺたり', glide: '滑空', 'bottom-pop': '下からぴょこ',
    trot: 'てこてこ歩く', popcorn: '小さく跳ねる', 'guinea-pig-forage': '鼻で探す',
    controls: '動きを選ぶ', error: 'この動画は再生できませんでした。',
  },
  en: {
    hop: 'Hop', perch: 'Perch', peek: 'Peek',
    forage: 'Forage', explore: 'Explore', dash: 'Dash', pause: 'Pause',
    emerge: 'Emerge', shuffle: 'Shuffle', settle: 'Settle', glide: 'Glide', 'bottom-pop': 'Pop up',
    trot: 'Trot', popcorn: 'Popcorn hop', 'guinea-pig-forage': 'Sniff & forage',
    controls: 'Choose a motion', error: 'This clip could not be played.',
  },
};

const language = document.documentElement.lang === 'en' ? 'en' : 'ja';
const copy = motionCopy[language];
const userAgent = navigator.userAgent;
// Safari plays VP9 WebM but does not preserve its alpha channel.
const preferMp4 = /iPhone|iPad|iPod/.test(userAgent) ||
  (/Safari/.test(userAgent) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(userAgent));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true;
const cards = [...document.querySelectorAll('.animal-grid figure[data-variant]')];
const walkingMotions = new Set(['forage', 'explore', 'shuffle', 'trot']);
const heroMotionByVariant = {
  'chinchilla-standard-gray': 'bottom-pop',
  'chinchilla-beige': 'perch',
  'chinchilla-white-mosaic': 'peek',
  'hamster-golden': 'bottom-pop',
  'hamster-cream': 'explore',
  'djungarian-normal': 'dash',
  'macaroni-mouse-natural': 'bottom-pop',
  'sugar-glider-standard-gray': 'glide',
  'sugar-glider-leucistic': 'perch',
  'sugar-glider-gray-mosaic': 'glide',
  'guinea-pig-tricolor': 'bottom-pop',
  'guinea-pig-self-cream': 'popcorn',
  'guinea-pig-golden-agouti': 'trot',
};

function entranceFor(motion) {
  if (motion === 'bottom-pop') return 'native-bottom';
  if (motion === 'glide') return 'glide';
  if (motion === 'dash') return 'dash';
  return walkingMotions.has(motion) ? 'walk' : 'pop';
}

function videoPath(card, format) {
  return `assets/motions/${card.dataset.variant}-${card.dataset.motion}.${format}`;
}

function pauseCard(card) {
  const video = card.querySelector('video');
  if (!video) return;
  card.classList.remove('video-ready');
  card.dataset.format = '';
  video.pause();
  video.removeAttribute('src');
  video.load();
}

function loadVideo(card, format) {
  const video = card.querySelector('video');
  const version = Number(card.dataset.version || 0) + 1;
  card.dataset.version = String(version);
  card.dataset.format = format;
  card.classList.remove('video-ready');
  card.querySelector('.motion-error').hidden = true;
  video.pause();
  video.src = videoPath(card, format);
  video.load();
  video.play().catch(() => {
    if (card.dataset.version === String(version)) handleVideoError(card);
  });
}

function handleVideoError(card) {
  if (!card.dataset.format) return;
  if (card.dataset.format === 'webm') {
    loadVideo(card, 'mp4');
    return;
  }
  pauseCard(card);
  card.querySelector('.motion-error').hidden = false;
}

function selectMotion(card, motion) {
  card.dataset.motion = motion;
  card.dataset.entrance = entranceFor(motion);
  for (const button of card.querySelectorAll('.motion-controls button')) {
    button.setAttribute('aria-pressed', String(button.dataset.motion === motion));
  }
  loadVideo(card, preferMp4 ? 'mp4' : 'webm');
}

for (const card of cards) {
  const variant = card.dataset.variant;
  const group = Object.keys(motionGroups).find((prefix) => variant.startsWith(`${prefix}-`));
  if (!group) continue;
  const caption = card.querySelector('figcaption');
  const animalName = `${caption.firstChild.textContent} ${caption.querySelector('small').textContent}`;
  const video = card.querySelector('.animal-preview video');
  video.muted = true;
  video.loop = false;
  video.playsInline = true;
  video.addEventListener('playing', () => card.classList.add('video-ready'));
  video.addEventListener('ended', () => {
    if (card.dataset.motion !== 'bottom-pop') card.classList.remove('video-ready');
    if (card.dataset.visible === 'true' && !reducedMotion && !saveData && !document.hidden) {
      // Restart the entrance together with the next video pass.
      void video.offsetWidth;
      video.currentTime = 0;
      video.play().catch(() => handleVideoError(card));
    }
  });
  video.addEventListener('error', () => handleVideoError(card));
  const controls = document.createElement('div');
  controls.className = 'motion-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', `${animalName}: ${copy.controls}`);
  const motions = motionGroups[group];
  for (const motion of motions) {
    const button = document.createElement('button');
    button.type = 'button';
    const motionLabel = copy[`${group}-${motion}`] || copy[motion];
    button.textContent = motionLabel;
    button.dataset.motion = motion;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${animalName}: ${motionLabel}`);
    button.addEventListener('click', () => selectMotion(card, motion));
    controls.append(button);
  }
  card.append(controls);
  const error = document.createElement('p');
  error.className = 'motion-error';
  error.textContent = copy.error;
  error.setAttribute('role', 'status');
  error.hidden = true;
  card.append(error);
  card.dataset.motion = motions[0];
  card.dataset.entrance = entranceFor(card.dataset.motion);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target;
      const visible = entry.intersectionRatio >= 0.35;
      card.dataset.visible = String(visible);
      if (visible && !reducedMotion && !saveData && !document.hidden) {
        if (!card.dataset.format) selectMotion(card, card.dataset.motion);
      } else if (!visible) {
        pauseCard(card);
      }
    }
  }, { threshold: 0.35 });
  for (const card of cards) observer.observe(card);
}

document.addEventListener('visibilitychange', () => {
  for (const card of cards) {
    if (document.hidden) pauseCard(card);
    else if (card.dataset.visible === 'true' && !reducedMotion && !saveData) {
      selectMotion(card, card.dataset.motion);
    }
  }
});

const heroStage = document.querySelector('.demo-stage');
if (heroStage && cards.length) {
  const desktop = heroStage.querySelector('.desktop');
  const video = document.getElementById('hero-video');
  const dots = document.getElementById('hero-dots');
  const caption = document.getElementById('hero-caption');
  const slides = cards.map((card) => ({
    variant: card.dataset.variant,
    motion: heroMotionByVariant[card.dataset.variant] || card.dataset.motion,
    name: `${card.querySelector('figcaption').firstChild.textContent} ${card.querySelector('small').textContent}`,
  }));
  let index = 0;
  let format = '';
  let version = 0;
  let fallbackTimer;
  let heroVisible = true;

  function nextSlide() {
    if (!reducedMotion && !saveData && !document.hidden && heroVisible) showSlide((index + 1) % slides.length);
  }

  function videoFailed() {
    if (!format) return;
    if (format === 'webm') {
      desktop.classList.add('mp4-preview');
      loadHero('mp4');
      return;
    }
    format = '';
    desktop.classList.remove('demo-playing');
    video.pause();
    fallbackTimer = setTimeout(nextSlide, 4000);
  }

  function loadHero(extension) {
    const slide = slides[index];
    const thisVersion = ++version;
    format = extension;
    video.pause();
    video.src = `assets/motions/${slide.variant}-${slide.motion}.${extension}`;
    video.load();
    video.play().catch(() => {
      if (version === thisVersion) videoFailed();
    });
  }

  function showSlide(nextIndex, manual = false) {
    clearTimeout(fallbackTimer);
    index = nextIndex;
    const slide = slides[index];
    desktop.classList.remove('demo-playing');
    desktop.classList.toggle('mp4-preview', preferMp4);
    desktop.dataset.entrance = entranceFor(slide.motion);
    caption.textContent = slide.name;
    for (const [dotIndex, dot] of [...dots.children].entries()) {
      dot.setAttribute('aria-current', String(dotIndex === index));
    }
    version += 1;
    format = '';
    video.pause();
    video.removeAttribute('src');
    video.load();
    if ((!reducedMotion && !saveData && !document.hidden && heroVisible) || manual) {
      loadHero(preferMp4 ? 'mp4' : 'webm');
    }
  }

  for (const [dotIndex, slide] of slides.entries()) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', language === 'ja' ? `${slide.name}を見る` : `Show ${slide.name}`);
    dot.title = slide.name;
    dot.addEventListener('click', () => showSlide(dotIndex, true));
    dots.append(dot);
  }
  video.addEventListener('playing', () => desktop.classList.add('demo-playing'));
  video.addEventListener('ended', nextSlide);
  video.addEventListener('error', videoFailed);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(fallbackTimer);
      video.pause();
      desktop.classList.remove('demo-playing');
    } else if (!reducedMotion && !saveData && heroVisible) {
      showSlide(index);
    }
  });
  showSlide(0);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.intersectionRatio >= 0.1;
      if (!heroVisible) {
        clearTimeout(fallbackTimer);
        video.pause();
        desktop.classList.remove('demo-playing');
      } else if (!document.hidden && !reducedMotion && !saveData) {
        showSlide(index);
      }
    }, { threshold: 0.1 });
    observer.observe(heroStage);
  }
}
