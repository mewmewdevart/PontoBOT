# PontoBOT

Assistente do Mutirão para encontrar a Agenda, consultar Documentos e registrar a passagem de cuidado. Aceita perguntas sugeridas e texto livre, com respostas cadastradas e busca por palavras-chave. Funciona sem chave de IA e sem banco de dados.

- `front/` contém a demonstração e o Web Component `<ponto-bot>`.
- `back/` contém a Vercel Function `POST /api/chat`.

## Testar localmente

Com Node.js 22 ou superior, execute `node preview.mjs` na raiz e abra [http://127.0.0.1:4178](http://127.0.0.1:4178).

## Publicar na Vercel

1. Envie o conteúdo desta pasta para um repositório Git.
2. Importe o repositório em dois projetos na Vercel, usando o preset **Other** para ambos.
3. No projeto do backend, selecione `back` como **Root Directory** e publique. A rota estará em `https://SEU-BACKEND.vercel.app/api/chat`.
4. No projeto do frontend, selecione `front` como **Root Directory**. Troque o domínio de exemplo em `front/vercel.json` pelo domínio publicado do backend antes de publicar o front. A regra encaminha `/api/chat` para o backend.
5. Abra a URL do frontend e envie uma pergunta para confirmar a integração. O script do componente e a API precisam estar acessíveis ao navegador do Mutirão. Se o backend estiver protegido, o encaminhamento público só funcionará após configurar o acesso.

## Incorporar na tela Ajuda

Adicione o módulo uma vez e coloque o componente no ponto desejado. Substitua o domínio abaixo pelo do frontend publicado.

```html
<script type="module" src="https://SEU-FRONTEND.vercel.app/pontobot.js"></script>
<ponto-bot data-app="https://mutirao-citizen-tech.vercel.app/"></ponto-bot>
```

Durante o desenvolvimento do Mutirão, use `data-app="/"` para abrir as telas na origem local. Para informar uma API diretamente, use o atributo opcional `data-api` com a URL completa da rota. O componente herda as variáveis CSS do Mutirão e usa a paleta original em sua ausência.

Edite as sugestões no frontend e as respostas e rotas em `back/api/chat.js`.

