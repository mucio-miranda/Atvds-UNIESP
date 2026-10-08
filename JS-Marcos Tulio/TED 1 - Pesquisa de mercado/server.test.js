const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORTA = 3917;
process.env.PORT = String(PORTA);
process.env.DADOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ted1-'));
delete process.env.ADZUNA_APP_ID;
delete process.env.ADZUNA_APP_KEY;

const { servidor } = require('./server');
const base = `http://localhost:${PORTA}`;
const realFetch = global.fetch;

const respostaAdzuna = {
  count: 2,
  results: [
    {
      id: 1, title: 'Desenvolvedor React Pleno', description: 'Remoto. React, TypeScript, Git e inglês. <b>Docker</b>',
      company: { display_name: 'Acme' }, location: { display_name: 'João Pessoa, Paraíba' },
      redirect_url: 'https://exemplo.com/vaga/1', salary_min: 72000, salary_max: 96000, salary_is_predicted: '0',
      created: '2026-10-01T10:00:00Z', contract_time: 'full_time',
    },
    {
      id: 2, title: 'Vendedor', description: 'Vendas externas', company: { display_name: 'Loja' },
      location: { display_name: 'Recife' }, redirect_url: 'javascript:alert(1)',
    },
  ],
};

// Só intercepta chamadas à Adzuna; as requisições ao servidor local passam direto.
function simularAdzuna(resposta, status = 200) {
  global.fetch = async (url, opts) => {
    if (String(url).startsWith('https://api.adzuna.com/')) {
      simularAdzuna.ultima = String(url);
      return { ok: status < 400, status, json: async () => resposta };
    }
    return realFetch(url, opts);
  };
}

test.before(() => new Promise((ok) => servidor.listen(PORTA, '127.0.0.1', ok)));
test.after(() => { global.fetch = realFetch; servidor.close(); });

const post = (rota, corpo, headers = {}) => realFetch(base + rota, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(corpo),
});

test('serve a página e os dados, mas não os arquivos locais', async () => {
  assert.strictEqual((await realFetch(`${base}/`)).status, 200);
  assert.strictEqual((await realFetch(`${base}/data.json`)).status, 200);
  assert.strictEqual((await realFetch(`${base}/config.local.json`)).status, 404);
  assert.strictEqual((await realFetch(`${base}/server.js`)).status, 404);
  assert.strictEqual((await realFetch(`${base}/..%2fserver.js`)).status, 404);
});

test('recusa origem de outro site e Host estranho', async () => {
  assert.strictEqual((await post('/api/config', { appId: 'abcd', appKey: 'abcdefgh' }, { Origin: 'https://malicioso.com' })).status, 403);
  const semJson = await realFetch(`${base}/api/config`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
  assert.strictEqual(semJson.status, 403);
  const hostRuim = await new Promise((resolve) => {
    require('node:http').get({ host: '127.0.0.1', port: PORTA, path: '/api/status', headers: { Host: 'evil.com' } }, (r) => resolve(r.statusCode));
  });
  assert.strictEqual(hostRuim, 403);
});

test('buscar sem chaves pede configuração', async () => {
  const r = await post('/api/buscar', { what: 'react' });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).erro, /Configure/);
});

test('valida o formato das chaves e nunca as devolve', async () => {
  assert.strictEqual((await post('/api/config', { appId: 'a', appKey: 'b' })).status, 400);
  const ok = await post('/api/config', { appId: 'abcd1234', appKey: 'chave-secreta-123' });
  assert.strictEqual(ok.status, 200);
  const status = await (await realFetch(`${base}/api/status`)).json();
  assert.deepStrictEqual(status, { configurado: true, origemEnv: false });
  assert.ok(!JSON.stringify(status).includes('chave-secreta'));
});

test('busca: extrai requisitos, filtra fora do foco e converte salário', async () => {
  simularAdzuna(respostaAdzuna);
  const r = await post('/api/buscar', { what: 'desenvolvedor react', where: 'João Pessoa', paginas: 1, maxDaysOld: 30 });
  assert.strictEqual(r.status, 200);
  const j = await r.json();
  assert.match(simularAdzuna.ultima, /\/jobs\/br\/search\/1\?/);
  assert.match(simularAdzuna.ultima, /what=desenvolvedor\+react/);
  assert.strictEqual(j.coletadas, 2);
  assert.strictEqual(j.vagas.length, 1);
  assert.strictEqual(j.descartadasForaDoFoco, 1);
  const v = j.vagas[0];
  assert.strictEqual(v.nivel, 'Pleno');
  assert.strictEqual(v.modalidade, 'Remoto');
  assert.strictEqual(v.salarioMensalMin, 6000);
  assert.strictEqual(v.salarioMensalMax, 8000);
  assert.ok(['React', 'TypeScript', 'Git', 'Inglês', 'Docker/Containers'].every((x) => v.requisitos.includes(x)));
  assert.ok(!v.trecho.includes('<b>'));
  assert.strictEqual(j.ranking[0].pct, 100);
});

test('link com esquema perigoso é descartado', async () => {
  simularAdzuna(respostaAdzuna);
  const r = await post('/api/buscar', { what: 'vendedor', somenteFoco: false });
  const j = await r.json();
  const vendedor = j.vagas.find((v) => v.titulo === 'Vendedor');
  assert.strictEqual(vendedor.url, '');
});

test('histórico guarda a busca', async () => {
  const h = await (await realFetch(`${base}/api/historico`)).json();
  assert.ok(h.length >= 2);
  assert.strictEqual(h[0].consulta.what, 'vendedor');
});

test('erros da Adzuna viram mensagens claras', async () => {
  simularAdzuna({}, 401);
  let r = await post('/api/buscar', { what: 'react' });
  assert.strictEqual(r.status, 401);
  assert.match((await r.json()).erro, /credenciais/);
  simularAdzuna({}, 429);
  r = await post('/api/buscar', { what: 'react' });
  assert.strictEqual(r.status, 429);
});

test('remover chaves desfaz a configuração', async () => {
  const r = await realFetch(`${base}/api/config`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
  assert.deepStrictEqual(await r.json(), { configurado: false });
});
