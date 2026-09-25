const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultModes, validModes, pomodoroPhase } = require('../electron/modes');

test('Pomodoro advances through four focus sessions and the long break', () => {
  const startedAt = 1_000_000;
  const pomodoro = { ...defaultModes.pomodoro, enabled: true, startedAt };
  const minute = 60_000;
  assert.deepEqual(pomodoroPhase(pomodoro, startedAt), { kind: 'focus', round: 1, remainingMs: 25 * minute });
  assert.deepEqual(pomodoroPhase(pomodoro, startedAt + 25 * minute), { kind: 'break', round: 1, remainingMs: 5 * minute });
  assert.deepEqual(pomodoroPhase(pomodoro, startedAt + 30 * minute), { kind: 'focus', round: 2, remainingMs: 25 * minute });
  assert.deepEqual(pomodoroPhase(pomodoro, startedAt + 115 * minute), { kind: 'longBreak', round: 4, remainingMs: 15 * minute });
  assert.deepEqual(pomodoroPhase(pomodoro, startedAt + 130 * minute), { kind: 'focus', round: 1, remainingMs: 25 * minute });
});

test('Timer settings reject invalid durations and disabled mode has no phase', () => {
  assert.equal(validModes(defaultModes), true);
  assert.equal(validModes({ ...defaultModes, pomodoro: { ...defaultModes.pomodoro, focus: 0 } }), false);
  assert.equal(pomodoroPhase(defaultModes.pomodoro), null);
});
