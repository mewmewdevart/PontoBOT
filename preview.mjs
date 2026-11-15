import { fileURLToPath } from 'node:url';
import express from './back/node_modules/express/index.js';
import api from './back/app.js';

const app = express();
app.disable('x-powered-by');
app.use(express.static(fileURLToPath(new URL('./front/', import.meta.url))));
app.use(api);
app.listen(4178, '127.0.0.1', () => console.log('PontoBOT em http://127.0.0.1:4178'));

