// Extrai requisitos, nível e modalidade a partir do texto de uma vaga.
// Sem dependências e sem IA: usa um dicionário de termos, os mesmos rótulos do data.json.

const TERMOS = [
  ['JavaScript', /\bjavascript\b|\bes6\b|(?<![.\w])js(?![\w])/],
  ['TypeScript', /\btypescript\b/],
  ['React', /\breact(?:\.?js)?\b(?!\s*native)/],
  ['React Native', /\breact\s*native\b/],
  ['Next.js', /\bnext\.?js\b/],
  ['Node.js', /\bnode(?:\.?js)?\b/],
  ['Express', /\bexpress(?:\.?js)?\b/],
  ['Vue.js', /\bvue(?:\.?js)?\b/],
  ['Angular', /\bangular(?:js)?\b/],
  ['HTML/CSS', /\bhtml5?\b|\bcss3?\b|\bsass\b|\bscss\b/],
  ['Tailwind CSS', /\btailwind/],
  ['REST APIs', /\brest(?:ful)?\b|\bapis?\s+rest/],
  ['GraphQL', /\bgraphql\b/],
  ['Git', /\bgit(?:hub|lab)?\b/],
  ['Bancos de dados', /\bsql\b|\bpostgres(?:ql)?\b|\bmysql\b|\bmongodb\b|\bnosql\b|\boracle\b|\bdynamodb\b|\bbancos? de dados\b/],
  ['Testes automatizados', /\bjest\b|\bcypress\b|\bplaywright\b|\bvitest\b|\bmocha\b|\btdd\b|\btestes? (?:automatizados?|unitarios?|de integracao|e2e)\b|\bunit tests?\b|\btesting library\b/],
  ['Docker/Containers', /\bdocker\b|\bcontainers?\b|\bkubernetes\b|\bk8s\b/],
  ['CI/CD', /\bci\s*\/\s*cd\b|\bci cd\b|\bjenkins\b|\bgithub actions\b|\bpipelines?\b/],
  ['Cloud (AWS/GCP/Azure)', /\baws\b|\bazure\b|\bgcp\b|\bgoogle cloud\b|\bcloud\b|\blambda\b/],
  ['Metodologias ágeis', /\bscrum\b|\bkanban\b|\bagil\b|\bagile\b/],
  ['Gerenciamento de estado', /\bredux\b|\bcontext api\b|\bzustand\b|\bgerenciamento de estado\b|\bstate management\b/],
  ['Build tools', /\bwebpack\b|\bvite\b|\bbabel\b|\brollup\b/],
  ['Micro frontends', /\bmicro[\s-]?front/],
  ['Ferramentas de IA', /\bcopilot\b|\bcursor\b|\bclaude\b|\bchatgpt\b|\bllms?\b|\binteligencia artificial\b|\bia generativa\b|\bgenerative ai\b|\bai[\s-]assisted\b/],
  ['Inglês', /\bingles\b|\benglish\b/],
  ['Acessibilidade', /\bacessibilidade\b|\ba11y\b|\bwcag\b|\baccessibility\b/],
  ['Performance', /\bperformance\b|\bdesempenho\b/],
  ['Linux', /\blinux\b/],
  ['Algoritmos e estruturas de dados', /\balgoritmos?\b|\bestruturas? de dados\b|\bdata structures\b/],
  ['Ensino superior', /\bensino superior\b|\bgraduacao\b|\bbacharel/],
  ['Firebase', /\bfirebase\b/],
  ['Java', /\bjava\b(?!\s*script)/],
  ['Python', /\bpython\b/],
  ['.NET/C#', /\.net\b|\bdotnet\b|\bc#/],
  ['PHP', /\bphp\b/],
];

// Vaga só entra na análise se citar ao menos uma destas tecnologias do foco do trabalho.
const FOCO = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Next.js', 'Vue.js', 'Angular'];

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function extrairRequisitos(texto) {
  const t = normalizar(texto);
  return TERMOS.filter(([, rx]) => rx.test(t)).map(([rotulo]) => rotulo);
}

function detectarNivel(titulo, descricao) {
  const olhar = (txt) => {
    const t = normalizar(txt);
    const achou = [];
    if (/\bestagi/.test(t)) achou.push('Estágio');
    if (/\bjunior\b|\bjr\b|\bjunior\/|\bentry[\s-]level\b/.test(t)) achou.push('Júnior');
    if (/\bpleno\b|\bpl\b|\bmid[\s-]?level\b/.test(t)) achou.push('Pleno');
    if (/\bsenior\b|\bsr\b/.test(t)) achou.push('Sênior');
    if (/\btech lead\b|\blead\b|\bespecialista\b|\bstaff\b|\bprincipal\b/.test(t)) achou.push('Lead/Especialista');
    return achou;
  };
  // O título manda; a descrição só decide se o título não disser nada.
  const doTitulo = olhar(titulo);
  const niveis = doTitulo.length ? doTitulo : olhar(descricao).slice(0, 1);
  if (!niveis.length) return 'Não informado';
  return niveis.join('/');
}

function detectarModalidade(...textos) {
  const t = normalizar(textos.join(' '));
  if (/\bremot[oa]\b|\bremote\b|home office|work from home|anywhere/.test(t)) return 'Remoto';
  if (/\bhibrid[oa]\b|\bhybrid\b/.test(t)) return 'Híbrido';
  if (/\bpresencial\b|\bon[\s-]?site\b/.test(t)) return 'Presencial';
  return 'Não informado';
}

function analisarVaga({ titulo, descricao, local }) {
  const requisitos = extrairRequisitos(`${titulo} ${descricao}`);
  return {
    requisitos,
    nivel: detectarNivel(titulo, descricao),
    modalidade: detectarModalidade(titulo, descricao, local),
    noFoco: requisitos.some((r) => FOCO.includes(r)),
  };
}

function ranking(vagas, limite = 15) {
  const contagem = {};
  vagas.forEach((v) => v.requisitos.forEach((r) => { contagem[r] = (contagem[r] || 0) + 1; }));
  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limite)
    .map(([requisito, vagasCom]) => ({
      requisito,
      vagas: vagasCom,
      pct: vagas.length ? Math.round((vagasCom / vagas.length) * 100) : 0,
    }));
}

module.exports = { TERMOS, FOCO, normalizar, extrairRequisitos, detectarNivel, detectarModalidade, analisarVaga, ranking };
