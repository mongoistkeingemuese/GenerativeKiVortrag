import SlideEngine from './slides.js';
import KeyboardController from './keyboard.js';
import Sidebar from './sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
  const deck = document.querySelector('.slide-deck');
  if (!deck) return;

  const engine = new SlideEngine(deck);
  new KeyboardController(engine);
  const sidebar = new Sidebar(engine);

  // React to slide changes
  engine.onChange((index, slide) => {
    sidebar.updateActive();
  });

  // Expose for debugging
  window.rex = { engine, sidebar };
});
