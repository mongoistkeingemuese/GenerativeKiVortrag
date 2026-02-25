class KeyboardController {
  constructor(engine) {
    this.engine = engine;
    this._bindKeyboard();
    this._bindClick();
    this._bindTouch();
    this._bindHash();
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't intercept when typing in input fields
      if (e.target.matches('input, textarea, [contenteditable]')) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          this.engine.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.engine.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.engine.first();
          break;
        case 'End':
          e.preventDefault();
          this.engine.last();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this._toggleFullscreen();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this._openPresenterView();
          }
          break;
        case 'Escape':
          // Chat close handled by chat.js
          break;
      }
    });
  }

  _bindClick() {
    const deck = this.engine.container;
    deck.addEventListener('click', (e) => {
      // Don't navigate when clicking interactive elements
      if (e.target.closest('button, a, input, textarea, iframe, .chat-panel')) return;

      const rect = deck.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.3) {
        this.engine.prev();
      } else if (x > rect.width * 0.7) {
        this.engine.next();
      }
    });
  }

  _bindTouch() {
    let startX = 0;
    const deck = this.engine.container;

    deck.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    deck.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        dx > 0 ? this.engine.prev() : this.engine.next();
      }
    }, { passive: true });
  }

  _bindHash() {
    window.addEventListener('hashchange', () => {
      const num = parseInt(window.location.hash.replace('#', ''), 10);
      if (num >= 1 && num <= this.engine.total) {
        this.engine.goTo(num - 1);
      }
    });
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  _openPresenterView() {
    window.open(
      '/presenter.html',
      'rex-presenter',
      'width=800,height=600'
    );
  }
}

export default KeyboardController;
