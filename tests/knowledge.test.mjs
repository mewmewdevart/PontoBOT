import assert from 'node:assert/strict';
import test from 'node:test';
import * as frontKnowledge from '../front/knowledge.js';
import * as backKnowledge from '../back/lib/knowledge.js';

test('front e back compartilham os mesmos tópicos e regras de fallback', () => {
  assert.deepEqual(Object.keys(frontKnowledge.topics), Object.keys(backKnowledge.topics));
  for (const key of Object.keys(frontKnowledge.topics)) {
    const frontTopic = frontKnowledge.topics[key];
    const backTopic = backKnowledge.topics[key];
    assert.equal(frontTopic.title, backTopic.title);
    assert.equal(frontTopic.reply, backTopic.reply);
    assert.deepEqual(frontTopic.action, backTopic.action);
    assert.equal(frontTopic.match?.source, backTopic.match?.source);
    assert.equal(frontTopic.match?.flags, backTopic.match?.flags);
  }
  assert.deepEqual(frontKnowledge.outOfScopeAnswer, backKnowledge.outOfScopeAnswer);
});

test('pergunta de navegação sobre dose abre Medicamentos no front e no back', () => {
  const question = 'Onde registro uma dose?';
  const frontAnswer = frontKnowledge.getFallback(question);
  const backAnswer = backKnowledge.getFallback(question);

  assert.equal(frontAnswer.action.path, '/medicamentos.html');
  assert.equal(frontAnswer.action.label, 'Abrir Medicamentos');
  assert.deepEqual(frontAnswer, backAnswer);
});

test('pergunta clínica sobre qual dose dar explica limite do assistente no fallback e no modelo', () => {
  const question = 'Qual dose devo dar?';
  const frontAnswer = frontKnowledge.getFallback(question);
  const backAnswer = backKnowledge.getFallback(question);

  assert.equal(frontAnswer.action.path, '/ajuda.html');
  assert.match(frontAnswer.reply, /não posso recomendar doses/i);
  assert.deepEqual(frontAnswer, backAnswer);

  const guardedModelAnswer = backKnowledge.getModelAnswer(
    JSON.stringify({ topic: 'medicamentos', reply: 'Abra Medicamentos.' }),
    question
  );
  assert.equal(guardedModelAnswer.action.path, '/ajuda.html');
  assert.match(guardedModelAnswer.reply, /não posso recomendar doses/i);
});

test('outras perguntas fora do escopo e atalhos existentes são tratados corretamente', () => {
  const clinicalQuestions = [
    'Posso dar dois comprimidos?',
    'Quantas gotas devo dar?',
    'O que significa esse exame?',
    'Estou com febre, o que fazer?',
  ];

  for (const question of clinicalQuestions) {
    const frontAnswer = frontKnowledge.getFallback(question);
    const backAnswer = backKnowledge.getFallback(question);
    assert.equal(frontAnswer.action.path, '/ajuda.html', question);
    assert.deepEqual(frontAnswer, backAnswer, question);
  }

  const agenda = frontKnowledge.getFallback('Como assumo um turno?');
  assert.equal(agenda.action.path, '/agenda.html#escala');
  assert.deepEqual(agenda, backKnowledge.getFallback('Como assumo um turno?'));

  const diario = frontKnowledge.getFallback('Onde registro o relato no diário?');
  assert.equal(diario.action.path, '/ficha.html#diario');
  assert.deepEqual(diario, backKnowledge.getFallback('Onde registro o relato no diário?'));
});
