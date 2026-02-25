import SlideEngine from './slides.js';
import KeyboardController from './keyboard.js';
import ChatWidget from './chat.js';
import Sidebar from './sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
  const deck = document.querySelector('.slide-deck');
  if (!deck) return;

  const engine = new SlideEngine(deck);
  new KeyboardController(engine);
  const chat = new ChatWidget();
  const sidebar = new Sidebar(engine);

  // React to slide changes
  engine.onChange((index, slide) => {
    // Update chat context on demo slides
    const context = slide.dataset.chat;
    if (context) {
      chat.setContext(context);
      chat.open();
    }
    // Update sidebar
    sidebar.updateActive();
  });

  // Expose for debugging
  window.rex = { engine, chat, sidebar };
});
