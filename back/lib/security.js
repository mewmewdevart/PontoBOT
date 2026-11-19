export const defaultOrigins = [
  'http://127.0.0.1:4178',
  'http://localhost:4178',
  'https://mutirao-pontobot-frontend.vercel.app',
  'https://mutirao-ctrlpeople-citizen-tech-26.vercel.app',
];

export function createOriginChecker({
  originsEnv = process.env.CORS_ORIGINS,
  prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL,
} = {}) {
  const configured = originsEnv?.split(',').map((origin) => origin.trim()).filter(Boolean);
  const allowed = new Set(configured?.length ? configured : defaultOrigins);
  const cleanProdUrl = prodUrl?.trim();

  return function allowOrigin(origin) {
    if (!origin || typeof origin !== 'string') return false;
    if (allowed.has(origin)) return true;
    return Boolean(cleanProdUrl && origin === `https://${cleanProdUrl}`);
  };
}

export function getClientKey(req) {
  const header = typeof req.get === 'function' ? req.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
  const forwarded = typeof header === 'string' ? header.split(',')[0]?.trim() : '';
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) > 0 ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 60_000,
  max = Number(process.env.RATE_LIMIT_MAX) > 0 ? Number(process.env.RATE_LIMIT_MAX) : 20,
} = {}) {
  const clientHits = new Map();

  return function checkRateLimit(req, res, next) {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    if (clientHits.size > 1000) {
      for (const [entryKey, entry] of clientHits) {
        if (entry.resetAt <= now) clientHits.delete(entryKey);
      }
    }
    const clientKey = getClientKey(req);
    let entry = clientHits.get(clientKey);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clientHits.set(clientKey, entry);
    }
    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.set({
      'RateLimit-Limit': String(max),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(resetSeconds),
    });
    if (entry.count > max) {
      res.set('Retry-After', String(resetSeconds));
      return res.status(429).json({ error: 'Muitas perguntas em pouco tempo. Aguarde alguns segundos e tente novamente.' });
    }
    return next();
  };
}
