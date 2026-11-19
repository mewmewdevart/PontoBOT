export const topics = {
  inicio: {
    title: 'Tela inicial, porta-remédios, anotar o turno e busca global',
    reply: 'No Início, você acompanha o turno atual, o porta-remédios interativo, a escala da semana e alertas de cobertura ou estoque baixo. Pelo botão Anotar o turno, é possível salvar um relato na Ficha ou criar um compromisso direto na Agenda, além de usar a busca no topo e o seletor Quem recebe cuidado.',
    action: { path: '/home.html', label: 'Abrir Início' },
    match: /\b(inicio|home|porta\s*remedios?|potes?|registrar\s*cuidado|anotar\s*(o\s*)?turno|pesquis\w*|busca\w*|notificac\w*|quem\s*recebe\s*cuidado)\b/,
  },
  medicamentos: {
    title: 'Medicamentos, materiais, rotina de doses e estoque',
    reply: 'Em Medicamentos (Remédios e materiais), a aba Rotina e horários mostra as doses do dia, atrasos e registros. Na aba Itens e estoque, você gerencia medicamentos, materiais sem horário (como fraldas), reposição de estoque e detalhes de cada item.',
    action: { path: '/medicamentos.html', label: 'Abrir Medicamentos' },
    match: /\b(medicamentos?|remedios?|doses?|comprimidos?|insumos?|materiais?|fraldas?|estoques?|repor|reposic\w*|administrad\w*|atrasad\w*)\b/,
  },
  agenda: {
    title: 'Agenda, escala semanal, turnos recorrentes e compromissos',
    reply: 'Na Agenda, você consulta o calendário mensal e a escala semanal, adiciona turnos pontuais, semanais ou diários, pede cobertura para alguém, edita ou cancela horários e cadastra, edita ou exclui compromissos, podendo também compartilhar ou baixar o calendário (.ics).',
    action: { path: '/agenda.html#escala', label: 'Abrir escala na Agenda' },
    match: /\b(agenda|escala|cobertura|cobrir|assum\w*|plantao|turnos?|recorren\w*|semanal|pontual|compromissos?|consultas?|exportar|baixar|ics)\b/,
  },
  documentos: {
    title: 'Documentos, receitas, exames e onde encontrar originais',
    reply: 'Em Documentos, você filtra por Receitas, Exames ou Outros documentos, pesquisa por título ou assunto, vê onde está o arquivo original e acessa o atendimento vinculado na Agenda.',
    action: { path: '/documentos.html', label: 'Abrir Documentos' },
    match: /\b(documentos?|arquivos?|anexos?|laudos?|exames?|receitas?|atestados?|pasta|original)\b/,
  },
  diario: {
    title: 'Ficha de saúde, acompanhamento, consultas e Diário de turno',
    reply: 'Na Ficha, você confere alergias, condições de saúde, contatos, a necessidade de acompanhamento (e encerramento de repetições semanais em Editar ficha) e o Diário de turno. Pelo botão Anotar como foi, você pode vincular a anotação a um turno ou salvar como registro geral.',
    action: { path: '/ficha.html#diario', label: 'Abrir Diário de turno' },
    match: /\b(passagem|diario|relatos?|registr\w*|anotar\s*como\s*foi|ficha|alergias?|historico|imprimir|impressao|emergencia|acompanhamento)\b/,
  },
  pessoas: {
    title: 'Pessoas da rede, cuidadores e convites',
    reply: 'Em Pessoas da rede, você visualiza quem recebe cuidado e os participantes ativos, além de enviar ou cancelar convites simulados para novos familiares e cuidadores.',
    action: { path: '/pessoas.html', label: 'Abrir Pessoas da rede' },
    match: /\b(pessoas?|rede|participantes?|cuidadores?|familia\w*|convites?|convidar)\b/,
  },
  perfil: {
    title: 'Meu perfil, recado, figurinhas e pedidos de folga',
    reply: 'Em Meu perfil, você edita seus dados pessoais, escolhe avatar ou mascote, publica recados para a rede, reage com figurinhas e registra pedidos de folga.',
    action: { path: '/meu-perfil.html', label: 'Abrir Meu perfil' },
    match: /\b(perfil|recados?|figurinhas?|folgas?|avatar|mascote|meus\s*dados)\b/,
  },
  direitos: {
    title: 'Direitos, benefícios sociais e serviços públicos',
    reply: 'Em Direitos e serviços, você encontra guias sobre SUS, Farmácia Popular, BPC/LOAS e Estatuto da Pessoa Idosa, além de um simulador de direitos e busca de serviços por CEP.',
    action: { path: '/direitos.html', label: 'Abrir Direitos e serviços' },
    match: /\b(direitos?|servicos?|beneficios?|sus|farmacia\s*popular|bpc|loas|inss|cras|caps|cep|estatuto|simulador)\b/,
  },
  configuracoes: {
    title: 'Configurações, temas, acessibilidade e notificações',
    reply: 'Em Configurações, você alterna entre os temas neutro, acolhedor e alto contraste, ajusta o tamanho da fonte e ativa ou desativa lembretes de medicação, relatos e o som das notificações.',
    action: { path: '/configuracoes.html', label: 'Abrir Configurações' },
    match: /\b(configurac\w*|temas?|acolhedor|contraste|acessibilidade|fonte|som|silenciar|preferencias?)\b/,
  },
  privacidade: {
    title: 'Privacidade e uso de dados na simulação',
    reply: 'Na tela Privacidade, você consulta como os dados fictícios são tratados na demonstração local do navegador e quais informações permanecem apenas na sessão atual.',
    action: { path: '/privacidade.html', label: 'Abrir Privacidade' },
    match: /\b(privacidade|lgpd|dados|sessao|seguranca|armazenamento)\b/,
  },
  ajuda: {
    title: 'Dúvidas gerais sobre o Mutirão ou perguntas fora do escopo',
    reply: 'Posso ajudar a navegar pelo Início, Agenda, Medicamentos e insumos, Documentos, Ficha e Diário de turno, Pessoas da rede, Direitos e Configurações. Para outras dúvidas, consulte a tela de Ajuda.',
    action: { path: '/ajuda.html', label: 'Abrir Ajuda' },
  },
};

export const fallbackOrder = [
  topics.medicamentos,
  topics.diario,
  topics.documentos,
  topics.agenda,
  topics.direitos,
  topics.configuracoes,
  topics.pessoas,
  topics.perfil,
  topics.privacidade,
  topics.inicio,
];

const outOfScopePatterns = [
  /\b(qual|que)\s+(a\s+)?dose\b/,
  /\bquant[oa]s?\s+(doses?|comprimidos?|capsulas?|gotas?|ml|mg|remedios?|medicamentos?)\b/,
  /\b(devo|posso|preciso|tenho\s+que|pode|faz\s+mal|e\s+seguro)\s+(dar|tomar|aplicar|administrar|aumentar|diminuir|dobrar|reduzir|suspender|parar|trocar|misturar|repetir)\b/,
  /\b(qual|que)\s+(o\s+)?(remedio|medicamento)\s+(devo\s+|posso\s+)?(dar|tomar|usar|comprar|melhor|indicado|serve)\b/,
  /\bo\s+que\s+(dar|tomar|fazer)\b/,
  /\b(diagnostico|sintomas?|efeitos?\s+colaterais?|contraindicac\w*|interacao\s+medicamentosa|superdosagem|overdose|prognostico)\b/,
  /\b(interpretar|analisar|avaliar|explicar|o\s+que\s+significa|resultado\s+d[eo])\s+(o\s+|um\s+|esse\s+|meu\s+|os\s+)?(exames?|laudos?|receitas?|hemograma)\b/,
  /\b(exame|laudo|resultado)\s+(esta|deu|parece)\s+(normal|alterado|alto|baixo|bom|ruim|grave)\b/,
  /\b(e\s+grave|precisa\s+ir\s+ao\s+(medico|hospital|pronto\s*socorro|upa)|chamar\s+(o\s+)?samu)\b/,
];

export const outOfScopeAnswer = {
  reply: 'Não posso recomendar doses, medicamentos ou dar orientação clínica. Para decisões de saúde, consulte um profissional; se precisar, posso mostrar onde registrar informações no Mutirão.',
  action: topics.ajuda.action,
};

export function normalizeQuestion(question) {
  return String(question ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function isOutOfScope(question) {
  const normalized = normalizeQuestion(question);
  return outOfScopePatterns.some((pattern) => pattern.test(normalized));
}

export function getFallback(question) {
  if (isOutOfScope(question)) {
    return { ...outOfScopeAnswer, source: 'faq' };
  }
  const normalized = normalizeQuestion(question);
  const topic = fallbackOrder.find((entry) => entry.match.test(normalized));
  const { reply, action } = topic ?? topics.ajuda;
  return { reply, action, source: 'faq' };
}
