import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import chat from './back/api/chat.js';

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/demo.css', ['demo.css', 'text/css']],
  ['/pontobot.css', ['pontobot.css', 'text/css']],
  ['/pontobot.js', ['pontobot.js', 'text/javascript']],
]);

const origin = 'http://127.0.0.1:4178';

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, origin);
    if (pathname === '/api/chat') {
      const response = await chat.fetch(new Request(new URL(req.url, origin), {
        method: req.method,
        headers: req.headers,
        ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Readable.toWeb(req), duplex: 'half' }),
      }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(res);
      else res.end();
      return;
    }

    const asset = assets.get(pathname);
    if (!asset) {
      res.writeHead(404).end();
      return;
    }
    const [file, mime] = asset;
    const content = await readFile(new URL(`./front/${file}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` }).end(content);
  } catch {
    res.writeHead(500).end();
  }
}).listen(4178, '127.0.0.1', () => console.log(`PontoBOT disponível em ${origin}`));

