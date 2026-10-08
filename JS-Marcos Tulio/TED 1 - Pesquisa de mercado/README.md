# TED 1 - Pesquisa de mercado

Pesquisa sobre linguagens mais usadas, salários por nível e requisitos de vagas de JavaScript, Node.js e React, com um painel local que também faz **novas buscas de vagas** pela API da Adzuna.

**Para rodar:** `npm start` e abrir `http://localhost:3000`. Passo a passo completo no [TUTORIAL.md](TUTORIAL.md).

## Arquivos

| Arquivo | Função |
|---------|--------|
| `pesquisa.md` | Relatório da atividade |
| `data.json` | Dados da pesquisa (ranking, salários, 24 vagas com requisitos) |
| `index.html`, `style.css`, `script.js` | Painel com os resultados da pesquisa |
| `busca.js` | Seção "Nova busca" do painel |
| `server.js` | Servidor local (Node, sem dependências): serve o painel e a API de busca |
| `adzuna.js` | Cliente da API oficial da Adzuna |
| `extrator.js` | Extrai requisitos, nível e modalidade do texto das vagas |
| `*.test.js` | Testes automáticos (`npm test`, 18 testes, sem internet) |
| `TUTORIAL.md` | Como instalar, configurar e usar |

## Como funciona

```
Navegador (index.html)  <->  server.js (127.0.0.1:3000)  ->  API da Adzuna
                                   |
                                   +-> extrator.js (requisitos por dicionário)
                                   +-> buscas.local.json (histórico, fora do git)
```

- A pesquisa do relatório aparece direto do `data.json`.
- A "Nova busca" envia o termo ao servidor local, que consulta a Adzuna com as chaves do usuário (guardadas só no computador), extrai os requisitos e devolve o ranking.

## Sobre o LinkedIn

O LinkedIn não oferece API pública para buscar vagas. A Job Posting API é restrita a parceiros e serve para publicar, e o OAuth ("Entrar com LinkedIn") só dá acesso ao perfil de quem logou, não às vagas.

As 23 vagas do relatório foram coletadas no LinkedIn em 08/10/2026 com o MCP comunitário [stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server), que controla um navegador logado. **O acesso automatizado viola o User Agreement do LinkedIn e pode levar à restrição da conta.** A coleta foi pequena, só leitura e para fins acadêmicos. A sessão de login fica fora do repositório.

Por isso a busca interativa usa a Adzuna, que tem API oficial e plano gratuito.

## Do trabalho para um sistema em tempo real

O painel já cobre parte da ideia. O que existe e o que seria o próximo passo:

| Etapa | Hoje | Evolução |
|-------|------|----------|
| Coleta | Busca manual na Adzuna, a cada clique | Job agendado (diário) com várias consultas |
| Normalização | `extrator.js`, dicionário de termos | Dicionário + LLM para termos novos e validação |
| Armazenamento | `buscas.local.json` (últimas 20 buscas) | SQLite, depois Postgres, com deduplicação por URL |
| API | Rotas locais em `server.js` | Node/Express com cache e limite de requisições |
| Painel | Atualiza quando você busca | Atualização automática (polling ou SSE) e gráficos de tendência |

**Extras possíveis:** tendência de requisitos ao longo dos meses, alerta de vaga nova que combine com o seu perfil e comparação entre João Pessoa e remoto.

**Riscos:** termos de uso das fontes, dados pessoais de recrutadores (LGPD), duplicatas, vagas desatualizadas e o fato de a Adzuna entregar só um trecho de cada descrição.

**Roadmap sugerido:**
1. Trocar o histórico em arquivo por SQLite, com deduplicação.
2. Agendar a coleta e guardar a data de cada vaga.
3. Gráficos de tendência por requisito.
4. Alertas e fontes adicionais.
