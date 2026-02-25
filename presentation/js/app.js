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

  // Update chat context when slide changes
  const originalGoTo = engine.goTo.bind(engine);
  engine.goTo = (index) => {
    originalGoTo(index);
    const slide = engine.slides[index];
    const context = slide?.dataset.chat;
    if (context) {
      chat.setContext(context);
      chat.open();
    }
  };

  // Expose for debugging
  window.rex = { engine, chat, sidebar };
});
