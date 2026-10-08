// Seção "Nova busca": fala com o servidor local (server.js). Depende de $ e el definidos em script.js.

let buscas = [];

async function api(caminho, opcoes = {}) {
  const resp = await fetch(caminho, {
    ...opcoes,
    headers: opcoes.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.erro || `Erro ${resp.status}`);
  return corpo;
}

function aviso(texto, ruim = false) {
  const p = $('busca-aviso');
  p.textContent = texto;
  p.className = ruim ? 'erro' : 'vazio';
}

function mostrarConfig(configurado) {
  $('config-box').hidden = configurado;
  $('form-busca').hidden = !configurado;
  $('limpar-config').hidden = !configurado;
}

function renderRankingBusca(rank) {
  const box = $('busca-ranking');
  if (!rank.length) return box.replaceChildren(el('p', 'vazio', 'Nenhum requisito encontrado nos trechos das vagas.'));
  box.replaceChildren(el('h3', null, 'Requisitos mais citados'), ...rank.map((r) => {
    const linha = el('div', 'barra');
    linha.append(el('span', null, r.requisito));
    const trilho = el('div', 'trilho');
    const barra = el('div', 'preenche');
    barra.style.width = `${r.pct}%`;
    trilho.append(barra);
    linha.append(trilho, el('small', null, `${r.vagas} (${r.pct}%)`));
    return linha;
  }));
}

function faixaSalario(v) {
  if (!v.salarioMensalMin && !v.salarioMensalMax) return '';
  const partes = [v.salarioMensalMin, v.salarioMensalMax].filter(Boolean).map(moeda);
  return `${partes.join(' a ')}/mês${v.salarioEstimado ? ' (estimado pela Adzuna)' : ''}`;
}

function renderListaBusca(vagas) {
  const box = $('busca-lista');
  if (!vagas.length) return box.replaceChildren(el('p', 'vazio', 'Nenhuma vaga para mostrar.'));
  box.replaceChildren(el('h3', null, 'Vagas encontradas'), ...vagas.map((v) => {
    const d = el('div', 'vaga');
    const titulo = el('strong', null, `${v.titulo} - ${v.empresa}`);
    d.append(titulo);
    d.append(el('div', null, [v.nivel, v.modalidade, v.local, faixaSalario(v)].filter(Boolean).join(' · ')));
    const tags = el('div', 'tags');
    v.requisitos.forEach((r) => tags.append(el('span', null, r)));
    d.append(tags);
    if (v.url) {
      const a = el('a', null, 'Ver vaga na origem');
      a.href = v.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      d.append(a);
    }
    return d;
  }));
}

function renderBusca(r) {
  const c = r.consulta;
  const partes = [
    `"${c.what}"${c.where ? ` em ${c.where}` : ' no Brasil'}`,
    `${r.totalNaAdzuna} resultados na Adzuna`,
    `${r.coletadas} lidos`,
    `${r.vagas.length} mostrados`,
  ];
  if (r.descartadasForaDoFoco) partes.push(`${r.descartadasForaDoFoco} fora de JavaScript/React/Node`);
  $('busca-resumo').textContent = partes.join(' · ');
  renderRankingBusca(r.ranking);
  renderListaBusca(r.vagas);
}

async function carregarHistorico() {
  buscas = await api('/api/historico');
  const sel = $('historico');
  sel.replaceChildren(new Option(buscas.length ? 'Buscas anteriores...' : 'Sem buscas anteriores', ''));
  buscas.forEach((b, i) => {
    const quando = new Date(b.feitaEm).toLocaleString('pt-BR');
    sel.add(new Option(`${quando} - ${b.consulta.what}${b.consulta.where ? ` (${b.consulta.where})` : ''}`, String(i)));
  });
}

async function buscar(evento) {
  evento.preventDefault();
  const botao = $('btn-buscar');
  botao.disabled = true;
  aviso('Buscando...');
  try {
    const r = await api('/api/buscar', {
      method: 'POST',
      body: JSON.stringify({
        what: $('q-what').value,
        where: $('q-where').value,
        maxDaysOld: Number($('q-dias').value),
        paginas: Number($('q-paginas').value),
        somenteFoco: $('q-foco').checked,
      }),
    });
    aviso('');
    renderBusca(r);
    await carregarHistorico();
  } catch (e) {
    aviso(e.message, true);
  } finally {
    botao.disabled = false;
  }
}

async function salvarConfig(evento) {
  evento.preventDefault();
  try {
    await api('/api/config', {
      method: 'POST',
      body: JSON.stringify({ appId: $('cfg-id').value.trim(), appKey: $('cfg-key').value.trim() }),
    });
    $('cfg-key').value = '';
    aviso('Chaves salvas neste computador.');
    mostrarConfig(true);
  } catch (e) {
    aviso(e.message, true);
  }
}

async function removerConfig() {
  await api('/api/config', { method: 'DELETE' });
  aviso('Chaves removidas.');
  mostrarConfig(false);
}

async function iniciarBusca() {
  if (location.protocol === 'file:') {
    aviso('Para usar a busca, rode "npm start" na pasta do projeto e abra http://localhost:3000. Veja o TUTORIAL.md.', true);
    return;
  }
  try {
    const status = await api('/api/status');
    mostrarConfig(status.configurado);
    $('form-busca').addEventListener('submit', buscar);
    $('form-config').addEventListener('submit', salvarConfig);
    $('limpar-config').addEventListener('click', removerConfig);
    $('historico').addEventListener('change', (e) => {
      if (e.target.value !== '') renderBusca(buscas[Number(e.target.value)]);
    });
    await carregarHistorico();
  } catch {
    aviso('O servidor local não respondeu. Rode "npm start" e abra http://localhost:3000.', true);
  }
}

iniciarBusca();
