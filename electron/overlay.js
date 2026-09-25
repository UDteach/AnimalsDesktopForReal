const animal = document.getElementById('animal');
const motionVideo = document.getElementById('motion-video');
let currentPlay;

function showImage({ url, fallbackUrl, motion, scale }) {
  motionVideo.hidden = true;
  motionVideo.pause();
  motionVideo.removeAttribute('src');
  motionVideo.load();
  animal.hidden = false;
  animal.style.width = `${scale * 100}%`;
  animal.src = fallbackUrl || url;
  void animal.offsetWidth;
  animal.style.animation = '';
  animal.className = motion;
}

function groundVideo() {
  const width = 160;
  const height = Math.max(1, Math.round(width * motionVideo.videoHeight / motionVideo.videoWidth));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let marginFraction = 0.17;
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(motionVideo, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    for (let y = height - 1; y >= 0; y -= 1) {
      let opaque = 0;
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] > 80) opaque += 1;
      }
      if (opaque >= 3) {
        marginFraction = (height - y - 1) / height;
        break;
      }
    }
  } catch { /* Keep the source frame's usual lower margin if canvas cannot read video. */ }
  const displayHeight = motionVideo.clientWidth * motionVideo.videoHeight / motionVideo.videoWidth;
  // Ground keyframes usually lower the media 10%; align the feet instead of its transparent canvas.
  motionVideo.style.bottom = `${Math.round((0.1 - marginFraction) * displayHeight + 4)}px`;
}

animal.addEventListener('animationend', () => { if (!animal.hidden) window.animals.ended(); });
animal.addEventListener('error', () => { if (!animal.hidden) window.animals.ended(); });
motionVideo.addEventListener('animationend', () => { if (!motionVideo.hidden) window.animals.ended(); });
motionVideo.addEventListener('error', () => {
  if (!motionVideo.hidden && currentPlay) showImage(currentPlay);
});
motionVideo.addEventListener('loadeddata', () => {
  if (motionVideo.hidden || !currentPlay || !motionVideo.videoWidth) return;
  if (currentPlay.motion !== 'sugar-glider-glide') groundVideo();
  void motionVideo.offsetWidth;
  motionVideo.style.animation = '';
  motionVideo.play().catch(() => {
    if (!motionVideo.hidden && currentPlay) showImage(currentPlay);
  });
});

window.animals.onPlay((play) => {
  currentPlay = play;
  const { url, motion, scale, kind } = play;
  animal.className = '';
  animal.style.animation = 'none';
  motionVideo.className = '';
  motionVideo.style.animation = 'none';
  motionVideo.style.bottom = '';
  motionVideo.pause();
  if (kind === 'video') {
    animal.hidden = true;
    motionVideo.hidden = false;
    motionVideo.style.width = `${scale * 90}%`;
    motionVideo.className = motion;
    motionVideo.src = url;
    motionVideo.load();
  } else {
    showImage(play);
  }
});
