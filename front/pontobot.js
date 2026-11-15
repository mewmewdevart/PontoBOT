const stylesheet = new URL('./pontobot.css', import.meta.url).href;
const defaultApi = new URL('./api/chat', import.meta.url).href;
const defaultApp = 'https://mutirao-citizen-tech.vercel.app/';
const suggestions = [
  'Como assumo um turno?',
  'Onde estão os documentos?',
  'Como registro a passagem de cuidado?',
];

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${stylesheet}">
  <section class="panel" aria-labelledby="bot-title">
    <header>
      <span class="mark" aria-hidden="true">●</span>
      <div><h2 id="bot-title">PontoBOT</h2><p>Assistente do Mutirão</p></div>
    </header>
    <div class="body">
      <div class="transcript" role="log" aria-label="Conversa" tabindex="0">
        <p class="bubble">Oi! Posso te ajudar a encontrar algo no Mutirão. Escolha uma pergunta ou escreva sua dúvida.</p>
      </div>
      <div class="options" aria-label="Perguntas sugeridas" role="group"></div>
      <form>
        <label for="bot-question">Sua pergunta</label>
        <div class="compose">
          <input id="bot-question" type="text" maxlength="240" required autocomplete="off" placeholder="Ex.: onde vejo a escala?">
          <button class="send" type="submit">Enviar</button>
        </div>
        <p class="status" role="status"></p>
      </form>
    </div>
  </section>`;

class PontoBot extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.transcript = root.querySelector('.transcript');
    this.input = root.querySelector('input');
    this.status = root.querySelector('.status');

    const options = root.querySelector('.options');
    for (const question of suggestions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = question;
      button.addEventListener('click', () => this.ask(question));
      options.append(button);
    }

    root.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.ask(this.input.value);
    });
    this.buttons = root.querySelectorAll('button');
  }

  appendMessage(message, className, action) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', className);
    const text = document.createElement('p');
    text.textContent = message;
    bubble.append(text);

    if (action) {
      const app = new URL(this.dataset.app || defaultApp, document.baseURI);
      const destination = new URL(action.path, app);
      if (['https:', 'http:'].includes(destination.protocol) && destination.origin === app.origin) {
        const link = document.createElement('a');
        link.href = destination.href;
        link.textContent = action.label;
        bubble.append(link);
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
    for (const button of this.buttons) button.disabled = true;
    const message = this.appendMessage(question, 'user');

    try {
      const response = await fetch(this.dataset.api || defaultApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('API indisponível');

      const answer = await response.json();
      this.appendMessage(answer.reply, 'bot', answer.action);
      this.status.textContent = '';
      if (this.input.value.trim() === question) this.input.value = '';
    } catch {
      message.remove();
      this.status.textContent = 'Não consegui carregar a resposta. Tente de novo em instantes.';
    } finally {
      this.pending = false;
      for (const button of this.buttons) button.disabled = false;
      if (focusedButton && document.activeElement === document.body) focusedButton.focus();
    }
  }
}

if (!customElements.get('ponto-bot')) customElements.define('ponto-bot', PontoBot);

