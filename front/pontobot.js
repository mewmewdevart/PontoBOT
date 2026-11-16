const stylesheet = new URL('./pontobot.css', import.meta.url).href;
const avatar = new URL('./avatar.svg', import.meta.url).href;
const defaultApi = new URL('./api/chat', import.meta.url).href;
const defaultApp = 'https://mutirao-citizen-tech.vercel.app/';
const suggestions = [
  'Como assumo um turno?',
  'Onde estão os documentos?',
  'Como registro a passagem de cuidado?',
];

const localTopics = [
  {
    match: /\b(passagem|diario|relatos?|registr\w*|ficha|rotina|aconteceu)\b/,
    reply: 'Na Ficha, vá até Diário de turno e selecione Registrar relato. Anote o que aconteceu e o que a próxima pessoa precisa acompanhar.',
    action: { path: '/ficha.html#diario', label: 'Abrir Diário de turno' },
  },
  {
    match: /\b(documentos?|arquivos?|anexos?|laudos?|exames?|receitas?|atestados?)\b/,
    reply: 'Na tela Documentos, você pode consultar os arquivos da pessoa acompanhada.',
    action: { path: '/documentos.html', label: 'Abrir Documentos' },
  },
  {
    match: /\b(agenda|escala|cobertura|assum\w*|plantao|turnos?|horarios?)\b/,
    reply: 'Na Agenda, encontre o horário sem cobertura, confira as orientações do turno e confirme que você vai assumir.',
    action: { path: '/agenda.html', label: 'Abrir Agenda' },
  },
];

const defaultLocalTopic = {
  reply: 'Posso ajudar a usar a Agenda, os Documentos e o Diário de turno. Para outras dúvidas sobre a plataforma, consulte a tela de Ajuda.',
  action: { path: '/ajuda.html', label: 'Abrir Ajuda' },
};

function getLocalFallback(question) {
  const normalized = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const topic = localTopics.find((entry) => entry.match.test(normalized)) ?? defaultLocalTopic;
  return { reply: topic.reply, action: topic.action };
}

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${stylesheet}">
  <section class="panel" aria-labelledby="bot-title">
    <header>
      <img class="mark" src="${avatar}" alt="" width="44" height="44" aria-hidden="true">
      <div><h2 id="bot-title">PontoBOT</h2><p>Assistente do Mutirão</p></div>
    </header>
    <div class="body">
      <div class="transcript" role="log" aria-label="Conversa" tabindex="0">
        <p class="bubble">Oi! Posso te ajudar a encontrar algo no Mutirão. Escolha uma pergunta ou escreva sua dúvida, sem incluir dados pessoais ou de saúde.</p>
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
    this.history = [];

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
      const fallback = getLocalFallback(question);
      this.appendMessage(fallback.reply, 'bot', fallback.action);
      this.history.push({ role: 'user', text: question }, { role: 'model', text: fallback.reply });
      this.history = this.history.slice(-6);
      this.status.textContent = 'Respondendo com a base local de ajuda.';
      if (this.input.value.trim() === question) this.input.value = '';
    } finally {
      this.pending = false;
      for (const button of this.buttons) button.disabled = false;
      if (focusedButton && document.activeElement === document.body) focusedButton.focus();
    }
  }
}

if (!customElements.get('ponto-bot')) customElements.define('ponto-bot', PontoBot);


