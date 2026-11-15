const topics = [
  {
    keywords: /\b(agendas?|turnos?|escalas?|plantoes|plantao|cobertura|horarios?)\b/g,
    priority: /\b(assum\w*|cobertura|escalas?)\b/,
    reply: 'Na Agenda, encontre o horário sem cobertura, confira as orientações do turno e confirme que você vai assumir.',
    action: { path: '/agenda.html', label: 'Abrir Agenda' },
  },
  {
    keywords: /\b(documentos?|arquivos?|anexos?|laudos?|exames?)\b/g,
    priority: /\b(documentos?|arquivos?)\b/,
    reply: 'Abra Documentos para consultar os arquivos da pessoa acompanhada.',
    action: { path: '/documentos.html', label: 'Abrir Documentos' },
  },
  {
    keywords: /\b(passagem|diario|relatos?|regist\w*|anot\w*)\b/g,
    priority: /\b(passagem|diario|relatos?)\b/,
    reply: 'Na Ficha, vá até Diário de turno e selecione Registrar relato. Anote o que aconteceu e o que a próxima pessoa precisa acompanhar.',
    action: { path: '/ficha.html#diario', label: 'Abrir Diário de turno' },
  },
];

const fallback = {
  reply: 'Posso ajudar com a Agenda, os Documentos e o Diário de turno. Experimente uma das perguntas sugeridas ou consulte a tela de Ajuda.',
  action: { path: '/ajuda.html', label: 'Abrir Ajuda' },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

function findAnswer(question) {
  const normalized = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  let best = fallback;
  let bestScore = 0;
  for (const topic of topics) {
    const matches = new Set(normalized.match(topic.keywords) ?? []);
    const score = matches.size + (topic.priority.test(normalized) ? 2 : 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return { reply: best.reply, action: best.action };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405, headers: { ...headers, Allow: 'POST, OPTIONS' } });
    }

    try {
      const payload = await request.json();
      const question = typeof payload?.question === 'string' ? payload.question.trim() : '';
      if (!question || question.length > 240) {
        return Response.json({ error: 'Envie uma pergunta de até 240 caracteres.' }, { status: 400, headers });
      }
      return Response.json(findAnswer(question), { headers });
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return Response.json({ error: 'Envie um JSON válido.' }, { status: 400, headers });
    }
  },
};

