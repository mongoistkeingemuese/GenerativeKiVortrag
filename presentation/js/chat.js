const SYSTEM_PROMPTS = {
  'code-gen': 'Du bist ein hilfreicher Programmier-Assistent. Generiere sauberen, gut kommentierten Code. Antworte auf Deutsch, Code-Kommentare auf Englisch.',
  'code-explain': 'Du bist ein Code-Erklärer. Wenn der Nutzer Code einfügt, erkläre was er tut — Schritt für Schritt, verständlich. Antworte auf Deutsch.',
  'open': 'Du bist ein freundlicher KI-Assistent, der Fragen über Generative KI im Programmieralltag beantwortet. Antworte auf Deutsch, kompakt und verständlich.'
};

class ChatWidget {
  constructor() {
    this.panel = document.getElementById('chatPanel');
    this.toggle = document.getElementById('chatToggle');
    this.closeBtn = document.getElementById('chatClose');
    this.messages = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.status = document.getElementById('chatStatus');

    this.history = [];
    this.isStreaming = false;
    this.currentContext = 'open';

    this._bind();
    this._checkHealth();
  }

  _bind() {
    this.toggle.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.sendBtn.addEventListener('click', () => this._send());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel.classList.contains('open')) {
        this.close();
      }
    });
  }

  open() {
    this.panel.classList.add('open');
    this.input.focus();
  }

  close() {
    this.panel.classList.remove('open');
  }

  setContext(context) {
    if (context === this.currentContext) return;
    this.currentContext = context;
    this.history = [];
    this.messages.innerHTML = '';
    this._addSystemMessage(`Kontext: ${context}`);
  }

  async _send() {
    const text = this.input.value.trim();
    if (!text || this.isStreaming) return;

    this.input.value = '';
    this._addMessage('user', text);

    this.history.push({ role: 'user', content: text });

    const systemPrompt = SYSTEM_PROMPTS[this.currentContext] || SYSTEM_PROMPTS.open;
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.history
    ];

    this.isStreaming = true;
    this.sendBtn.disabled = true;

    const assistantEl = this._addMessage('assistant', '');
    let fullContent = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        this._setContent(assistantEl, `Fehler: ${err.error || response.statusText}`);
        this.isStreaming = false;
        this.sendBtn.disabled = false;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const json = JSON.parse(data);
            if (json.content) {
              fullContent += json.content;
              this._setContent(assistantEl, fullContent);
            }
          } catch { /* skip invalid chunks */ }
        }
      }

      this.history.push({ role: 'assistant', content: fullContent });
    } catch (err) {
      this._setContent(assistantEl, `Verbindungsfehler: ${err.message}`);
    }

    this.isStreaming = false;
    this.sendBtn.disabled = false;
    this.input.focus();
  }

  _addMessage(role, content) {
    const el = document.createElement('div');
    el.className = `chat-message chat-message--${role}`;
    this._setContent(el, content);
    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
    return el;
  }

  _addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'chat-message chat-message--system';
    el.textContent = text;
    this.messages.appendChild(el);
  }

  _setContent(el, content) {
    el.innerHTML = this._renderMarkdown(content);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  _renderMarkdown(text) {
    if (!text) return '';
    // Simple markdown: code blocks, inline code, bold, italic
    return text
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  async _checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        this.status.textContent = `${data.provider} / ${data.model}`;
        this.status.className = 'chat-status connected';
      } else {
        this.status.textContent = 'Backend nicht erreichbar';
        this.status.className = 'chat-status error';
      }
    } catch {
      this.status.textContent = 'Backend nicht erreichbar';
      this.status.className = 'chat-status error';
    }
  }
}

export default ChatWidget;
