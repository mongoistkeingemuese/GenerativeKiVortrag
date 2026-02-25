import SlideEngine from './slides.js';
import KeyboardController from './keyboard.js';
import ChatWidget from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
  const deck = document.querySelector('.slide-deck');
  if (!deck) return;

  const engine = new SlideEngine(deck);
  new KeyboardController(engine);
  const chat = new ChatWidget();

  // Update chat context when slide changes
  const originalGoTo = engine.goTo.bind(engine);
  engine.goTo = (index) => {
    originalGoTo(index);
    const slide = engine.slides[index];
    const context = slide?.dataset.chat;
    if (context) {
      chat.setContext(context);
      // Auto-open chat on demo slides
      chat.open();
    }
  };

  // Show/hide chat toggle based on slide type
  const toggle = document.getElementById('chatToggle');
  const observer = new MutationObserver(() => {
    const active = engine.getCurrentSlide();
    const isDemo = active?.classList.contains('slide--demo') || active?.dataset.chat;
    toggle.classList.toggle('hidden', false); // Always visible, but could toggle
  });
  observer.observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // Expose for debugging
  window.rex = { engine, chat };
});
