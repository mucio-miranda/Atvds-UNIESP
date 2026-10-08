# Tutorial: rodar o sistema no seu computador

Este projeto mostra a pesquisa de mercado em uma página no navegador e permite fazer **novas buscas de vagas** pela API oficial da Adzuna. Tudo roda localmente: não há conta, banco de dados nem serviço na nuvem além da própria Adzuna.

## O que você vai precisar

| Item | Para quê | Como conseguir |
|------|----------|----------------|
| Node.js 18 ou mais novo | Rodar o servidor local | [nodejs.org](https://nodejs.org) (versão LTS) |
| Navegador | Ver o painel | Qualquer um (Chrome, Edge, Firefox) |
| Chaves da Adzuna (grátis) | Só para a "Nova busca" | Passo 3 abaixo |

Não é preciso rodar `npm install`: o projeto não tem dependências.

Para conferir o Node, abra um terminal e rode:

```
node --version
```

Se aparecer `v18` ou maior, está tudo certo.

## Passo 1: baixar o projeto

Baixe ou clone o repositório e entre na pasta do TED 1:

```
cd "JS-Marcos Tulio/TED 1 - Pesquisa de mercado"
```

## Passo 2: iniciar o sistema

```
npm start
```

Deve aparecer:

```
Sistema rodando em http://localhost:3000
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. Você verá:

- o ranking das 10 linguagens mais usadas;
- os salários por nível, com mais de uma fonte;
- os requisitos mais pedidos, com filtros por tecnologia e nível;
- a lista das vagas coletadas;
- a seção **Nova busca**.

Para encerrar, volte ao terminal e pressione `Ctrl+C`.

> **Por que não abrir o `index.html` com duplo clique?** O navegador bloqueia a leitura do `data.json` em arquivos abertos direto do disco. Com o servidor local isso funciona. Se você abrir assim mesmo, a página avisa o que fazer.

## Passo 3: criar as chaves da Adzuna (só para a Nova busca)

A Adzuna é um agregador de vagas com API oficial e plano gratuito.

1. Acesse [developer.adzuna.com](https://developer.adzuna.com/) e crie uma conta.
2. Registre uma aplicação para receber o **app_id** e o **app_key**.
3. No painel, na seção **Nova busca**, cole as duas chaves e clique em **Salvar chaves**.

Onde ficam as chaves:

- Elas são gravadas no arquivo `config.local.json`, só no seu computador.
- Esse arquivo está no `.gitignore`, então não vai para o GitHub. **Nunca publique suas chaves.**
- O navegador nunca recebe as chaves de volta; só o servidor local as usa.
- Alternativa: defina as variáveis de ambiente `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` antes do `npm start`. Elas têm prioridade sobre o arquivo.

O plano gratuito permite cerca de 25 chamadas por minuto e 250 por dia. Cada página de resultados é uma chamada, e o sistema limita a busca a 3 páginas.

## Passo 4: fazer uma nova busca

Na seção **Nova busca**, preencha:

| Campo | Exemplo | Observação |
|-------|---------|------------|
| O que buscar | `desenvolvedor react` | Funciona com `node.js`, `javascript`, `front-end`... |
| Onde | `João Pessoa` | Deixe vazio para buscar no Brasil inteiro |
| Publicadas nos últimos | 30 dias | Vagas mais recentes têm menos chance de estar encerradas |
| Páginas | 1 | Cada página traz até 50 vagas |
| Só JavaScript, React ou Node | marcado | Descarta vagas de outras áreas que apareceram na busca |

Clique em **Buscar**. O sistema mostra:

1. um resumo (quantas vagas a Adzuna encontrou, quantas foram lidas e quantas ficaram);
2. o **ranking de requisitos** dessas vagas, em barras com a porcentagem;
3. a lista de vagas, com nível, modalidade, faixa de salário (quando existe) e um link para a vaga original.

As buscas ficam guardadas em `buscas.local.json` (também no `.gitignore`) e podem ser reabertas pelo menu **Buscas anteriores**.

## Como os requisitos são extraídos

Não há inteligência artificial nem custo extra. O arquivo `extrator.js` tem um dicionário de termos (React, Node.js, TypeScript, Docker, inglês etc.) e procura cada um no texto da vaga, ignorando acentos e variações como `ReactJS` e `React.js`. O nível (Júnior, Pleno, Sênior) vem do título da vaga, e a modalidade vem de palavras como "remoto" e "híbrido".

## Limitações importantes

- **Trecho, não a vaga inteira.** A Adzuna entrega só um trecho da descrição de cada vaga. Requisitos que aparecem no fim do texto podem não ser detectados, então os percentuais da Nova busca tendem a ser menores que os da pesquisa feita com as vagas completas.
- **Não é o LinkedIn.** O LinkedIn não tem API pública de busca de vagas, e o OAuth deles só dá acesso ao perfil de quem logou. Por isso a busca usa a Adzuna. As 23 vagas do relatório vieram do LinkedIn e já estão no painel.
- **Salários são estimativas.** A Adzuna informa valores anuais, que o painel divide por 12. Quando o valor é uma previsão da própria Adzuna, a tela avisa.
- **Remoto não é filtro.** A Adzuna não filtra por modalidade; o sistema deduz pelo texto. Pode errar quando a vaga não menciona.
- **Dicionário fixo.** Tecnologias que não estão em `extrator.js` não são contadas. Para incluir uma, adicione uma linha na lista `TERMOS`.
- **A integração com a Adzuna foi testada com respostas simuladas.** Os testes automáticos cobrem o formato esperado, mas, se a Adzuna mudar algo, os campos podem divergir.

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `node` não é reconhecido | Node não instalado | Instale a versão LTS e reabra o terminal |
| Página sem dados e com aviso | Aberta com duplo clique | Use `npm start` e acesse `http://localhost:3000` |
| `EADDRINUSE` ao iniciar | Porta 3000 em uso | Use outra: `PORT=3001 npm start` (Mac/Linux) ou `$env:PORT=3001; npm start` (PowerShell) |
| "A Adzuna recusou as credenciais" | app_id ou app_key errados | Clique em **Remover chaves** e cadastre de novo |
| "Limite de chamadas atingido" | Passou de 25/min ou 250/dia | Espere alguns minutos ou volte amanhã |
| Poucas vagas na busca | Termo muito específico ou local pequeno | Busque no Brasil (campo Onde vazio) e use termos mais amplos |

## Rodar os testes

```
npm test
```

São 18 testes: extração de requisitos, regras de segurança do servidor e tratamento de erros da Adzuna, todos sem usar a internet.

## Segurança em resumo

- O servidor só aceita conexões do próprio computador (`127.0.0.1`).
- Ele recusa requisições vindas de outros sites e com `Host` diferente de `localhost`.
- Só os arquivos do painel são servidos; `config.local.json` e `buscas.local.json` não são acessíveis pelo navegador.
- O texto das vagas entra na página como texto puro, nunca como HTML, e links só abrem se forem `http` ou `https`.
