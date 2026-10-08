# TED 1 - Pesquisa de mercado e os requisitos das vagas

**Aluno:** Múcio Miranda · **Foco:** JavaScript, Node.js e React · **Região:** João Pessoa/PB (presencial e híbrido) e home office no Brasil
**Status:** versão ampliada (23 vagas do LinkedIn, salários cruzados em 4 fontes; ranking de linguagens ainda com poucas fontes). Os dados estruturados estão em [data.json](data.json) e o dashboard em [index.html](index.html).

## Resumo executivo

- **Linguagens:** Python lidera o TIOBE de setembro/2026 (17,76%) e o PYPL. JavaScript é 6º no TIOBE (2,76%) e 3º no PYPL.
- **Salários:** as fontes divergem bastante. Para front-end, o Pleno fica entre R$ 7 mil e R$ 16 mil e o Sênior entre R$ 12 mil e R$ 18 mil, conforme a fonte. Em João Pessoa a média geral de programador é de R$ 4,2 mil.
- **Vagas:** de 23 vagas do LinkedIn, 22 são home office e 1 é híbrida em João Pessoa. React aparece em 18, REST em 17, JavaScript em 16, Git em 16 e TypeScript em 15. Node.js aparece em 11.
- **Mercado local:** em João Pessoa praticamente só existem vagas de JavaScript para quem aceita trabalhar remoto para empresas de fora.
- **Tendência:** inglês é pedido em 10 vagas, testes automatizados em 8 e ferramentas de IA no desenvolvimento em 7 (5 obrigatórias e 2 como diferencial).

## 1. Linguagens mais usadas

| # | Linguagem | TIOBE set/2026 |
|---|-----------|----------------|
| 1 | Python | 17,76% |
| 2 | C | 10,28% |
| 3 | C++ | 8,67% |
| 4 | Java | 7,54% |
| 5 | C# | 4,22% |
| 6 | JavaScript | 2,76% |
| 7 | Visual Basic | 2,55% |
| 8 | SQL | 2,16% |
| 9 | R | 1,69% |
| 10 | Rust | 1,34% |

Para comparar, o PYPL 2026 (baseado em buscas por tutoriais) coloca Python em 1º, Java em 2º e JavaScript em 3º, com Swift em 9º e Kotlin em 10º. Python lidera nos dois índices, e JavaScript sobe de posição no PYPL porque ele mede o interesse de quem está aprendendo.

**Limites desta seção**
- O TIOBE e o PYPL medem buscas e tutoriais, não uso profissional. O Stack Overflow Survey e o GitHub Octoverse seriam melhores para isso, mas as buscas por essas fontes foram bloqueadas nesta sessão e ficam pendentes.
- Os dados do TIOBE vêm da página oficial do índice. O PYPL foi lido por resumo de busca, sem abrir o site, e só tenho as posições 1, 2, 3, 9 e 10.
- Como o TIOBE soma buscas de muitas variantes, linguagens como SQL e Visual Basic ganham peso que não reflete vagas de desenvolvimento web.

## 2. Salários (R$ por mês)

### Por que há mais de uma fonte

A primeira versão usava só a Robert Half, e isso distorcia o quadro. O dado é real, vem do Guia Salarial 2026 deles, mas representa profissionais **colocados pela própria consultoria**, geralmente em empresas maiores, o que puxa os valores para cima. Por isso cruzei com outras fontes: o Salário Transparente (salários informados anonimamente por profissionais, com tamanho de amostra), o Indeed (João Pessoa) e vagas reais do Programathor.

### Front-end, Brasil (faixa P25 a P75)

| Nível | Salário Transparente | Robert Half |
|-------|----------------------|-------------|
| Júnior | 3.249 a 5.892 (mediana 4.349; 32 salários) | 6.050 a 8.750 (mediana 6.850) |
| Pleno | 7.055 a 10.768 (mediana 9.345; 66 salários) | 9.400 a 15.800 (mediana 12.300) |
| Sênior | 11.808 a 16.331 (mediana 13.500; 55 salários) | 12.450 a 18.200 (mediana 14.700) |

Leitura: a Robert Half fica sempre acima. O Júnior dela começa onde o Salário Transparente termina. Para o Júnior, a faixa mais realista é a de R$ 3,5 mil a R$ 6 mil. A diferença se reduz no Sênior, onde as duas fontes se sobrepõem entre R$ 12,5 mil e R$ 16 mil.

Outros pontos de comparação:
- Glassdoor via Trybe (React): Júnior R$ 3.280, Pleno R$ 5.556 e Sênior R$ 12.050 de mediana. A data da coleta não é informada, então serve só como referência.
- Salário Transparente informa que a amostra Júnior tem profissionais com 1 a 4 anos de experiência e a maioria em vagas remotas.

### Tech Lead

| Fonte | Faixa | Observação |
|-------|-------|------------|
| Serasa Experian | R$ 14.000 a 22.000 | Atribuída ao CAGED, fonte original não conferida |
| JobRise | R$ 18.000 a 30.000 | Estimativa de blog |
| Glassdoor | 11.000 a 22.579 (P25 a P75; P90 em 30.097) | 146 salários; a página diz "anual", mas os valores são compatíveis com mensais, então não usei no dashboard |

Não há amostra grande e confiável para Tech Lead. O intervalo de R$ 14 mil a R$ 30 mil resume as fontes, e vale tratar como estimativa.

### João Pessoa e Nordeste

- **Indeed:** média de R$ 4.170 por mês para Programador e Desenvolvedor em João Pessoa (faixa de R$ 2.173 a R$ 7.999), 28% abaixo da média nacional. A amostra é de apenas 7 salários, de agosto de 2025.
- **Vaga real (Programathor):** Desenvolvedor Front-end Pleno presencial em João Pessoa (HTML, CSS, JavaScript), PJ, até R$ 6.000.
- **Nordeste:** egressos da Trybe no Nordeste tinham mediana de R$ 4.232 (dado de 2020/2021, antigo).
- Quem trabalha remoto para empresas de fora tende a receber valores do mercado nacional. Várias vagas remotas pagam em dólar.

### Por tecnologia (Sênior, Trybe)

JavaScript R$ 9.840, React R$ 12.050 e Node.js R$ 9.334 de mediana.

## 3. Requisitos das vagas

### Metodologia

Coleta em 06/10/2026 no LinkedIn, via MCP, com oito buscas: "desenvolvedor react", "node.js javascript", "front-end" e "full stack" em João Pessoa; e "react", "node.js", "javascript" e "react node.js pleno" (filtro de nível médio-sênior) em home office no Brasil. Os resultados vieram misturados com vagas de design e de outras áreas, então só entraram as de desenvolvimento com JavaScript, Node.js ou React. Cada vaga foi aberta, os requisitos foram normalizados (ReactJS e React.js viram React) e a contagem foi feita por script a partir do [data.json](data.json).

Foram analisadas **23 vagas do LinkedIn**. Uma vaga local do Programathor entra à parte, só para salário. A Dock (João Pessoa, híbrido) foi descartada: é uma vaga de Java com Spring Boot.

### Panorama da amostra

| Nível | Vagas |
|-------|-------|
| Sênior | 8 |
| Júnior | 5 |
| Pleno | 5 |
| Júnior/Pleno | 1 |
| Pleno/Sênior | 1 |
| Não informado | 3 |

Modalidade: 22 remotas e 1 híbrida em João Pessoa (Smartspace, nível Júnior). Experiência pedida: cerca de 1 ano no Júnior, 3 a 4+ anos no Pleno e 5+ anos no Sênior (7+ na Telit Cinterion).

### Requisitos obrigatórios mais pedidos

| Requisito | Vagas (de 23) | Observação |
|-----------|---------------|------------|
| React | 18 | Em algumas aparece como opção ao lado de Angular e Vue |
| APIs REST | 17 | |
| JavaScript | 16 | |
| Git | 16 | |
| TypeScript | 15 | Presente em todos os níveis |
| Node.js | 11 | Mais comum em vagas full stack |
| HTML/CSS | 11 | |
| Inglês | 10 | 5 em 8 vagas Sênior e 2 em 5 Júnior |
| Bancos de dados | 8 | PostgreSQL, MongoDB, MySQL |
| Testes automatizados | 8 | |
| Angular | 7 | |
| Ensino superior | 5 | Quase só Júnior |
| Ferramentas de IA no desenvolvimento | 5 | Obrigatório em ecoPortal, i4Pro, Zallpy, Beta Online e Interfell |
| CI/CD | 5 | |
| Next.js | 4 | |
| Vue.js | 4 | |
| Gerenciamento de estado | 4 | Redux ou Context API |
| Docker/Containers | 4 | |

Aparecem em 1 a 3 vagas: acessibilidade, build tools (Webpack, Vite), Linux, metodologias ágeis, performance, algoritmos e estruturas de dados, cloud AWS, observabilidade, GraphQL, micro frontends, Tailwind CSS, Firebase, mensageria e .NET/C#.

### Contando também os diferenciais

Somando obrigatório e desejável, aparecem: **Docker (10 vagas), cloud AWS/GCP/Azure (10), testes automatizados (10), CI/CD (9) e ferramentas de IA (7)**. Docker e cloud são citados mais como diferencial do que como exigência, mas aparecem em quase metade das vagas.

### Por nível

- **Júnior (5 vagas):** JavaScript em todas, Git em 4, e TypeScript, React, HTML/CSS e ensino superior em 3. Pedem fundamentos (algoritmos, estruturas de dados, REST) e 1 ano de experiência.
- **Pleno (5 vagas):** React, JavaScript, TypeScript e REST em 4, e bancos de dados em 3. Surgem Next.js, metodologias ágeis e ferramentas de IA. Pedem 3 a 4+ anos.
- **Sênior (8 vagas):** REST em 7, React em 6, e TypeScript, Git, inglês, Node.js e CI/CD em 5. Testes automatizados e bancos de dados aparecem em 4. É o nível com mais ênfase em arquitetura, mentoria, performance e inglês avançado.
- **Sem nível informado (3 vagas):** descrições genéricas de empresas de recrutamento, com "React ou Vue ou Angular".

### Salário nas vagas

Quase nenhuma vaga divulga valor. As que divulgam: Canonical (USD 48 a 70 mil por ano para candidatos nos EUA, nível de entrada), Interfell (USD 2.000 a 2.100 por mês, contractor para a América Latina) e a vaga local do Programathor (até R$ 6.000, PJ). Várias oferecem pagamento "em dólar ou moeda local" sem informar o valor. Duas das vagas são PJ (SendFlow e Verx) e uma é contractor.

### O que isso indica para quem estuda

1. **Base obrigatória:** JavaScript moderno, TypeScript, React, REST, Git e HTML/CSS cobrem a maior parte das vagas.
2. **Para ir além do Júnior:** Node.js com banco de dados (PostgreSQL ou MongoDB), testes automatizados e inglês.
3. **Diferenciais que já aparecem:** Docker, noções de cloud e CI/CD, e uso de ferramentas de IA no dia a dia.

## 4. Limitações
- Amostra de 23 vagas em um único dia, então os percentuais são indicativos e não representam o mercado todo.
- Em João Pessoa só foi encontrada 1 vaga de JavaScript no LinkedIn (híbrida, nível Júnior) e 1 no Programathor (presencial, Pleno). Isso não permite estatística local, e o corpo da amostra é home office.
- Parte das vagas remotas vem de empresas de recrutamento e outsourcing (BairesDev, INDI, Hired, Hire Feed, Interfell), com descrições genéricas. Isso pode inflar o peso de "React ou Angular ou Vue".
- Os resultados do LinkedIn são ordenados pelo próprio site (muitas vagas "promovidas"), e a amostra não é aleatória.
- Salários vêm de guias e de bases de usuários, não de dados oficiais. A Robert Half tende a ficar acima do restante, e o Salário Transparente depende de contribuições voluntárias. A amostra de João Pessoa no Indeed tem só 7 salários.
- O LinkedIn não tem API pública de busca de vagas, e a coleta automatizada contraria o User Agreement da plataforma. Detalhes no [README](README.md).

## 5. Fontes
- [TIOBE Index, set/2026 (site oficial)](https://www.tiobe.com/tiobe-index/)
- [PYPL 2026, resumo (Open Source For You)](https://www.opensourceforu.com/2026/04/revisiting-popular-programming-languages-the-2026-edition/)
- [Guia Salarial 2026 Front-End Pleno (Robert Half)](https://www.roberthalf.com/br/pt/vagas-detalhes/desenvolvedora-front-end-pleno)
- [Salário Transparente, Front-end Júnior](https://salariotransparente.com.br/salarios/desenvolvedor-front-end/junior)
- [Salário Transparente, Front-end Pleno](https://salariotransparente.com.br/salarios/desenvolvedor-front-end/pleno)
- [Salário Transparente, Front-end Sênior](https://salariotransparente.com.br/salarios/desenvolvedor-front-end/senior)
- [Indeed, salário de programador em João Pessoa](https://br.indeed.com/career/programador-&-desenvolvedor/salaries/Jo%C3%A3o-Pessoa--PB)
- [Vagas em João Pessoa (Programathor)](https://programathor.com.br/jobs-city/joao-pessoa)
- [Salário Dev React (Trybe)](https://www.betrybe.com/guia-salarios-profissoes/desenvolvedor-react)
- [Salário Dev JavaScript (Trybe)](https://www.betrybe.com/guia-salarios-profissoes/desenvolvedor-javascript)
- [Salário Node.js (Programathor)](https://programathor.com.br/salario-programador-node-js)
- [Tech Lead (Serasa Experian)](https://www.serasaexperian.com.br/carreiras/blog-carreiras/tech-lead/)
- [Salário de desenvolvedor 2026 (JobRise)](https://jobrise.io/pt/blog/quanto-ganha-um-desenvolvedor-no-brasil-2026/)
