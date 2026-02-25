// Speaker notes window — listens for slide changes via BroadcastChannel

const channel = new BroadcastChannel('rex-presenter');
let startTime = Date.now();

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function updateTimer() {
  const el = document.getElementById('timer');
  if (el) el.textContent = formatTime(Date.now() - startTime);
  requestAnimationFrame(updateTimer);
}

channel.addEventListener('message', (e) => {
  const { type, index, total, notes, title } = e.data;
  if (type !== 'slide-change') return;

  document.getElementById('slideTitle').textContent = title || `Folie ${index + 1}`;
  document.getElementById('slideCounter').textContent = `${index + 1} / ${total}`;
  document.getElementById('notes').innerHTML = notes || '<em>Keine Notizen f\u00fcr diese Folie.</em>';
});

document.addEventListener('DOMContentLoaded', () => {
  updateTimer();

  const resetBtn = document.getElementById('resetTimer');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => { startTime = Date.now(); });
  }
});
