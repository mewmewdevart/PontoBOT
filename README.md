# PontoBOT com Gemini

O PontoBOT orienta famílias e cuidadores a usar a Agenda, os Documentos e o Diário de turno do Mutirão. O Gemini recebe a pergunta e até três trocas recentes para entender referências. As instruções do assistente partem de uma base de ajuda cadastrada. O servidor escolhe links de uma lista de rotas do Mutirão.

- `front/` reúne a demonstração e o componente `<ponto-bot>`.
- `back/` reúne o servidor Express, a base de ajuda e a integração com `@google/genai`.
- `POST /api/chat` recebe `question` e um `history` opcional com pares `{ role, text }`. Retorna `reply`, `action` e `source` (`gemini` ou `faq`). O FAQ entra em ação se o Gemini estiver indisponível ou sem chave.
- `GET /api/health` informa se a chave foi configurada e qual modelo será usado. A verificação da API do Google acontece ao conversar.

## Atualizar o projeto que já está na Vercel

1. Atualize `front/` e `back/` no repositório do PontoBOT. Se estiver copiando os arquivos sobre a versão anterior, exclua `back/api/chat.js` e `back/vercel.json` antigos. A rota agora está em `back/app.js`.
2. No projeto `pontobot-back`, mantenha **Root Directory** em `back` e configure o preset **Express**. Use os padrões de build e saída. O `app.js` exporta a aplicação para a Vercel.
3. Em **Settings → Environment Variables** do backend, adicione `GEMINI_API_KEY` com uma chave do [Google AI Studio](https://aistudio.google.com/apikey). A chave pertence apenas ao backend. `GEMINI_MODEL` é opcional e o padrão é `gemini-3.1-flash-lite`.
4. Se os domínios do frontend ou do Mutirão forem diferentes dos exemplos, adicione `CORS_ORIGINS` no backend. Separe as origens por vírgula e use esquema e host, sem barra final. Ao definir esse campo, inclua todas as origens que devem ter acesso. Veja `back/.env.example`.
5. Publique o backend e acesse `/api/health`. Em seguida, confirme uma resposta `source: "gemini"` com o teste abaixo. Se o status de configuração estiver correto e a resposta vier do FAQ, revise acesso ao modelo, chave, cota e logs.
6. No projeto `pontobot-front`, mantenha **Root Directory** em `front` e preset **Other**. `front/vercel.json` encaminha a rota do chatbot para `https://pontobot-back.vercel.app/api/chat`. Ajuste o destino somente se o domínio do backend mudar.

Teste pelo PowerShell:

```powershell
$body = @{ question = 'Ninguém vai poder cuidar da Mari à tarde. Onde vejo quem pode assumir?' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://pontobot-back.vercel.app/api/chat' -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
```

O histórico fica em memória no navegador e é enviado em cada pergunta, limitado a três trocas. O servidor encaminha o texto ao Gemini e não lê fichas, documentos ou registros do Mutirão. Oriente os usuários a evitar dados pessoais e de saúde. Para uma API pública, trate CORS como controle do navegador e aplique limites de uso no gateway ou na Vercel e na conta do provedor para proteger a cota.

## Testar localmente

Com Node.js 22, execute `npm --prefix back install` na raiz do projeto. Copie `back/.env.example` para `back/.env` e preencha `GEMINI_API_KEY`. Execute `node preview.mjs` e abra [http://127.0.0.1:4178](http://127.0.0.1:4178). Para executar só a API, use `npm --prefix back run dev`.

## Incorporar na Ajuda do Mutirão

```html
<script type="module" src="mutirao-pontobot-frontend.vercel.app/pontobot.js"></script>
<ponto-bot data-app="https://mutirao-citizen-tech.vercel.app/"></ponto-bot>
```

Substitua o domínio do módulo pelo domínio real do frontend, se necessário. O componente herda as variáveis CSS do Mutirão. Para apontar diretamente à API, informe a URL completa no atributo opcional `data-api`.

