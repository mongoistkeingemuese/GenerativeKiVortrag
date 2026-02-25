class SlideEngine {
  constructor(container) {
    this.container = container;
    this.slides = Array.from(container.querySelectorAll('.slide'));
    this.current = 0;
    this.total = this.slides.length;

    this.progressBar = document.querySelector('.progress-bar');
    this.counter = document.querySelector('.slide-counter');

    this._readHash();
    this._update();
  }

  goTo(index) {
    if (index < 0 || index >= this.total || index === this.current) return;

    const prev = this.slides[this.current];
    const next = this.slides[index];

    prev.classList.remove('active');
    prev.classList.add(index > this.current ? 'prev' : '');

    // Clean up prev class after transition
    setTimeout(() => prev.classList.remove('prev'), 400);

    this.current = index;
    next.classList.add('active');

    this._update();
    this._broadcast();
  }

  next() {
    this.goTo(this.current + 1);
  }

  prev() {
    this.goTo(this.current - 1);
  }

  first() {
    this.goTo(0);
  }

  last() {
    this.goTo(this.total - 1);
  }

  getCurrentSlide() {
    return this.slides[this.current];
  }

  _update() {
    // Progress bar
    const progress = ((this.current + 1) / this.total) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = progress + '%';
    }

    // Counter
    if (this.counter) {
      this.counter.textContent = `${this.current + 1} / ${this.total}`;
    }

    // URL hash
    window.location.hash = `#${this.current + 1}`;
  }

  _readHash() {
    const hash = window.location.hash.replace('#', '');
    const num = parseInt(hash, 10);
    if (num >= 1 && num <= this.total) {
      this.current = num - 1;
    }
    // Set initial active
    this.slides.forEach((s, i) => {
      s.classList.toggle('active', i === this.current);
    });
  }

  _broadcast() {
    // Notify speaker notes window
    const channel = new BroadcastChannel('rex-presenter');
    const slide = this.slides[this.current];
    const notes = slide.querySelector('.notes');
    channel.postMessage({
      type: 'slide-change',
      index: this.current,
      total: this.total,
      notes: notes ? notes.innerHTML : '',
      title: slide.querySelector('h2, h1')?.textContent || ''
    });
    channel.close();
  }
}

export default SlideEngine;
