window.animalTimer.onUpdate(({ label, time, kind }) => {
  document.getElementById('label').textContent = label;
  document.getElementById('time').textContent = time;
  document.getElementById('timer').classList.toggle('break', kind !== 'focus');
});
