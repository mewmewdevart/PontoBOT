import { getFallback } from './knowledge.js';

const stylesheet = new URL('./pontobot.css', import.meta.url).href;
const avatar = new URL('./avatar.svg', import.meta.url).href;
const defaultApi = new URL('./api/chat', import.meta.url).href;
const defaultApp = 'https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/';
const suggestions = [
  'Como assumo um turno?',
  'Como registro um medicamento ou estoque?',
  'Onde estão os documentos?',
  'Como registro a passagem de cuidado?',
];

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${stylesheet}">
  <section id="bot-panel" class="panel" aria-labelledby="bot-title">
    <header>
      <img class="mark" src="${avatar}" alt="" width="44" height="44" aria-hidden="true">
      <div class="heading"><h2 id="bot-title">PontoBOT</h2><p>Assistente do Mutirão</p></div>
      <button class="close" type="button" aria-label="Fechar assistente PontoBOT">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </header>
    <div class="body">
      <div class="transcript" role="log" aria-label="Conversa" tabindex="0">
        <p class="bubble">Oi! Posso te ajudar a encontrar algo no Mutirão. Escolha uma pergunta ou escreva sua dúvida, sem incluir dados pessoais ou de saúde.</p>
      </div>
      <div class="options-area">
        <button class="options-toggle" type="button" aria-expanded="false" aria-controls="bot-options" hidden>
          <span>Perguntas sugeridas</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div id="bot-options" class="options" aria-label="Perguntas sugeridas" role="group"></div>
      </div>
      <form>
        <label for="bot-question">Sua pergunta</label>
        <div class="compose">
          <input id="bot-question" type="text" maxlength="240" required autocomplete="off" placeholder="Ex.: onde vejo a escala?">
          <button class="send" type="submit">Enviar</button>
        </div>
        <p class="status" role="status"></p>
      </form>
    </div>
  </section>
  <button class="launcher" type="button" aria-expanded="false" aria-controls="bot-panel" aria-label="Abrir assistente PontoBOT">
    <img class="launcher-avatar" src="${avatar}" alt="" width="56" height="56" aria-hidden="true">
  </button>`;

class PontoBot extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.panel = root.querySelector('.panel');
    this.launcher = root.querySelector('.launcher');
    this.closeButton = root.querySelector('.close');
    this.transcript = root.querySelector('.transcript');
    this.options = root.querySelector('.options');
    this.optionsToggle = root.querySelector('.options-toggle');
    this.input = root.querySelector('input');
    this.status = root.querySelector('.status');
    this.history = [];

    for (const question of suggestions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = question;
      button.addEventListener('click', () => this.ask(question));
      this.options.append(button);
    }

    this.optionsToggle.addEventListener('click', () => this.setOptionsVisible(this.options.hidden));

    root.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.ask(this.input.value);
    });
    this.buttons = root.querySelectorAll('.options button, .send');

    this.launcher.addEventListener('click', () => this.toggle());
    this.closeButton.addEventListener('click', () => this.close({ focusLauncher: true }));
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.hasAttribute('inline') && this.isOpen) {
        this.close({ focusLauncher: true });
      }
    });
  }

  connectedCallback() {
    this.syncLayout();
  }

  static get observedAttributes() {
    return ['inline', 'open'];
  }

  attributeChangedCallback(name) {
    if (name === 'inline' || name === 'open') this.syncLayout();
  }

  get isOpen() {
    return this.hasAttribute('inline') || this.hasAttribute('open');
  }

  syncLayout() {
    const inline = this.hasAttribute('inline');
    const open = this.isOpen;
    this.panel.hidden = !inline && !open;
    this.launcher.hidden = inline || open;
    this.launcher.setAttribute('aria-expanded', String(open));
  }

  open() {
    if (this.hasAttribute('inline')) return;
    this.setAttribute('open', '');
    requestAnimationFrame(() => this.input.focus());
  }

  close({ focusLauncher = false } = {}) {
    if (this.hasAttribute('inline')) return;
    this.removeAttribute('open');
    if (focusLauncher) this.launcher.focus();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  setOptionsVisible(visible) {
    this.options.hidden = !visible;
    this.optionsToggle.setAttribute('aria-expanded', String(visible));
    this.panel.classList.toggle('options-collapsed', !visible);
  }

  appendMessage(message, className, action) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', className);
    const text = document.createElement('p');
    text.textContent = message;
    bubble.append(text);

    if (action) {
      const app = new URL(this.dataset.app || defaultApp, document.baseURI);
      const { path, label } = action;
      const caminhoInterno = typeof path === 'string' && /^\/[a-z-]+\.html(?:#[a-z-]+)?$/.test(path);
      if (caminhoInterno && typeof label === 'string') {
        const destination = new URL(path.slice(1), app);
        if (['https:', 'http:'].includes(destination.protocol) && destination.origin === app.origin) {
          const link = document.createElement('a');
          link.href = destination.href;
          link.textContent = label;
          bubble.append(link);
        }
      }
    }

    this.transcript.append(bubble);
    this.transcript.scrollTop = this.transcript.scrollHeight;
    return bubble;
  }

  async ask(rawQuestion) {
    const question = rawQuestion.trim();
    if (!question || this.pending) return;
    this.pending = true;
    this.status.textContent = 'Buscando resposta…';
    const focusedButton = [...this.buttons].find((button) => button === this.shadowRoot.activeElement);
    const cameFromOptions = Boolean(focusedButton && this.options.contains(focusedButton));
    this.panel.classList.add('has-conversation');
    this.optionsToggle.hidden = false;
    this.setOptionsVisible(false);
    for (const button of this.buttons) button.disabled = true;
    this.appendMessage(question, 'user');

    try {
      const response = await fetch(this.dataset.api || defaultApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: this.history }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('API indisponível');

      const answer = await response.json();
      this.appendMessage(answer.reply, 'bot', answer.action);
      this.history.push({ role: 'user', text: question }, { role: 'model', text: answer.reply });
      this.history = this.history.slice(-6);
      this.status.textContent = '';
      if (this.input.value.trim() === question) this.input.value = '';
    } catch {
      const fallback = getFallback(question);
      this.appendMessage(fallback.reply, 'bot', fallback.action);
      this.history.push({ role: 'user', text: question }, { role: 'model', text: fallback.reply });
      this.history = this.history.slice(-6);
      this.status.textContent = 'Respondendo com a base local de ajuda.';
      if (this.input.value.trim() === question) this.input.value = '';
    } finally {
      this.pending = false;
      for (const button of this.buttons) button.disabled = false;
      if (cameFromOptions && this.options.hidden) {
        this.input.focus();
      } else if (focusedButton && document.activeElement === document.body) {
        focusedButton.focus();
      }
    }
  }
}

if (!customElements.get('ponto-bot')) customElements.define('ponto-bot', PontoBot);


