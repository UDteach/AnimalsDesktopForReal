const defaultModes = {
  pomodoro: { enabled: false, startedAt: null, focus: 25, shortBreak: 5, longBreak: 15 },
  showTimer: false,
};

function validModes(value) {
  if (!value || typeof value !== 'object') return false;
  const { pomodoro, showTimer } = value;
  return pomodoro && typeof pomodoro.enabled === 'boolean' &&
    Number.isInteger(pomodoro.focus) && pomodoro.focus >= 1 && pomodoro.focus <= 180 &&
    Number.isInteger(pomodoro.shortBreak) && pomodoro.shortBreak >= 1 && pomodoro.shortBreak <= 60 &&
    Number.isInteger(pomodoro.longBreak) && pomodoro.longBreak >= 1 && pomodoro.longBreak <= 120 &&
    (pomodoro.startedAt === null || (Number.isSafeInteger(pomodoro.startedAt) && pomodoro.startedAt > 0)) &&
    typeof showTimer === 'boolean';
}

function pomodoroPhase(pomodoro, now = Date.now()) {
  if (!pomodoro.enabled || !pomodoro.startedAt) return null;
  const focus = pomodoro.focus * 60000;
  const shortBreak = pomodoro.shortBreak * 60000;
  const longBreak = pomodoro.longBreak * 60000;
  const cycle = 4 * focus + 3 * shortBreak + longBreak;
  let elapsed = Math.max(0, now - pomodoro.startedAt) % cycle;
  for (let round = 1; round <= 4; round += 1) {
    if (elapsed < focus) return { kind: 'focus', round, remainingMs: focus - elapsed };
    elapsed -= focus;
    const rest = round === 4 ? longBreak : shortBreak;
    if (elapsed < rest) return { kind: round === 4 ? 'longBreak' : 'break', round, remainingMs: rest - elapsed };
    elapsed -= rest;
  }
  return { kind: 'focus', round: 1, remainingMs: focus };
}

module.exports = { defaultModes, validModes, pomodoroPhase };
