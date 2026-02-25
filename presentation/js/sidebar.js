class Sidebar {
  constructor(engine) {
    this.engine = engine;
    this.sidebar = document.getElementById('sidebar');
    this.trigger = document.getElementById('sidebarTrigger');
    this.list = document.getElementById('sidebarList');
    this.isOpen = false;

    this._buildList();
    this._bind();
    this._updateActive();
  }

  _buildList() {
    this.list.innerHTML = '';
    this.engine.slides.forEach((slide, i) => {
      const title = slide.querySelector('h2, h1')?.textContent || `Folie ${i + 1}`;
      const isDemo = slide.classList.contains('slide--demo') || slide.dataset.chat;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${i + 1}`;
      a.innerHTML = `
        <span class="slide-num">${i + 1}</span>
        <span>${title}</span>
        ${isDemo ? '<span class="slide-badge">Demo</span>' : ''}
      `;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.engine.goTo(i);
        this.close();
      });
      li.appendChild(a);
      this.list.appendChild(li);
    });
  }

  _bind() {
    // Hover trigger at left edge
    this.trigger.addEventListener('mouseenter', () => this.open());
    this.sidebar.addEventListener('mouseleave', (e) => {
      // Only close if mouse leaves to the right (not into trigger)
      if (e.clientX > 320) this.close();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Update active on slide change
    const origGoTo = this.engine.goTo.bind(this.engine);
    const self = this;
    const currentGoTo = this.engine.goTo;
    this.engine.goTo = function(index) {
      currentGoTo.call(this, index);
      self._updateActive();
    };
  }

  open() {
    this.sidebar.classList.add('open');
    this.isOpen = true;
    this._updateActive();
  }

  close() {
    this.sidebar.classList.remove('open');
    this.isOpen = false;
  }

  _updateActive() {
    const links = this.list.querySelectorAll('a');
    links.forEach((a, i) => {
      a.classList.toggle('active', i === this.engine.current);
    });
    // Scroll active into view
    const active = this.list.querySelector('a.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

export default Sidebar;
