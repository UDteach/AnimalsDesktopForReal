const text = {
  ja: {
    title: '出現間隔を設定', help: '動物が引っ込んでから、次の出現までの時間です。',
    mode: '間隔の種類', fixed: '固定', range: 'ランダム範囲',
    firstFixed: '間隔', firstRange: '最短', last: '最長', unit: '単位',
    seconds: '秒', minutes: '分', cancel: 'キャンセル', save: '保存',
    error: '1秒から24時間以内の整数を入力し、最長を最短以上にしてください。',
  },
  en: {
    title: 'Set appearance interval', help: 'Timing starts when the current animation ends.',
    mode: 'Interval type', fixed: 'Fixed', range: 'Random range',
    firstFixed: 'Interval', firstRange: 'Minimum', last: 'Maximum', unit: 'Unit',
    seconds: 'Seconds', minutes: 'Minutes', cancel: 'Cancel', save: 'Save',
    error: 'Enter whole numbers from 1 second to 24 hours. Maximum must be at least minimum.',
  },
};
const form = document.getElementById('form');
const first = document.getElementById('first');
const last = document.getElementById('last');
const unit = document.getElementById('unit');
const error = document.getElementById('error');
let locale = text.ja;

function updateMode() {
  const isFixed = document.getElementById('fixed').checked;
  document.getElementById('last-field').hidden = isFixed;
  last.required = !isFixed;
  document.getElementById('first-label').textContent = isFixed ? locale.firstFixed : locale.firstRange;
}

function setLanguage(language) {
  document.documentElement.lang = language;
  locale = text[language];
  for (const [key, id] of Object.entries({
    title: 'title', help: 'help', mode: 'mode-label', fixed: 'fixed-label',
    range: 'range-label', last: 'last-label', unit: 'unit-label',
    seconds: 'seconds', minutes: 'minutes', cancel: 'cancel', save: 'save',
  })) document.getElementById(id).textContent = locale[key];
  updateMode();
}

for (const radio of document.querySelectorAll('input[name=mode]')) {
  radio.addEventListener('change', updateMode);
}
unit.addEventListener('change', () => {
  const oldUnit = Number(unit.dataset.previous || 1);
  const newUnit = Number(unit.value);
  first.value = Math.max(1, Math.round(Number(first.value) * oldUnit / newUnit));
  last.value = Math.max(1, Math.round(Number(last.value) * oldUnit / newUnit));
  unit.dataset.previous = String(newUnit);
});
document.getElementById('cancel').addEventListener('click', () => window.close());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const multiplier = Number(unit.value);
  const min = Number(first.value) * multiplier;
  const max = document.getElementById('fixed').checked ? min : Number(last.value) * multiplier;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 86400 || max < min) {
    error.textContent = locale.error;
    return;
  }
  const saved = await window.intervalSettings.save({ min, max });
  if (!saved) error.textContent = locale.error;
});

window.intervalSettings.load().then((settings) => {
  if (!settings) return;
  setLanguage(settings.language);
  const inMinutes = settings.min % 60 === 0 && settings.max % 60 === 0;
  unit.value = inMinutes ? '60' : '1';
  unit.dataset.previous = unit.value;
  first.value = settings.min / Number(unit.value);
  last.value = settings.max / Number(unit.value);
  document.getElementById(settings.min === settings.max ? 'fixed' : 'range').checked = true;
  updateMode();
});
