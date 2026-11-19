# PontoBOT — Assistente de Navegação do Mutirão

Assistente virtual desenvolvido para ser integrado ao projeto **[Mutirão (`CitizenTechFIAPChallenge`)](https://github.com/mewmewdevart/CitizenTechFIAPChallenge)**, orientando familiares e cuidadores a encontrar telas e funcionalidades da plataforma (Agenda, Documentos, Diário de turno e Ajuda). Combina um **Web Component** isolado em Shadow DOM no frontend com uma API **Express + Google Gemini** no backend e fallback local automático.

- **Projeto principal (Mutirão / CitizenTechFIAPChallenge):** https://github.com/mewmewdevart/CitizenTechFIAPChallenge
- **Aplicação Mutirão no ar:** https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/
- **Frontend / Demo do PontoBOT:** https://mutirao-pontobot-frontend.vercel.app/
- **Backend (Health check):** https://mutirao-pontobot-backend.vercel.app/api/health

---

## Principais recursos

- **Widget flutuante ou embutido:** Por padrão, `<ponto-bot>` aparece como um botão circular no canto inferior direito que se oculta ao abrir o chat; com o atributo `inline`, renderiza aberto diretamente no fluxo da página.
- **Acessibilidade e responsividade:** Gerenciamento de foco ao abrir/fechar, fechamento por `Esc`, `role="log"` no histórico, `role="status"` no carregamento, suporte a `prefers-reduced-motion` e adaptação automática para telas pequenas (`<= 480px`).
- **IA com Gemini + Fallback resiliente:** Usa `@google/genai` (`gemini-3.5-flash-lite` por padrão) com saída estruturada em JSON e instrução de sistema focada em linguagem simples e segura. Se o Gemini falhar ou atingir cota, responde automaticamente pela base local de FAQ (`source: "faq"`).
- **Privacidade:** O histórico fica apenas em memória no navegador (limitado às últimas 3 trocas). O servidor não acessa fichas, documentos ou registros do Mutirão.

---

## Estrutura do projeto

```text
PontoBOT/
├── back/
│   ├── lib/
│   │   └── knowledge.js   # Tópicos, rotas, prompt do sistema e fallback
│   ├── app.js             # Aplicação Express (CORS, validação, /api/chat, /api/health)
│   ├── dev.js             # Servidor local da API
│   └── package.json
├── front/
│   ├── favicon_io/
│   ├── avatar.svg
│   ├── demo.css           # Estilos da página de demonstração
│   ├── index.html         # Página de demonstração (<ponto-bot inline>)
│   ├── pontobot.css       # Estilos do Web Component (Shadow DOM)
│   ├── pontobot.js        # Implementação do elemento <ponto-bot>
│   └── vercel.json        # Header CORS de /pontobot.js e rewrite de /api/chat
├── preview.mjs            # Servidor local integrado (front + API)
├── LICENSE                # Licença MIT
└── README.md
```

---

## Como incorporar em uma página

### Modo widget flutuante (padrão)

```html
<script type="module" src="https://mutirao-pontobot-frontend.vercel.app/pontobot.js"></script>
<ponto-bot data-app="https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/"></ponto-bot>
```

### Modo embutido (inline)

```html
<script type="module" src="https://mutirao-pontobot-frontend.vercel.app/pontobot.js"></script>
<ponto-bot inline data-app="https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/"></ponto-bot>
```

### Atributos suportados

| Atributo | Obrigatório | Descrição |
| :--- | :--- | :--- |
| `data-app` | Não | URL base do Mutirão usada para montar os links de atalho (padrão: `https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/`). |
| `data-api` | Não | URL completa do endpoint `POST /api/chat` (padrão: `/api/chat` na origem do módulo `pontobot.js`). |
| `inline` | Não | Quando presente, exibe o painel aberto no fluxo da página em vez do botão flutuante. |

O componente também herda variáveis CSS do tema do Mutirão (como `--cor-primaria`, `--cor-superficie`, `--cor-texto-principal` e `--fonte-interface`) quando disponíveis na página hospedeira.

---

## Rodar localmente

**Pré-requisitos:** Node.js `22.x` e uma chave da [Google AI Studio](https://aistudio.google.com/apikey).

1. Instale as dependências do backend:
   ```bash
   npm --prefix back install
   ```

2. Crie o arquivo `back/.env` com suas variáveis:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   # Opcionais:
   # GEMINI_MODEL=gemini-3.5-flash-lite
   # CORS_ORIGINS=http://127.0.0.1:4178,http://localhost:4178
   ```

3. Inicie o preview integrado (frontend + backend):
   ```bash
   node preview.mjs
   ```
   Acesse **http://127.0.0.1:4178**.

   > Para executar somente a API em modo watch, use `npm --prefix back run dev`.

---

## Endpoints da API

### `GET /api/health` (ou `GET /`)
Verifica se o serviço está ativo e se a chave do Gemini foi configurada.

```json
{
  "status": "ok",
  "geminiConfigured": true,
  "model": "gemini-3.5-flash-lite"
}
```

### `POST /api/chat`
Envia uma pergunta (até `240` caracteres) e um histórico opcional com até `6` itens alternados (`user` / `model`).

**Requisição:**
```json
{
  "question": "Como assumo um turno?",
  "history": []
}
```

**Resposta:**
```json
{
  "reply": "Na Agenda, encontre o horário sem cobertura, confira as orientações do turno e confirme que você vai assumir.",
  "action": {
    "path": "/agenda.html",
    "label": "Abrir Agenda"
  },
  "source": "gemini"
}
```

**Teste rápido pelo PowerShell:**
```powershell
$body = @{ question = 'Como assumo um turno?' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://mutirao-pontobot-backend.vercel.app/api/chat' -Headers @{ Origin = 'https://mutirao-pontobot-frontend.vercel.app' } -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
```

A rota `/api/chat` exige cabeçalho `Origin` autorizado (`CORS_ORIGINS` ou origens padrão) e aplica limitação de frequência por cliente (`20` requisições por minuto por padrão, configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`), retornando `429` quando excedido para acionar o fallback local no componente. Para o ambiente publicado, confira também os limites de requisições e de gasto do provedor e da plataforma.

---

## Deploy na Vercel

O repositório é publicado em dois projetos separados na Vercel:

1. **Backend (`mutirao-pontobot-backend`):**
   - **Root Directory:** `back`
   - **Framework Preset:** `Express`
   - **Environment Variables:** adicione `GEMINI_API_KEY` (e opcionalmente `GEMINI_MODEL` e `CORS_ORIGINS`).
2. **Frontend (`mutirao-pontobot-frontend`):**
   - **Root Directory:** `front`
   - **Framework Preset:** `Other`
   - O arquivo `front/vercel.json` habilita CORS para `/pontobot.js` e encaminha `/api/chat` para `https://mutirao-pontobot-backend.vercel.app/api/chat`.

---

## Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.
