const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");

const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elMoedas = document.getElementById("moedas");
const elVidas = document.getElementById("vidas");
const elFase = document.getElementById("fase");
const elNomeFase = document.getElementById("nomeFase");
const elObjetivo = document.getElementById("objetivo");
const elPoderBombas = document.getElementById("poderBombas");
const elPoderFogo = document.getElementById("poderFogo");
const elPoderVelocidade = document.getElementById("poderVelocidade");
const elBanner = document.getElementById("banner");
const elBannerRotulo = document.getElementById("bannerRotulo");
const elBannerTitulo = document.getElementById("bannerTitulo");
const elPontuacaoFinal = document.getElementById("pontuacaoFinal");
const elResumoFinal = document.getElementById("resumoFinal");
const elNovoRecorde = document.getElementById("novoRecorde");

const overlays = {
    inicio: document.getElementById("inicio"),
    pausa: document.getElementById("pausa"),
    gameover: document.getElementById("gameover")
};

const COLUNAS = 15;
const LINHAS = 13;
const CEL = canvas.width / COLUNAS;
const LARANJA = "#f7931a";
const DOURADO = "#ffc94d";

const CHAO = 0;
const PAREDE = 1;
const CAIXA = 2;
const COFRE = 3;

const DIRECOES = {
    cima: { x: 0, y: -1 },
    baixo: { x: 0, y: 1 },
    esquerda: { x: -1, y: 0 },
    direita: { x: 1, y: 0 }
};

const FASES = ["Gênesis", "Halving", "Mineração", "Blockchain", "Bull Run", "Altseason", "To the Moon", "Satoshi"];
const PAVIO = 2200;
const DURACAO_FOGO = 450;

let mapa, vidaCofres, jogador, inimigos, bombas, fogos, itens, saida;
let pontos, moedas, vidas, fase, ursosDerrotados;
let maxBombas, alcance, velocidade;
let estado = "inicio";
let particulas = [];
let textos = [];
let tremor = 0;
let ultimoTempo;
let camadaMapa;
let recorde = Number(ler("bitBombRecorde")) || 0;
const teclasAtivas = [];

function ler(chave) {
    try {
        return localStorage.getItem(chave);
    } catch {
        return null;
    }
}

function salvar(chave, valor) {
    try {
        localStorage.setItem(chave, valor);
    } catch {}
}

function mostrar(nome) {
    Object.entries(overlays).forEach(([chave, el]) => el.classList.toggle("ativo", chave === nome));
}

function nomeFase() {
    return FASES[Math.min(fase - 1, FASES.length - 1)];
}

function criarEntidade(x, y) {
    return { x, y, de: { x, y }, para: { x, y }, t: 1, movendo: false, dir: DIRECOES.baixo };
}

function posicao(e) {
    return {
        x: e.de.x + (e.para.x - e.de.x) * e.t,
        y: e.de.y + (e.para.y - e.de.y) * e.t
    };
}

function celulaAtual(e) {
    return e.t < 0.5 ? e.de : e.para;
}

function iniciar() {
    pontos = 0;
    moedas = 0;
    vidas = 3;
    ursosDerrotados = 0;
    maxBombas = 1;
    alcance = 2;
    velocidade = 1;
    particulas = [];
    textos = [];
    gerarFase(1);
    mostrar(null);
}

function gerarFase(numero) {
    fase = numero;
    mapa = Array.from({ length: LINHAS }, (_, y) =>
        Array.from({ length: COLUNAS }, (_, x) => {
            if (x === 0 || y === 0 || x === COLUNAS - 1 || y === LINHAS - 1) return PAREDE;
            if (x % 2 === 0 && y % 2 === 0) return PAREDE;
            return CHAO;
        })
    );

    const zonaSegura = (x, y) => x + y <= 3;
    const densidade = Math.min(0.55 + fase * 0.03, 0.75);
    const caixas = [];

    for (let y = 1; y < LINHAS - 1; y++) {
        for (let x = 1; x < COLUNAS - 1; x++) {
            if (mapa[y][x] !== CHAO || zonaSegura(x, y)) continue;
            if (Math.random() < densidade) {
                mapa[y][x] = CAIXA;
                caixas.push({ x, y });
            }
        }
    }

    vidaCofres = new Map();
    const totalCofres = Math.min(2 + fase, 8);
    for (let i = 0; i < totalCofres && caixas.length; i++) {
        const indice = Math.floor(Math.random() * caixas.length);
        const { x, y } = caixas.splice(indice, 1)[0];
        mapa[y][x] = COFRE;
        vidaCofres.set(`${x},${y}`, 3);
    }

    const distantes = caixas.filter(c => c.x + c.y > 10);
    const escolhida = (distantes.length ? distantes : caixas)[Math.floor(Math.random() * (distantes.length || caixas.length))];
    saida = { x: escolhida.x, y: escolhida.y, revelada: false };

    jogador = criarEntidade(1, 1);
    jogador.invencivel = 2000;
    bombas = [];
    fogos = [];
    itens = [];
    inimigos = [];

    const livres = [];
    for (let y = 1; y < LINHAS - 1; y++) {
        for (let x = 1; x < COLUNAS - 1; x++) {
            if (mapa[y][x] === CHAO && x + y > 8) livres.push({ x, y });
        }
    }
    const totalUrsos = Math.min(2 + fase, 10);
    for (let i = 0; i < totalUrsos && livres.length; i++) {
        const { x, y } = livres.splice(Math.floor(Math.random() * livres.length), 1)[0];
        const urso = criarEntidade(x, y);
        urso.passo = Math.max(260, 520 - fase * 25) * (0.85 + Math.random() * 0.3);
        urso.espera = 0;
        inimigos.push(urso);
    }

    renderizarMapa();
    atualizarHUD();
    mostrarBanner(`FASE ${fase}`, nomeFase());
    estado = "jogando";
}

function bloqueado(x, y, ignorarBombas = false) {
    if (x < 0 || y < 0 || x >= COLUNAS || y >= LINHAS) return true;
    if (mapa[y][x] !== CHAO) return true;
    if (!ignorarBombas && bombas.some(b => b.x === x && b.y === y)) return true;
    return false;
}

function tempoPassoJogador() {
    return Math.max(95, 175 - (velocidade - 1) * 18);
}

function moverEntidade(e, dir, duracao) {
    e.dir = dir;
    const alvo = { x: e.para.x + dir.x, y: e.para.y + dir.y };
    if (bloqueado(alvo.x, alvo.y)) return false;
    e.de = { ...e.para };
    e.para = alvo;
    e.t = 0;
    e.duracao = duracao;
    e.movendo = true;
    return true;
}

function avancar(e, delta) {
    if (!e.movendo) return;
    e.t = Math.min(1, e.t + delta / e.duracao);
    if (e.t >= 1) {
        e.movendo = false;
        e.de = { ...e.para };
    }
}

function soltarBomba() {
    if (estado !== "jogando") return;
    const { x, y } = celulaAtual(jogador);
    if (bombas.length >= maxBombas || bombas.some(b => b.x === x && b.y === y)) return;
    bombas.push({ x, y, tempo: 0, alcance });
}

function explodirBomba(bomba) {
    bombas = bombas.filter(b => b !== bomba);
    adicionarFogo(bomba.x, bomba.y, "centro");
    tremor = Math.max(tremor, 6);
    explodir(bomba.x, bomba.y, LARANJA, 18);

    Object.values(DIRECOES).forEach(dir => {
        for (let i = 1; i <= bomba.alcance; i++) {
            const x = bomba.x + dir.x * i;
            const y = bomba.y + dir.y * i;
            const celula = mapa[y][x];

            if (celula === PAREDE) break;

            if (celula === CAIXA || celula === COFRE) {
                adicionarFogo(x, y, dir.x ? "h" : "v");
                atingirBloco(x, y);
                break;
            }

            adicionarFogo(x, y, dir.x ? "h" : "v");
            const outra = bombas.find(b => b.x === x && b.y === y);
            if (outra) explodirBomba(outra);
        }
    });
}

function adicionarFogo(x, y, tipo) {
    fogos.push({ x, y, tipo, vida: DURACAO_FOGO });
}

function atingirBloco(x, y) {
    const chave = `${x},${y}`;

    if (mapa[y][x] === COFRE) {
        const restante = vidaCofres.get(chave) - 1;
        explodir(x, y, "#94a3b8", 10);
        if (restante > 0) {
            vidaCofres.set(chave, restante);
            renderizarMapa();
            return;
        }
        vidaCofres.delete(chave);
        mapa[y][x] = CHAO;
        pontos += 100 * fase;
        flutuar(`+${100 * fase}`, x, y, "#e2e8f0", 13);
        explodir(x, y, DOURADO, 24);
        if (saida.x === x && saida.y === y) saida.revelada = true;
        else itens.push({ x, y, tipo: "bau", nascimento: 600 });
    } else {
        mapa[y][x] = CHAO;
        pontos += 10;
        explodir(x, y, "#b45309", 12);
        if (saida.x === x && saida.y === y) {
            saida.revelada = true;
            flutuar("PORTAL!", x, y, "#22d3ee", 14);
        } else {
            soltarItem(x, y);
        }
    }

    renderizarMapa();
    atualizarHUD();
}

function soltarItem(x, y) {
    const sorte = Math.random();
    let tipo = null;
    if (sorte < 0.22) tipo = "moeda";
    else if (sorte < 0.29) tipo = "bomba";
    else if (sorte < 0.36) tipo = "fogo";
    else if (sorte < 0.40) tipo = "velocidade";
    else if (sorte < 0.415) tipo = "vida";
    if (tipo) itens.push({ x, y, tipo, nascimento: 600 });
}

function pegarItens() {
    const { x, y } = celulaAtual(jogador);
    itens = itens.filter(item => {
        if (item.x !== x || item.y !== y || item.nascimento > 0) return true;

        if (item.tipo === "moeda") {
            moedas++;
            pontos += 100 * fase;
            flutuar(`₿ +${100 * fase}`, x, y, LARANJA, 14);
        } else if (item.tipo === "bau") {
            moedas += 5;
            pontos += 500 * fase;
            flutuar(`BAÚ ₿ +${500 * fase}`, x, y, DOURADO, 16);
        } else if (item.tipo === "bomba") {
            maxBombas = Math.min(maxBombas + 1, 8);
            flutuar("+1 BOMBA", x, y, "#e2e8f0", 13);
        } else if (item.tipo === "fogo") {
            alcance = Math.min(alcance + 1, 8);
            flutuar("+ALCANCE", x, y, "#fb923c", 13);
        } else if (item.tipo === "velocidade") {
            velocidade = Math.min(velocidade + 1, 5);
            flutuar("+VELOCIDADE", x, y, "#22d3ee", 13);
        } else if (item.tipo === "vida") {
            vidas = Math.min(vidas + 1, 5);
            flutuar("+1 VIDA", x, y, "#f43f5e", 13);
        }

        explodir(x, y, item.tipo === "bau" ? DOURADO : LARANJA, 14);
        atualizarHUD();
        return false;
    });
}

function emChamas(x, y) {
    return fogos.some(f => f.x === x && f.y === y);
}

function perderVida() {
    if (jogador.invencivel > 0 || estado !== "jogando") return;
    const { x, y } = posicao(jogador);
    explodir(x, y, "#38bdf8", 40);
    tremor = 14;
    vidas--;
    atualizarHUD();

    if (vidas <= 0) {
        fimDeJogo();
        return;
    }

    jogador = criarEntidade(1, 1);
    jogador.invencivel = 2500;
    flutuar("-1 VIDA", 1, 1, "#f43f5e", 14);
}

function fimDeJogo() {
    estado = "gameover";
    const bateuRecorde = pontos > recorde;
    if (bateuRecorde) {
        recorde = pontos;
        salvar("bitBombRecorde", recorde);
    }
    atualizarHUD();

    elPontuacaoFinal.textContent = pontos.toLocaleString("pt-BR");
    elResumoFinal.textContent = `Fase ${fase} · ${moedas} ₿ · ${ursosDerrotados} ursos`;
    elNovoRecorde.style.display = bateuRecorde ? "block" : "none";
    setTimeout(() => mostrar("gameover"), 900);
}

function concluirFase() {
    estado = "transicao";
    const bonus = 1000 * fase;
    pontos += bonus;
    flutuar(`FASE CONCLUÍDA +${bonus}`, saida.x, saida.y, "#22d3ee", 16);
    explodir(saida.x, saida.y, "#22d3ee", 50);
    atualizarHUD();
    setTimeout(() => gerarFase(fase + 1), 1600);
}

function alternarPausa() {
    if (estado === "jogando") {
        estado = "pausado";
        mostrar("pausa");
    } else if (estado === "pausado") {
        estado = "jogando";
        mostrar(null);
    }
}

function mostrarBanner(rotulo, titulo) {
    elBannerRotulo.textContent = rotulo;
    elBannerTitulo.textContent = titulo;
    elBanner.classList.remove("ativo");
    void elBanner.offsetWidth;
    elBanner.classList.add("ativo");
}

function atualizarHUD() {
    elPontos.textContent = pontos.toLocaleString("pt-BR");
    elRecorde.textContent = Math.max(recorde, pontos).toLocaleString("pt-BR");
    elMoedas.textContent = moedas;
    elVidas.textContent = "❤".repeat(Math.max(vidas, 0)) || "—";
    elFase.textContent = fase;
    elNomeFase.textContent = nomeFase();
    elPoderBombas.textContent = maxBombas;
    elPoderFogo.textContent = alcance;
    elPoderVelocidade.textContent = velocidade;

    if (inimigos.length > 0) elObjetivo.textContent = `Ursos restantes: ${inimigos.length}`;
    else if (!saida.revelada) elObjetivo.textContent = "Ache o portal nas caixas!";
    else elObjetivo.textContent = "Entre no portal!";
}

function atualizarJogador(delta) {
    if (jogador.invencivel > 0) jogador.invencivel -= delta;
    avancar(jogador, delta);

    if (!jogador.movendo) {
        for (let i = teclasAtivas.length - 1; i >= 0; i--) {
            if (moverEntidade(jogador, DIRECOES[teclasAtivas[i]], tempoPassoJogador())) break;
            jogador.dir = DIRECOES[teclasAtivas[i]];
        }
    }

    pegarItens();

    const atual = celulaAtual(jogador);
    if (emChamas(atual.x, atual.y)) perderVida();

    if (estado === "jogando" && saida.revelada && inimigos.length === 0 && atual.x === saida.x && atual.y === saida.y && !jogador.movendo) {
        concluirFase();
    }
}

function atualizarInimigos(delta) {
    const pj = posicao(jogador);

    inimigos = inimigos.filter(urso => {
        avancar(urso, delta);
        const atual = celulaAtual(urso);

        if (emChamas(atual.x, atual.y)) {
            ursosDerrotados++;
            const valor = 200 * fase;
            pontos += valor;
            explodir(atual.x, atual.y, "#f43f5e", 26);
            flutuar(`URSO +${valor}`, atual.x, atual.y, "#f43f5e", 14);
            atualizarHUD();
            return false;
        }

        if (!urso.movendo) {
            urso.espera -= delta;
            if (urso.espera <= 0) {
                const opcoes = Object.values(DIRECOES).filter(d => !bloqueado(urso.para.x + d.x, urso.para.y + d.y));
                if (opcoes.length) {
                    const continuar = opcoes.includes(urso.dir) && Math.random() < 0.7;
                    const dir = continuar ? urso.dir : opcoes[Math.floor(Math.random() * opcoes.length)];
                    moverEntidade(urso, dir, urso.passo);
                } else {
                    urso.espera = 300;
                }
            }
        }

        const pu = posicao(urso);
        if (Math.hypot(pu.x - pj.x, pu.y - pj.y) < 0.6) perderVida();
        return true;
    });
}

function atualizarBombas(delta) {
    for (const bomba of [...bombas]) {
        bomba.tempo += delta;
        if (bomba.tempo >= PAVIO && bombas.includes(bomba)) explodirBomba(bomba);
    }

    fogos.forEach(f => {
        f.vida -= delta;
    });
    fogos = fogos.filter(f => f.vida > 0);

    itens.forEach(item => {
        if (item.nascimento > 0) item.nascimento -= delta;
    });
}

function explodir(x, y, cor, quantidade) {
    const cx = x * CEL + CEL / 2;
    const cy = y * CEL + CEL / 2;
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const forca = 1 + Math.random() * 4;
        particulas.push({ x: cx, y: cy, vx: Math.cos(angulo) * forca, vy: Math.sin(angulo) * forca - 1, vida: 1, cor });
    }
    if (particulas.length > 400) particulas.splice(0, particulas.length - 400);
}

function flutuar(texto, x, y, cor, tamanho) {
    textos.push({ texto, x: x * CEL + CEL / 2, y: y * CEL + CEL / 2, cor, tamanho, vida: 1 });
}

const sprites = new Map();

function sprite(chave, largura, altura, pintar) {
    if (!sprites.has(chave)) {
        const c = document.createElement("canvas");
        c.width = largura;
        c.height = altura;
        pintar(c.getContext("2d"));
        sprites.set(chave, c);
    }
    return sprites.get(chave);
}

function pintarChao(c, x, y) {
    c.fillStyle = (x + y) % 2 ? "#1c1813" : "#211c16";
    c.fillRect(x * CEL, y * CEL, CEL, CEL);
    c.fillStyle = "rgba(255, 255, 255, 0.025)";
    c.fillRect(x * CEL + 3, y * CEL + 3, CEL - 6, 2);
}

function pintarParede(c, x, y) {
    const px = x * CEL;
    const py = y * CEL;
    const gradiente = c.createLinearGradient(px, py, px, py + CEL);
    gradiente.addColorStop(0, "#4a4552");
    gradiente.addColorStop(1, "#2a2730");
    c.fillStyle = gradiente;
    c.beginPath();
    c.roundRect(px + 1, py + 1, CEL - 2, CEL - 2, 6);
    c.fill();
    c.fillStyle = "rgba(255, 255, 255, 0.12)";
    c.fillRect(px + 5, py + 4, CEL - 10, 3);
    c.strokeStyle = "rgba(247, 147, 26, 0.35)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(px + 1.5, py + 1.5, CEL - 3, CEL - 3, 6);
    c.stroke();
}

function pintarCaixa(c, x, y) {
    const px = x * CEL;
    const py = y * CEL;
    c.fillStyle = "#8a5a2b";
    c.beginPath();
    c.roundRect(px + 3, py + 3, CEL - 6, CEL - 6, 4);
    c.fill();
    c.strokeStyle = "#5c3a1a";
    c.lineWidth = 2;
    c.strokeRect(px + 6, py + 6, CEL - 12, CEL - 12);
    c.beginPath();
    c.moveTo(px + 6, py + 6);
    c.lineTo(px + CEL - 6, py + CEL - 6);
    c.moveTo(px + CEL - 6, py + 6);
    c.lineTo(px + 6, py + CEL - 6);
    c.stroke();
    c.fillStyle = "rgba(255, 255, 255, 0.15)";
    c.fillRect(px + 5, py + 5, CEL - 10, 2);
}

function pintarCofre(c, x, y, vida) {
    const px = x * CEL;
    const py = y * CEL;
    const gradiente = c.createLinearGradient(px, py, px + CEL, py + CEL);
    gradiente.addColorStop(0, "#cbd5e1");
    gradiente.addColorStop(1, "#64748b");
    c.fillStyle = gradiente;
    c.beginPath();
    c.roundRect(px + 3, py + 3, CEL - 6, CEL - 6, 5);
    c.fill();
    c.strokeStyle = "#334155";
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = LARANJA;
    c.beginPath();
    c.arc(px + CEL / 2, py + CEL / 2, CEL * 0.22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.font = `bold ${CEL * 0.3}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("₿", px + CEL / 2, py + CEL / 2 + 1);

    c.strokeStyle = "#1e293b";
    c.lineWidth = 1.5;
    if (vida <= 2) {
        c.beginPath();
        c.moveTo(px + 7, py + 9);
        c.lineTo(px + 13, py + 15);
        c.lineTo(px + 11, py + 20);
        c.stroke();
    }
    if (vida <= 1) {
        c.beginPath();
        c.moveTo(px + CEL - 7, py + CEL - 8);
        c.lineTo(px + CEL - 14, py + CEL - 13);
        c.lineTo(px + CEL - 12, py + CEL - 20);
        c.stroke();
    }
}

function renderizarMapa() {
    if (!camadaMapa) {
        camadaMapa = document.createElement("canvas");
        camadaMapa.width = canvas.width;
        camadaMapa.height = canvas.height;
    }
    const c = camadaMapa.getContext("2d");
    for (let y = 0; y < LINHAS; y++) {
        for (let x = 0; x < COLUNAS; x++) {
            pintarChao(c, x, y);
            const celula = mapa[y][x];
            if (celula === PAREDE) pintarParede(c, x, y);
            else if (celula === CAIXA) pintarCaixa(c, x, y);
            else if (celula === COFRE) pintarCofre(c, x, y, vidaCofres.get(`${x},${y}`));
        }
    }
}

function spriteMoeda(tamanho, cor1, cor2) {
    return sprite(`moeda-${tamanho}-${cor1}`, tamanho + 12, tamanho + 12, c => {
        const centro = (tamanho + 12) / 2;
        const raio = tamanho / 2;
        c.shadowColor = cor1;
        c.shadowBlur = 8;
        const gradiente = c.createRadialGradient(centro - raio * 0.3, centro - raio * 0.3, raio * 0.1, centro, centro, raio);
        gradiente.addColorStop(0, cor1);
        gradiente.addColorStop(1, cor2);
        c.fillStyle = gradiente;
        c.beginPath();
        c.arc(centro, centro, raio, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#fff";
        c.font = `bold ${raio * 1.2}px Arial`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("₿", centro, centro + 1);
    });
}

function spriteIcone(tipo) {
    return sprite(`icone-${tipo}`, CEL, CEL, c => {
        const m = CEL / 2;
        const cores = { bomba: "#475569", fogo: "#ea580c", velocidade: "#0891b2", vida: "#e11d48", bau: "#b45309" };
        c.fillStyle = cores[tipo];
        c.beginPath();
        c.roundRect(5, 5, CEL - 10, CEL - 10, 7);
        c.fill();
        c.strokeStyle = "rgba(255, 255, 255, 0.6)";
        c.lineWidth = 1.5;
        c.stroke();

        if (tipo === "bau") {
            c.fillStyle = DOURADO;
            c.fillRect(9, 15, CEL - 18, CEL - 24);
            c.fillStyle = "#78350f";
            c.fillRect(9, 19, CEL - 18, 3);
            c.fillStyle = "#fff";
            c.font = "bold 11px Arial";
            c.textAlign = "center";
            c.fillText("₿", m, 31);
            return;
        }

        const emoji = { bomba: "💣", fogo: "🔥", velocidade: "⚡", vida: "❤" }[tipo];
        c.font = `${CEL * 0.42}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "#fff";
        c.fillText(emoji, m, m + 1);
    });
}

function spriteBomba() {
    return sprite("bomba", CEL, CEL, c => {
        const m = CEL / 2;
        const gradiente = c.createRadialGradient(m - 5, m - 2, 2, m, m + 3, CEL * 0.38);
        gradiente.addColorStop(0, "#52525b");
        gradiente.addColorStop(1, "#09090b");
        c.fillStyle = gradiente;
        c.beginPath();
        c.arc(m, m + 3, CEL * 0.34, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = LARANJA;
        c.font = `bold ${CEL * 0.3}px Arial`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("₿", m, m + 4);
        c.fillStyle = "#3f3f46";
        c.fillRect(m - 3, m - 12, 6, 5);
        c.strokeStyle = "#a16207";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(m, m - 12);
        c.quadraticCurveTo(m + 4, m - 18, m + 9, m - 16);
        c.stroke();
    });
}

function spriteHeroi() {
    return sprite("heroi", CEL, CEL, c => {
        const m = CEL / 2;
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(m, CEL - 4, 11, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#1e3a8a";
        c.fillRect(m - 8, CEL - 12, 6, 8);
        c.fillRect(m + 2, CEL - 12, 6, 8);

        c.fillStyle = "#2563eb";
        c.beginPath();
        c.roundRect(m - 10, m - 2, 20, 14, 5);
        c.fill();
        c.fillStyle = LARANJA;
        c.font = "bold 9px Arial";
        c.textAlign = "center";
        c.fillText("₿", m, m + 9);

        c.fillStyle = "#f2c094";
        c.beginPath();
        c.arc(m, m - 7, 8, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = LARANJA;
        c.beginPath();
        c.arc(m, m - 9, 9.5, Math.PI, 0);
        c.fill();
        c.fillRect(m - 11, m - 10, 22, 3);

        c.fillStyle = "#22d3ee";
        c.beginPath();
        c.roundRect(m - 7, m - 8, 14, 5, 2);
        c.fill();
        c.fillStyle = "#fef08a";
        c.beginPath();
        c.arc(m, m - 15, 2.5, 0, Math.PI * 2);
        c.fill();
    });
}

function spriteUrso() {
    return sprite("urso", CEL, CEL, c => {
        const m = CEL / 2;
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(m, CEL - 4, 11, 3.5, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#b91c1c";
        [[-9, -9], [9, -9]].forEach(([ox, oy]) => {
            c.beginPath();
            c.arc(m + ox, m + oy, 5, 0, Math.PI * 2);
            c.fill();
        });

        const gradiente = c.createRadialGradient(m - 4, m - 4, 2, m, m, 15);
        gradiente.addColorStop(0, "#f87171");
        gradiente.addColorStop(1, "#991b1b");
        c.fillStyle = gradiente;
        c.beginPath();
        c.arc(m, m + 1, 13, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#fecaca";
        c.beginPath();
        c.ellipse(m, m + 6, 6, 4.5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#1f2937";
        c.beginPath();
        c.arc(m, m + 4.5, 2, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#fff";
        c.fillRect(m - 8, m - 3, 5, 4);
        c.fillRect(m + 3, m - 3, 5, 4);
        c.fillStyle = "#111";
        c.fillRect(m - 6, m - 2, 2, 3);
        c.fillRect(m + 5, m - 2, 2, 3);
        c.strokeStyle = "#111";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(m - 9, m - 6);
        c.lineTo(m - 3, m - 4);
        c.moveTo(m + 9, m - 6);
        c.lineTo(m + 3, m - 4);
        c.stroke();

        c.strokeStyle = "#22c55e";
        c.lineWidth = 0;
        c.strokeStyle = "#fde047";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(m - 5, m + 11);
        c.lineTo(m - 1, m + 13);
        c.lineTo(m + 1, m + 11);
        c.lineTo(m + 5, m + 15);
        c.stroke();
    });
}

function desenharItens(tempo) {
    itens.forEach(item => {
        const px = item.x * CEL;
        const py = item.y * CEL;
        const flutuacao = Math.sin(tempo / 220 + item.x) * 2;
        if (item.tipo === "moeda") {
            const s = spriteMoeda(CEL - 14, "#ffb347", "#d9730d");
            const giro = Math.max(Math.abs(Math.cos(tempo / 380 + item.x)), 0.15);
            ctx.save();
            ctx.translate(px + CEL / 2, py + CEL / 2 + flutuacao);
            ctx.scale(giro, 1);
            ctx.drawImage(s, -s.width / 2, -s.height / 2);
            ctx.restore();
        } else {
            ctx.drawImage(spriteIcone(item.tipo), px, py + flutuacao);
        }
    });

    if (saida.revelada) {
        const cx = saida.x * CEL + CEL / 2;
        const cy = saida.y * CEL + CEL / 2;
        const aberto = inimigos.length === 0;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tempo / 400);
        ctx.strokeStyle = aberto ? "#22d3ee" : "#64748b";
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 8 + i * 4, i, i + Math.PI * 1.3);
            ctx.stroke();
        }
        ctx.restore();
        if (!aberto) {
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔒", cx, cy);
        }
    }
}

function desenharBombas(tempo) {
    const s = spriteBomba();
    bombas.forEach(b => {
        const urgencia = b.tempo / PAVIO;
        const pulso = 1 + Math.sin(tempo / (120 - urgencia * 80)) * 0.08;
        ctx.save();
        ctx.translate(b.x * CEL + CEL / 2, b.y * CEL + CEL / 2);
        ctx.scale(pulso, pulso);
        ctx.drawImage(s, -CEL / 2, -CEL / 2);
        ctx.restore();

        ctx.fillStyle = Math.floor(tempo / 80) % 2 ? "#fde047" : "#fb923c";
        ctx.beginPath();
        ctx.arc(b.x * CEL + CEL / 2 + 9, b.y * CEL + CEL / 2 - 16, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function desenharFogos() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    fogos.forEach(f => {
        const forca = f.vida / DURACAO_FOGO;
        const px = f.x * CEL;
        const py = f.y * CEL;
        const espessura = CEL * (0.45 + forca * 0.4);
        const sobra = (CEL - espessura) / 2;

        ctx.globalAlpha = Math.min(1, forca * 1.4);
        ctx.fillStyle = "#ea580c";
        if (f.tipo === "h") ctx.fillRect(px, py + sobra, CEL, espessura);
        else if (f.tipo === "v") ctx.fillRect(px + sobra, py, espessura, CEL);
        else ctx.fillRect(px + sobra * 0.5, py + sobra * 0.5, CEL - sobra, CEL - sobra);

        ctx.fillStyle = "#fde047";
        const miolo = espessura * 0.45;
        const sobraMiolo = (CEL - miolo) / 2;
        if (f.tipo === "h") ctx.fillRect(px, py + sobraMiolo, CEL, miolo);
        else if (f.tipo === "v") ctx.fillRect(px + sobraMiolo, py, miolo, CEL);
        else ctx.fillRect(px + sobraMiolo, py + sobraMiolo, miolo, miolo);
    });
    ctx.restore();
}

function desenharPersonagens(tempo) {
    const urso = spriteUrso();
    inimigos.forEach(e => {
        const p = posicao(e);
        const pulo = e.movendo ? Math.abs(Math.sin(e.t * Math.PI)) * 3 : 0;
        ctx.drawImage(urso, p.x * CEL, p.y * CEL - pulo);
    });

    if (estado === "gameover") return;
    if (jogador.invencivel > 0 && Math.floor(tempo / 100) % 2) return;
    const p = posicao(jogador);
    const pulo = jogador.movendo ? Math.abs(Math.sin(jogador.t * Math.PI)) * 3 : 0;
    ctx.save();
    ctx.translate(p.x * CEL + CEL / 2, p.y * CEL + CEL / 2 - pulo);
    ctx.scale(jogador.dir.x < 0 ? -1 : 1, 1);
    ctx.drawImage(spriteHeroi(), -CEL / 2, -CEL / 2);
    ctx.restore();
}

function desenharEfeitos(delta) {
    const passo = delta / 16.67;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    particulas.forEach(p => {
        p.x += p.vx * passo;
        p.y += p.vy * passo;
        p.vy += 0.12 * passo;
        p.vx *= 0.97;
        p.vida -= 0.022 * passo;
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.restore();
    particulas = particulas.filter(p => p.vida > 0);

    textos.forEach(t => {
        t.y -= 0.6 * passo;
        t.vida -= 0.014 * passo;
        ctx.save();
        ctx.globalAlpha = Math.max(Math.min(t.vida * 2, 1), 0);
        ctx.font = `800 ${t.tamanho}px Orbitron, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.strokeText(t.texto, t.x, t.y);
        ctx.fillStyle = t.cor;
        ctx.fillText(t.texto, t.x, t.y);
        ctx.restore();
    });
    textos = textos.filter(t => t.vida > 0);
}

function loop(tempo) {
    if (ultimoTempo === undefined) ultimoTempo = tempo;
    const delta = Math.min(tempo - ultimoTempo, 100);
    ultimoTempo = tempo;

    if (estado === "jogando") {
        atualizarBombas(delta);
        atualizarJogador(delta);
        if (estado === "jogando") atualizarInimigos(delta);
    } else if (estado === "transicao" || estado === "gameover") {
        fogos.forEach(f => {
            f.vida -= delta;
        });
        fogos = fogos.filter(f => f.vida > 0);
    }

    ctx.save();
    if (tremor > 0) {
        ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
        tremor *= 0.88;
        if (tremor < 0.4) tremor = 0;
    }
    if (camadaMapa) {
        ctx.drawImage(camadaMapa, 0, 0);
        desenharItens(tempo);
        desenharBombas(tempo);
        desenharFogos();
        desenharPersonagens(tempo);
    } else {
        ctx.fillStyle = "#1c1813";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    desenharEfeitos(delta);
    ctx.restore();

    requestAnimationFrame(loop);
}

const MAPA_TECLAS = {
    ArrowUp: "cima",
    w: "cima",
    W: "cima",
    ArrowDown: "baixo",
    s: "baixo",
    S: "baixo",
    ArrowLeft: "esquerda",
    a: "esquerda",
    A: "esquerda",
    ArrowRight: "direita",
    d: "direita",
    D: "direita"
};

function pressionar(dir) {
    const indice = teclasAtivas.indexOf(dir);
    if (indice !== -1) teclasAtivas.splice(indice, 1);
    teclasAtivas.push(dir);
}

function soltar(dir) {
    const indice = teclasAtivas.indexOf(dir);
    if (indice !== -1) teclasAtivas.splice(indice, 1);
}

document.addEventListener("keydown", evento => {
    const dir = MAPA_TECLAS[evento.key];
    if (dir) {
        evento.preventDefault();
        pressionar(dir);
    } else if (evento.key === " ") {
        evento.preventDefault();
        if (evento.repeat) return;
        if (estado === "inicio" || overlays.gameover.classList.contains("ativo")) iniciar();
        else soltarBomba();
    } else if (evento.key === "p" || evento.key === "P" || evento.key === "Escape") {
        alternarPausa();
    } else if (evento.key === "Enter" && (estado === "inicio" || overlays.gameover.classList.contains("ativo"))) {
        iniciar();
    }
});

document.addEventListener("keyup", evento => {
    const dir = MAPA_TECLAS[evento.key];
    if (dir) soltar(dir);
});

window.addEventListener("blur", () => {
    teclasAtivas.length = 0;
    if (estado === "jogando") alternarPausa();
});

document.querySelectorAll(".controles button").forEach(botao => {
    const dir = botao.dataset.dir;
    const acao = botao.dataset.acao;

    botao.addEventListener("pointerdown", evento => {
        evento.preventDefault();
        if (dir) pressionar(dir);
        else if (acao === "bomba") soltarBomba();
        else if (acao === "pausa") alternarPausa();
    });

    if (dir) {
        ["pointerup", "pointerleave", "pointercancel"].forEach(tipo => botao.addEventListener(tipo, () => soltar(dir)));
    }
});

document.getElementById("btnIniciar").addEventListener("click", iniciar);
document.getElementById("btnReiniciar").addEventListener("click", iniciar);

elRecorde.textContent = recorde.toLocaleString("pt-BR");
requestAnimationFrame(loop);
