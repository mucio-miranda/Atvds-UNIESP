// Cliente mínimo da API oficial da Adzuna (https://developer.adzuna.com).
// Observação: a Adzuna devolve só um trecho (snippet) da descrição de cada vaga,
// então os requisitos extraídos são um recorte do que a vaga completa pede.

const BASE = 'https://api.adzuna.com/v1/api/jobs';

class ErroAdzuna extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

function montarUrl({ appId, appKey }, { pais = 'br', pagina = 1, what, where, maxDaysOld, sortBy, porPagina = 50 }) {
  const url = new URL(`${BASE}/${pais}/search/${pagina}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', String(porPagina));
  url.searchParams.set('content-type', 'application/json');
  if (what) url.searchParams.set('what', what);
  if (where) url.searchParams.set('where', where);
  if (maxDaysOld) url.searchParams.set('max_days_old', String(maxDaysOld));
  if (sortBy) url.searchParams.set('sort_by', sortBy);
  return url;
}

function normalizarVaga(r) {
  return {
    id: String(r.id),
    titulo: r.title ? String(r.title).replace(/<[^>]+>/g, '') : '',
    empresa: (r.company && r.company.display_name) || 'Não informada',
    local: (r.location && r.location.display_name) || '',
    descricao: r.description ? String(r.description).replace(/<[^>]+>/g, '') : '',
    url: r.redirect_url || '',
    criadaEm: r.created || '',
    contrato: [r.contract_time, r.contract_type].filter(Boolean).join(' / '),
    // A Adzuna informa valores anuais; convertemos para mensal só para exibir.
    salarioMensalMin: r.salary_min ? Math.round(r.salary_min / 12) : null,
    salarioMensalMax: r.salary_max ? Math.round(r.salary_max / 12) : null,
    salarioEstimado: Boolean(r.salary_is_predicted && String(r.salary_is_predicted) !== '0'),
  };
}

async function buscarPagina(config, params, fetchImpl = fetch) {
  const url = montarUrl(config, params);
  let resp;
  try {
    resp = await fetchImpl(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new ErroAdzuna('Não foi possível falar com a Adzuna (sem internet ou tempo esgotado).', 502);
  }
  if (resp.status === 401 || resp.status === 403) {
    throw new ErroAdzuna('A Adzuna recusou as credenciais. Confira o app_id e o app_key.', 401);
  }
  if (resp.status === 429) {
    throw new ErroAdzuna('Limite de chamadas da Adzuna atingido (plano gratuito). Tente de novo em alguns minutos.', 429);
  }
  if (!resp.ok) {
    throw new ErroAdzuna(`A Adzuna respondeu com erro ${resp.status}.`, 502);
  }
  const corpo = await resp.json();
  return { total: corpo.count || 0, vagas: (corpo.results || []).map(normalizarVaga) };
}

async function buscar(config, params, paginas = 1, fetchImpl = fetch) {
  const vagas = [];
  let total = 0;
  for (let p = 1; p <= paginas; p += 1) {
    const r = await buscarPagina(config, { ...params, pagina: p }, fetchImpl);
    total = r.total;
    vagas.push(...r.vagas);
    if (r.vagas.length < (params.porPagina || 50)) break;
  }
  return { total, vagas };
}

module.exports = { ErroAdzuna, montarUrl, normalizarVaga, buscarPagina, buscar };
