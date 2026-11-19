import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createOriginChecker, createRateLimiter, defaultOrigins } from '../back/lib/security.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(key, value) {
      if (typeof key === 'object') Object.assign(this.headers, key);
      else this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('front/index.html, front/pontobot.js e README.md usam URL absoluta do Mutirão com https://', () => {
  const indexHtml = fs.readFileSync(new URL('../front/index.html', import.meta.url), 'utf8');
  const pontobotJs = fs.readFileSync(new URL('../front/pontobot.js', import.meta.url), 'utf8');
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');

  assert.match(indexHtml, /href="https:\/\/mutirao-ctrlpeople-citizen-tech-26\.vercel\.app\/"/);
  assert.match(indexHtml, /<ponto-bot\s+inline\s+data-app="https:\/\/mutirao-ctrlpeople-citizen-tech-26\.vercel\.app\/"><\/ponto-bot>/);
  assert.match(pontobotJs, /const defaultApp = 'https:\/\/mutirao-ctrlpeople-citizen-tech-26\.vercel\.app\/';/);
  assert.doesNotMatch(readme, /(?<!https:\/\/)mutirao-ctrlpeople-citizen-tech-26\.vercel\.app/);

  const defaultApp = 'https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/';
  const demoBase = 'https://mutirao-pontobot-frontend.vercel.app/';
  const agendaPath = '/agenda.html#escala';

  const inlineApp = new URL('https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/', demoBase);
  const inlineDest = new URL(agendaPath.slice(1), inlineApp);
  assert.equal(inlineDest.href, 'https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/agenda.html#escala');

  const floatingApp = new URL(defaultApp, demoBase);
  const floatingDest = new URL(agendaPath.slice(1), floatingApp);
  assert.equal(floatingDest.href, 'https://mutirao-ctrlpeople-citizen-tech-26.vercel.app/agenda.html#escala');
});

test('verificação de Origin bloqueia requisições sem Origin ou de origem não autorizada', () => {
  const allowOrigin = createOriginChecker({ originsEnv: '', prodUrl: '' });
  const appJs = fs.readFileSync(new URL('../back/app.js', import.meta.url), 'utf8');

  assert.ok(defaultOrigins.includes('https://mutirao-ctrlpeople-citizen-tech-26.vercel.app'));
  assert.ok(defaultOrigins.includes('https://mutirao-pontobot-frontend.vercel.app'));
  assert.equal(allowOrigin(undefined), false);
  assert.equal(allowOrigin(''), false);
  assert.equal(allowOrigin('https://origem-desconhecida.invalid'), false);
  assert.equal(allowOrigin('https://mutirao-ctrlpeople-citizen-tech-26.vercel.app'), true);
  assert.equal(allowOrigin('https://mutirao-pontobot-frontend.vercel.app'), true);
  assert.match(appJs, /if\s*\(!allowOrigin\(origin\)\)\s*return\s*res\.status\(403\)/);
  assert.match(appJs, /checkRateLimit/);
});

test('limitação de frequência bloqueia após exceder o limite por cliente sem afetar outro cliente', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

  for (let i = 0; i < 3; i++) {
    let nextCalled = false;
    const res = createMockRes();
    limiter({ method: 'POST', headers: { 'x-forwarded-for': '198.51.100.20' }, get: (h) => (h.toLowerCase() === 'x-forwarded-for' ? '198.51.100.20' : undefined) }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(res.headers['RateLimit-Remaining'], String(2 - i));
  }

  let blockedNext = false;
  const blockedRes = createMockRes();
  limiter({ method: 'POST', headers: { 'x-forwarded-for': '198.51.100.20' }, get: (h) => (h.toLowerCase() === 'x-forwarded-for' ? '198.51.100.20' : undefined) }, blockedRes, () => { blockedNext = true; });
  assert.equal(blockedNext, false);
  assert.equal(blockedRes.statusCode, 429);
  assert.ok(Number(blockedRes.headers['Retry-After']) >= 1);

  let otherClientNext = false;
  const otherRes = createMockRes();
  limiter({ method: 'POST', headers: { 'x-forwarded-for': '198.51.100.30' }, get: (h) => (h.toLowerCase() === 'x-forwarded-for' ? '198.51.100.30' : undefined) }, otherRes, () => { otherClientNext = true; });
  assert.equal(otherClientNext, true);
});
