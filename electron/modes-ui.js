const copy = {
  ja: {
    title: 'モードの設定', pomodoro: 'ポモドーロを使う',
    pomodoroHelp: '集中中は動物の自動表示を休み、休憩が始まると動物が現れます。4回目は長い休憩です。',
    focus: '集中（分）', shortBreak: '休憩（分）', longBreak: '長い休憩（分）',
    showTimer: '残り時間を画面に表示',
    showTimerHelp: 'オンにすると、画面右上に集中・休憩の残り時間を表示します。クリック操作は妨げません。',
    cancel: 'キャンセル', save: '保存', error: '集中・休憩の分数を確認してください。',
  },
  en: {
    title: 'Mode settings', pomodoro: 'Use Pomodoro',
    pomodoroHelp: 'Animals stay away during focus and appear when a break begins. Every fourth break is longer.',
    focus: 'Focus (min)', shortBreak: 'Break (min)', longBreak: 'Long break (min)',
    showTimer: 'Show remaining time on screen',
    showTimerHelp: 'Shows a small countdown at the top right. It never blocks clicks.',
    cancel: 'Cancel', save: 'Save', error: 'Check the focus and break lengths.',
  },
};

let locale = copy.ja;
const fields = {
  title: 'title', pomodoro: 'pomodoro-label', pomodoroHelp: 'pomodoro-help',
  focus: 'focus-label', shortBreak: 'short-break-label', longBreak: 'long-break-label',
  showTimer: 'show-timer-label', showTimerHelp: 'show-timer-help',
  cancel: 'cancel', save: 'save',
};

function setLanguage(language) {
  document.documentElement.lang = language;
  locale = copy[language];
  for (const [key, id] of Object.entries(fields)) document.getElementById(id).textContent = locale[key];
}

document.getElementById('cancel').addEventListener('click', () => window.close());
document.getElementById('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = {
    pomodoro: {
      enabled: document.getElementById('pomodoro').checked,
      focus: Number(document.getElementById('focus').value),
      shortBreak: Number(document.getElementById('short-break').value),
      longBreak: Number(document.getElementById('long-break').value),
    },
    showTimer: document.getElementById('show-timer').checked,
  };
  const saved = await window.modeSettings.save(value);
  if (!saved) document.getElementById('error').textContent = locale.error;
});

window.modeSettings.load().then((result) => {
  if (!result) return;
  setLanguage(result.language);
  const { pomodoro, showTimer } = result.modes;
  document.getElementById('pomodoro').checked = pomodoro.enabled;
  document.getElementById('focus').value = pomodoro.focus;
  document.getElementById('short-break').value = pomodoro.shortBreak;
  document.getElementById('long-break').value = pomodoro.longBreak;
  document.getElementById('show-timer').checked = showTimer;
});
