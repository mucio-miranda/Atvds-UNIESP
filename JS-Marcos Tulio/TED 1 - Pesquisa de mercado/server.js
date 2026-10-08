// Servidor local sem dependências: serve o dashboard e expõe uma API de busca.
// Roda só em 127.0.0.1, e as chaves da Adzuna nunca são enviadas de volta ao navegador.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { buscar, ErroAdzuna } = require('./adzuna');
const { analisarVaga, ranking } = require('./extrator');

const PORTA = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';
const RAIZ = __dirname;
const DADOS = process.env.DADOS_DIR || RAIZ;
const ARQ_CONFIG = path.join(DADOS, 'config.local.json');
const ARQ_BUSCAS = path.join(DADOS, 'buscas.local.json');
const MAX_HISTORICO = 20;

// Só estes arquivos são servidos. Config e histórico locais ficam de fora.
const ESTATICOS = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/script.js': ['script.js', 'text/javascript; charset=utf-8'],
  '/busca.js': ['busca.js', 'text/javascript; charset=utf-8'],
  '/data.json': ['data.json', 'application/json; charset=utf-8'],
};

function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return padrao;
  }
}

function credenciais() {
  const appId = process.env.ADZUNA_APP_ID || lerJson(ARQ_CONFIG, {}).appId;
  const appKey = process.env.ADZUNA_APP_KEY || lerJson(ARQ_CONFIG, {}).appKey;
  return appId && appKey ? { appId, appKey } : null;
}

function responder(res, status, corpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': tipo,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
  });
  res.end(typeof corpo === 'string' || Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo));
}

function erro(res, status, mensagem) {
  responder(res, status, { erro: mensagem });
}

// Protege contra páginas de outros sites tentando usar a API (CSRF) e contra DNS rebinding.
function origemConfiavel(req) {
  const hostsOk = [`localhost:${PORTA}`, `127.0.0.1:${PORTA}`];
  if (!hostsOk.includes(req.headers.host)) return false;
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origem = req.headers.origin;
  if (origem && !hostsOk.some((h) => origem === `http://${h}`)) return false;
  return (req.headers['content-type'] || '').startsWith('application/json');
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let dados = '';
    req.on('data', (c) => {
      dados += c;
      if (dados.length > 20000) { reject(new Error('corpo grande demais')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(dados ? JSON.parse(dados) : {}); } catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

function limitar(valor, min, max, padrao) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : padrao;
}

function seguro(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

async function rotaBusca(req, res) {
  const cred = credenciais();
  if (!cred) return erro(res, 400, 'Configure o app_id e o app_key da Adzuna antes de buscar.');

  const corpo = await lerCorpo(req);
  const what = String(corpo.what || '').trim().slice(0, 100);
  if (!what) return erro(res, 400, 'Informe o que buscar (ex.: desenvolvedor react).');
  const where = String(corpo.where || '').trim().slice(0, 100);
  const paginas = limitar(corpo.paginas, 1, 3, 1);
  const maxDaysOld = limitar(corpo.maxDaysOld, 0, 90, 30);
  const somenteFoco = corpo.somenteFoco !== false;

  const { total, vagas: brutas } = await buscar(cred, {
    what, where, maxDaysOld: maxDaysOld || undefined, sortBy: 'date',
  }, paginas);

  const analisadas = brutas.map((v) => ({ ...v, url: seguro(v.url), ...analisarVaga(v) }));
  const vagas = somenteFoco ? analisadas.filter((v) => v.noFoco) : analisadas;
  const resultado = {
    consulta: { what, where, paginas, maxDaysOld, somenteFoco },
    feitaEm: new Date().toISOString(),
    totalNaAdzuna: total,
    coletadas: brutas.length,
    descartadasForaDoFoco: analisadas.length - vagas.length,
    vagas: vagas.map(({ descricao, ...resto }) => ({ ...resto, trecho: descricao.slice(0, 400) })),
    ranking: ranking(vagas),
  };

  const historico = lerJson(ARQ_BUSCAS, []);
  historico.unshift(resultado);
  fs.writeFileSync(ARQ_BUSCAS, JSON.stringify(historico.slice(0, MAX_HISTORICO), null, 2));
  responder(res, 200, resultado);
}

async function rotaApi(req, res, caminho) {
  if (caminho === '/api/status' && req.method === 'GET') {
    return responder(res, 200, { configurado: Boolean(credenciais()), origemEnv: Boolean(process.env.ADZUNA_APP_ID) });
  }
  if (caminho === '/api/config' && req.method === 'POST') {
    const { appId, appKey } = await lerCorpo(req);
    if (!/^[\w-]{4,64}$/.test(String(appId || '')) || !/^[\w-]{8,128}$/.test(String(appKey || ''))) {
      return erro(res, 400, 'app_id ou app_key com formato inválido.');
    }
    fs.writeFileSync(ARQ_CONFIG, JSON.stringify({ appId, appKey }), { mode: 0o600 });
    return responder(res, 200, { configurado: true });
  }
  if (caminho === '/api/config' && req.method === 'DELETE') {
    fs.rmSync(ARQ_CONFIG, { force: true });
    return responder(res, 200, { configurado: Boolean(credenciais()) });
  }
  if (caminho === '/api/buscar' && req.method === 'POST') return rotaBusca(req, res);
  if (caminho === '/api/historico' && req.method === 'GET') {
    return responder(res, 200, lerJson(ARQ_BUSCAS, []));
  }
  return erro(res, 404, 'Rota não encontrada.');
}

const servidor = http.createServer(async (req, res) => {
  try {
    if (!origemConfiavel(req)) return erro(res, 403, 'Origem não permitida.');
    const caminho = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (caminho.startsWith('/api/')) return await rotaApi(req, res, caminho);

    const estatico = ESTATICOS[caminho];
    if (estatico && req.method === 'GET') {
      return responder(res, 200, fs.readFileSync(path.join(RAIZ, estatico[0])), estatico[1]);
    }
    return erro(res, 404, 'Não encontrado.');
  } catch (e) {
    if (e instanceof ErroAdzuna) return erro(res, e.status, e.message);
    return erro(res, 400, e.message || 'Erro na requisição.');
  }
});

if (require.main === module) {
  servidor.listen(PORTA, HOST, () => {
    console.log(`Sistema rodando em http://localhost:${PORTA}`);
    console.log('Pressione Ctrl+C para encerrar.');
  });
}

module.exports = { servidor };
