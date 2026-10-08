const test = require('node:test');
const assert = require('node:assert');
const { extrairRequisitos, detectarNivel, detectarModalidade, analisarVaga, ranking } = require('./extrator');

test('reconhece a stack JavaScript sem confundir variações', () => {
  const r = extrairRequisitos('Experiência com ReactJS, Node.js, TypeScript e APIs RESTful. Git é obrigatório.');
  assert.deepStrictEqual(r.sort(), ['Git', 'Node.js', 'REST APIs', 'React', 'TypeScript'].sort());
});

test('node.js não vira JavaScript por causa do ".js"', () => {
  const r = extrairRequisitos('Desenvolvedor Node.js com Express');
  assert.ok(r.includes('Node.js'));
  assert.ok(!r.includes('JavaScript'));
});

test('React Native não conta como React', () => {
  const r = extrairRequisitos('Vaga para React Native');
  assert.ok(r.includes('React Native'));
  assert.ok(!r.includes('React'));
});

test('Java não é confundido com JavaScript', () => {
  const r = extrairRequisitos('Spring Boot e Java 17');
  assert.ok(r.includes('Java'));
  assert.ok(!r.includes('JavaScript'));
});

test('acentos são ignorados', () => {
  const r = extrairRequisitos('Domínio de inglês, acessibilidade e testes automatizados');
  assert.ok(['Inglês', 'Acessibilidade', 'Testes automatizados'].every((x) => r.includes(x)));
});

test('nível vem do título primeiro', () => {
  assert.strictEqual(detectarNivel('Desenvolvedor React Sênior', 'aceita júnior'), 'Sênior');
  assert.strictEqual(detectarNivel('Desenvolvedor Júnior/Pleno', ''), 'Júnior/Pleno');
  assert.strictEqual(detectarNivel('Desenvolvedor Front-end', 'perfil pleno'), 'Pleno');
  assert.strictEqual(detectarNivel('Desenvolvedor Front-end', ''), 'Não informado');
});

test('modalidade', () => {
  assert.strictEqual(detectarModalidade('Dev', 'trabalho 100% remoto', ''), 'Remoto');
  assert.strictEqual(detectarModalidade('Dev', 'modelo híbrido', 'João Pessoa'), 'Híbrido');
  assert.strictEqual(detectarModalidade('Dev', 'x', 'João Pessoa'), 'Não informado');
});

test('vaga fora do foco é sinalizada', () => {
  assert.strictEqual(analisarVaga({ titulo: 'Vendedor', descricao: 'vendas', local: '' }).noFoco, false);
  assert.strictEqual(analisarVaga({ titulo: 'Dev', descricao: 'React e Git', local: '' }).noFoco, true);
});

test('ranking conta e calcula percentual', () => {
  const r = ranking([{ requisitos: ['React', 'Git'] }, { requisitos: ['React'] }]);
  assert.deepStrictEqual(r[0], { requisito: 'React', vagas: 2, pct: 100 });
  assert.deepStrictEqual(r[1], { requisito: 'Git', vagas: 1, pct: 50 });
});
