# TED 1 - Pesquisa de mercado e os requisitos das vagas

## O trabalho entregue

O que a atividade pediu está em dois arquivos:

| Arquivo | O que é |
|---------|---------|
| [`pesquisa.md`](pesquisa.md) | O relatório completo da pesquisa |
| [`TED1-pesquisa-de-mercado.pdf`](TED1-pesquisa-de-mercado.pdf) | A versão em PDF, para entrega |

A atividade pedia três coisas, e cada uma tem sua seção no relatório:

| O que foi pedido | Onde está no `pesquisa.md` |
|------------------|----------------------------|
| As 10 linguagens de programação mais usadas | Seção 1: ranking do TIOBE (set/2026), comparado com o PYPL |
| Salários de Júnior, Pleno, Sênior e Tech Lead | Seção 2: faixas cruzadas em 4 fontes, com dados de João Pessoa |
| Requisitos das vagas de JavaScript, Node.js e React no LinkedIn | Seção 3: 23 vagas do LinkedIn analisadas, com requisitos por nível |

Resumo do que a pesquisa encontrou:
- Python lidera os rankings de linguagens, e JavaScript é 6º no TIOBE e 3º no PYPL.
- Os salários variam muito entre as fontes, e o relatório explica o porquê (por exemplo, o viés do guia da Robert Half).
- Nas 23 vagas, React aparece em 18, APIs REST em 17, JavaScript e Git em 16, TypeScript em 15 e Node.js em 11. Inglês, testes automatizados e uso de ferramentas de IA crescem a partir do nível Pleno.
- Em João Pessoa existe praticamente uma vaga de JavaScript por vez; o grosso das oportunidades é home office.

As limitações (amostra de um dia, vagas de recrutadoras, salários estimados) estão na seção 4 do relatório.

---

## Uma ideia em andamento: do relatório a um sistema vivo

Um relatório é uma foto de um dia. A pergunta que me ocorreu foi: **e se essa pesquisa pudesse ser refeita sempre que eu quisesse, por qualquer pessoa, no próprio computador?**

Daí nasceu um protótipo que vai além do que a atividade pediu. Ele é um salto criativo a partir da pesquisa original, ainda em construção, e não faz parte do que está sendo avaliado.

### O que já existe

Um painel que roda localmente e faz duas coisas:

1. **Mostra os resultados da pesquisa** no navegador, com gráficos de barras, filtros por tecnologia e nível, e a lista das vagas.
2. **Faz novas buscas de vagas** pela API oficial da Adzuna e extrai os requisitos automaticamente, gerando um novo ranking.

Para experimentar: `npm start` e abrir `http://localhost:3000`. O passo a passo está no [TUTORIAL.md](TUTORIAL.md), e não precisa instalar nenhuma dependência, só ter o Node.js.

### Como funciona

```
Navegador (index.html)  <->  server.js (127.0.0.1:3000)  ->  API da Adzuna
                                   |
                                   +-> extrator.js (requisitos por dicionário)
                                   +-> buscas.local.json (histórico, fora do git)
```

| Arquivo | Função |
|---------|--------|
| `data.json` | Dados da pesquisa: ranking, salários e as vagas com requisitos |
| `index.html`, `style.css`, `script.js` | Painel com os resultados |
| `busca.js` | Seção "Nova busca" |
| `server.js` | Servidor local (Node, sem dependências) |
| `adzuna.js` | Cliente da API da Adzuna |
| `extrator.js` | Lê o texto da vaga e identifica requisitos, nível e modalidade |
| `*.test.js` | 18 testes automáticos (`npm test`), sem internet |

### Em que pé está

| Parte | Situação |
|-------|----------|
| Painel com os resultados da pesquisa | Funcionando |
| Extração de requisitos | Funcionando e testada, mas é um dicionário fixo de termos |
| Servidor local e regras de segurança | Funcionando e testado |
| Busca na Adzuna | Escrita e testada com respostas simuladas. **Ainda não foi testada com uma chave real** |
| Limitação conhecida | A Adzuna entrega só um trecho de cada descrição, então a nova busca enxerga menos requisitos que a pesquisa feita com vagas completas |

### Por que a Adzuna e não o LinkedIn

A pesquisa usou o LinkedIn, mas o LinkedIn não oferece API pública para buscar vagas. A Job Posting API é restrita a parceiros e serve para publicar, e o OAuth ("Entrar com LinkedIn") só dá acesso ao perfil de quem logou.

As 23 vagas do relatório foram coletadas com o MCP comunitário [stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server), que controla um navegador logado. **Esse tipo de acesso automatizado viola o User Agreement do LinkedIn e pode levar à restrição da conta.** A coleta foi pequena, só leitura e para fins acadêmicos, e a sessão de login fica fora do repositório. Por isso o painel, pensado para qualquer pessoa usar, depende de uma fonte com API oficial.

### Para onde isso pode ir

| Etapa | Hoje | Próximo passo |
|-------|------|---------------|
| Coleta | Busca manual, a cada clique | Coleta agendada (diária) com várias consultas |
| Normalização | Dicionário de termos | Dicionário somado a um LLM, para termos novos |
| Armazenamento | Últimas 20 buscas em arquivo | SQLite, depois Postgres, com deduplicação por URL |
| API | Rotas locais | Express com cache e limite de requisições |
| Painel | Atualiza quando você busca | Atualização automática e gráficos de tendência |

Ideias que vêm depois: acompanhar como os requisitos mudam ao longo dos meses, receber alerta de vaga nova que combine com o seu perfil e comparar João Pessoa com o mercado remoto.

Riscos que precisam ser tratados no caminho: termos de uso das fontes, dados pessoais de recrutadores (LGPD), vagas duplicadas ou desatualizadas e a limitação do trecho de descrição.

Roadmap sugerido:
1. Trocar o histórico em arquivo por SQLite, com deduplicação.
2. Agendar a coleta e guardar a data de cada vaga.
3. Gráficos de tendência por requisito.
4. Alertas e novas fontes.
