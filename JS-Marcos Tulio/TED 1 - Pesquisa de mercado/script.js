const moeda = (v) => v == null ? '-' : 'R$ ' + v.toLocaleString('pt-BR');
const $ = (id) => document.getElementById(id);

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function vazio(container, msg) {
  container.replaceChildren(el('p', 'vazio', msg));
}

function renderRanking(linguagens) {
  const box = $('ranking');
  const max = Math.max(...linguagens.map((l) => l.pct || 0), 1);
  box.replaceChildren(...linguagens.map((l) => {
    const linha = el('div', 'barra' + (l.pct == null ? ' pendente' : ''));
    linha.append(el('span', null, `${l.pos}. ${l.nome}`));
    const trilho = el('div', 'trilho');
    const barra = el('div', 'preenche');
    barra.style.width = l.pct ? `${(l.pct / max) * 100}%` : '0%';
    trilho.append(barra);
    linha.append(trilho, el('small', null, l.pct ? l.pct.toFixed(2) + '%' : 'sem %'));
    return linha;
  }));
}

function renderSalarios(salarios) {
  const topo = Math.max(...salarios.map((s) => s.max));
  $('salarios').replaceChildren(...salarios.map((s) => {
    const f = el('div', 'faixa');
    const rotulo = el('div', 'rotulo');
    rotulo.append(el('strong', null, s.nivel), el('span', null, `${moeda(s.min)} a ${moeda(s.max)}`));
    const trilho = el('div', 'trilho');
    const intervalo = el('div', 'intervalo');
    intervalo.style.left = `${(s.min / topo) * 100}%`;
    intervalo.style.width = `${((s.max - s.min) / topo) * 100}%`;
    trilho.append(intervalo);
    const mediana = s.mediana ? `mediana ${moeda(s.mediana)} · ` : '';
    f.append(rotulo, trilho, el('small', null, `${mediana}${s.escopo} · ${s.fonte}`));
    return f;
  }));
}

function renderRequisitos(vagas) {
  const box = $('requisitos');
  const tech = $('f-tech').value;
  const nivel = $('f-nivel').value;
  const filtradas = vagas.filter((v) =>
    (!tech || v.tecnologias.includes(tech)) && (!nivel || v.nivel === nivel));
  if (!filtradas.length) return vazio(box, 'Sem vagas coletadas ainda (Fase 2 pendente).');

  const contagem = {};
  filtradas.forEach((v) => v.requisitos.forEach((r) => { contagem[r] = (contagem[r] || 0) + 1; }));
  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const max = ordenado[0][1];
  box.replaceChildren(...ordenado.map(([nome, n]) => {
    const linha = el('div', 'barra');
    linha.append(el('span', null, nome));
    const trilho = el('div', 'trilho');
    const barra = el('div', 'preenche');
    barra.style.width = `${(n / max) * 100}%`;
    trilho.append(barra);
    linha.append(trilho, el('small', null, `${n} vagas`));
    return linha;
  }));
}

function renderVagas(vagas) {
  const box = $('vagas');
  const q = $('busca').value.toLowerCase();
  const lista = vagas.filter((v) => JSON.stringify(v).toLowerCase().includes(q));
  if (!lista.length) return vazio(box, 'Nenhuma vaga para mostrar.');
  box.replaceChildren(...lista.map((v) => {
    const d = el('div', 'vaga');
    d.append(el('strong', null, `${v.titulo} - ${v.empresa}`));
    d.append(el('div', null, `${v.nivel} · ${v.modalidade} · ${v.cidade} · fonte: ${v.fonte}`));
    const tags = el('div', 'tags');
    v.requisitos.forEach((r) => tags.append(el('span', null, r)));
    d.append(tags);
    if (v.desejaveis && v.desejaveis.length) {
      d.append(el('small', 'vazio', 'Desejável: ' + v.desejaveis.join(', ')));
    }
    return d;
  }));
}

function preencherFiltros(vagas) {
  const unicos = (lista) => [...new Set(lista)].sort();
  unicos(vagas.flatMap((v) => v.tecnologias)).forEach((t) => $('f-tech').add(new Option(t, t)));
  unicos(vagas.map((v) => v.nivel)).forEach((n) => $('f-nivel').add(new Option(n, n)));
}

function iniciarTema() {
  let salvo = null;
  try { salvo = localStorage.getItem('tema'); } catch (e) { /* sem storage */ }
  const escuro = salvo ? salvo === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
  $('tema').addEventListener('click', () => {
    const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = novo;
    try { localStorage.setItem('tema', novo); } catch (e) { /* ignora */ }
  });
}

async function iniciar() {
  iniciarTema();
  let dados;
  try {
    const resp = await fetch('data.json');
    dados = await resp.json();
  } catch (e) {
    const aviso = 'Não foi possível carregar os dados. Rode "npm start" na pasta do projeto e abra http://localhost:3000 (veja o TUTORIAL.md).';
    ['ranking', 'salarios', 'requisitos', 'vagas'].forEach((id) => vazio($(id), aviso));
    return;
  }
  $('meta').textContent = `${dados.meta.regiao} · atualizado em ${dados.meta.atualizado_em} · ${dados.meta.status}`;
  renderRanking(dados.linguagens);
  renderSalarios(dados.salarios);
  preencherFiltros(dados.vagas);
  renderRequisitos(dados.vagas);
  renderVagas(dados.vagas);
  $('f-tech').addEventListener('change', () => renderRequisitos(dados.vagas));
  $('f-nivel').addEventListener('change', () => renderRequisitos(dados.vagas));
  $('busca').addEventListener('input', () => renderVagas(dados.vagas));
}

iniciar();
