const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");
const ctxGuardada = document.getElementById("guardada").getContext("2d");
const ctxProximas = document.getElementById("proximas").getContext("2d");

const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elLinhas = document.getElementById("linhas");
const elBitcoins = document.getElementById("bitcoins");
const elNivel = document.getElementById("nivel");
const elNomeNivel = document.getElementById("nomeNivel");
const elBarra = document.getElementById("barra");
const elFaltam = document.getElementById("faltam");
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

const COLUNAS = 10;
const LINHAS = 20;
const CEL = canvas.width / COLUNAS;
const BITCOIN = 8;
const LARANJA = "#f7931a";
const DOURADO = "#ffc94d";

const CORES = [null, "#22d3ee", "#3b82f6", "#f7931a", "#facc15", "#22c55e", "#a855f7", "#ef4444"];

const PECAS = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
    L: [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
    O: [[4, 4], [4, 4]],
    S: [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    T: [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
    Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
};

const NIVEIS = ["Gênesis", "Halving", "Mineração", "Blockchain", "Bull Run", "Altseason", "To the Moon", "Satoshi"];
const PONTOS_LINHAS = [0, 100, 300, 500, 800];
const NOMES_LINHAS = ["", "SINGLE", "DOUBLE", "TRIPLE", "MEGA MINE!"];
const CHUTES = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [0, 1]];
const ATRASO_TRAVA = 500;

let tabuleiro, peca, fila, saco, guardada, podeGuardar;
let pontos, linhas, nivel, combo, bitcoinsExplodidos, contadorBitcoin;
let estado = "inicio";
let acumuladoQueda = 0;
let tempoTrava = 0;
let resetsTrava = 0;
let linhasLimpando = [];
let tempoLimpeza = 0;
let tempoGameOver = 0;
let particulas = [];
let textos = [];
let tremor = 0;
let ultimoTempo;
let recorde = Number(ler("bitBlocksRecorde")) || 0;

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

function proximoTipo() {
    if (!saco || saco.length === 0) {
        saco = Object.keys(PECAS);
        for (let i = saco.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [saco[i], saco[j]] = [saco[j], saco[i]];
        }
    }
    return saco.pop();
}

function criarPeca(tipo) {
    const matriz = PECAS[tipo].map(linha => [...linha]);

    contadorBitcoin--;
    if (contadorBitcoin <= 0) {
        const cheias = [];
        matriz.forEach((linha, y) => linha.forEach((valor, x) => valor && cheias.push([x, y])));
        const [bx, by] = cheias[Math.floor(Math.random() * cheias.length)];
        matriz[by][bx] = BITCOIN;
        contadorBitcoin = 7 + Math.floor(Math.random() * 6);
    }

    return posicionar({ tipo, matriz, x: 0, y: 0 });
}

function posicionar(p) {
    p.x = Math.floor((COLUNAS - p.matriz[0].length) / 2);
    p.y = p.tipo === "I" ? -1 : 0;
    return p;
}

function corDaPeca(p) {
    return CORES[PECAS[p.tipo].flat().find(v => v)];
}

function iniciar() {
    tabuleiro = Array.from({ length: LINHAS }, () => Array(COLUNAS).fill(0));
    saco = [];
    contadorBitcoin = 4;
    fila = [criarPeca(proximoTipo()), criarPeca(proximoTipo()), criarPeca(proximoTipo())];
    guardada = null;
    pontos = 0;
    linhas = 0;
    nivel = 1;
    combo = -1;
    bitcoinsExplodidos = 0;
    particulas = [];
    textos = [];
    estado = "jogando";
    mostrar(null);
    gerarProxima();
    atualizarHUD();
    desenharLaterais();
}

function gerarProxima() {
    peca = fila.shift();
    fila.push(criarPeca(proximoTipo()));
    podeGuardar = true;
    acumuladoQueda = 0;
    tempoTrava = 0;
    resetsTrava = 0;
    desenharLaterais();

    if (colide(peca.matriz, peca.x, peca.y)) fimDeJogo();
}

function colide(matriz, px, py) {
    for (let y = 0; y < matriz.length; y++) {
        for (let x = 0; x < matriz[y].length; x++) {
            if (!matriz[y][x]) continue;
            const nx = px + x;
            const ny = py + y;
            if (nx < 0 || nx >= COLUNAS || ny >= LINHAS) return true;
            if (ny >= 0 && tabuleiro[ny][nx]) return true;
        }
    }
    return false;
}

function noChao() {
    return colide(peca.matriz, peca.x, peca.y + 1);
}

function reiniciarTrava() {
    if (noChao() && resetsTrava < 15) {
        tempoTrava = 0;
        resetsTrava++;
    }
}

function mover(dx) {
    if (!colide(peca.matriz, peca.x + dx, peca.y)) {
        peca.x += dx;
        reiniciarTrava();
    }
}

function girar(sentido = 1) {
    if (peca.tipo === "O") return;
    const m = peca.matriz;
    const girada = sentido === 1
        ? m[0].map((_, i) => m.map(linha => linha[i]).reverse())
        : m[0].map((_, i) => m.map(linha => linha[linha.length - 1 - i]));

    for (const [dx, dy] of CHUTES) {
        if (!colide(girada, peca.x + dx, peca.y + dy)) {
            peca.matriz = girada;
            peca.x += dx;
            peca.y += dy;
            reiniciarTrava();
            return;
        }
    }
}

function descer() {
    if (!noChao()) {
        peca.y++;
        pontos++;
        acumuladoQueda = 0;
        atualizarHUD();
    }
}

function soltar() {
    let distancia = 0;
    while (!noChao()) {
        peca.y++;
        distancia++;
    }
    pontos += distancia * 2;
    tremor = Math.max(tremor, 3);
    travar();
}

function guardar() {
    if (!podeGuardar) return;
    const atual = posicionar(peca);

    if (guardada) {
        peca = posicionar(guardada);
        acumuladoQueda = 0;
        tempoTrava = 0;
        resetsTrava = 0;
        if (colide(peca.matriz, peca.x, peca.y)) fimDeJogo();
    } else {
        gerarProxima();
    }

    guardada = atual;
    podeGuardar = false;
    desenharLaterais();
}

function travar() {
    const moedas = [];

    peca.matriz.forEach((linha, y) => {
        linha.forEach((valor, x) => {
            if (!valor) return;
            const by = peca.y + y;
            const bx = peca.x + x;
            if (by < 0) return;
            if (valor === BITCOIN) moedas.push([bx, by]);
            else tabuleiro[by][bx] = valor;
        });
    });

    if (peca.matriz.some((linha, y) => linha.some(v => v && peca.y + y < 0))) {
        fimDeJogo();
        return;
    }

    moedas.forEach(([mx, my]) => explodirBitcoin(mx, my));
    verificarLinhas();
}

function explodirBitcoin(mx, my) {
    for (let y = my - 1; y <= my + 1; y++) {
        for (let x = mx - 1; x <= mx + 1; x++) {
            if (x < 0 || x >= COLUNAS || y < 0 || y >= LINHAS) continue;
            if (tabuleiro[y][x]) explodir(x, y, CORES[tabuleiro[y][x]], 6);
            tabuleiro[y][x] = 0;
        }
    }

    const bonus = 250 * nivel;
    pontos += bonus;
    bitcoinsExplodidos++;
    tremor = 10;
    explodir(mx, my, DOURADO, 40);
    flutuar(`₿ +${bonus}`, mx, my, DOURADO, 20);
}

function verificarLinhas() {
    const cheias = [];
    tabuleiro.forEach((linha, y) => {
        if (linha.every(valor => valor)) cheias.push(y);
    });

    if (cheias.length === 0) {
        combo = -1;
        atualizarHUD();
        gerarProxima();
        return;
    }

    combo++;
    const qtd = cheias.length;
    let ganho = PONTOS_LINHAS[qtd] * nivel;
    if (combo > 0) ganho += 50 * combo * nivel;
    pontos += ganho;
    linhas += qtd;

    const meio = cheias[Math.floor(qtd / 2)];
    flutuar(NOMES_LINHAS[qtd], 4.5, meio - 0.6, qtd === 4 ? DOURADO : "#fff", qtd === 4 ? 26 : 20);
    flutuar(`+${ganho}`, 4.5, meio + 0.6, LARANJA, 16);
    if (combo > 0) flutuar(`COMBO x${combo + 1}`, 4.5, meio + 1.6, "#22d3ee", 14);

    cheias.forEach(y => {
        for (let x = 0; x < COLUNAS; x++) explodir(x, y, CORES[tabuleiro[y][x]] || LARANJA, 3);
    });
    if (qtd === 4) tremor = 12;

    const novoNivel = Math.floor(linhas / 10) + 1;
    if (novoNivel > nivel) {
        nivel = novoNivel;
        mostrarBanner("HALVING!", `Nível ${nivel} · ${nomeNivel()}`);
    }

    linhasLimpando = cheias;
    tempoLimpeza = 0;
    estado = "limpando";
    atualizarHUD();
}

function finalizarLimpeza() {
    linhasLimpando.sort((a, b) => a - b).forEach(y => {
        tabuleiro.splice(y, 1);
        tabuleiro.unshift(Array(COLUNAS).fill(0));
    });
    linhasLimpando = [];
    estado = "jogando";
    gerarProxima();
}

function nomeNivel() {
    return NIVEIS[Math.min(nivel - 1, NIVEIS.length - 1)];
}

function velocidade() {
    return Math.max(60, 600 * Math.pow(0.82, nivel - 1));
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
    elLinhas.textContent = linhas;
    elBitcoins.textContent = bitcoinsExplodidos;
    elNivel.textContent = nivel;
    elNomeNivel.textContent = nomeNivel();

    const progresso = linhas % 10;
    elBarra.style.width = `${progresso * 10}%`;
    const faltam = 10 - progresso;
    elFaltam.textContent = `${faltam} ${faltam === 1 ? "linha" : "linhas"} para o halving`;
}

function fimDeJogo() {
    estado = "gameover";
    tempoGameOver = 0;
    tremor = 14;

    const bateuRecorde = pontos > recorde;
    if (bateuRecorde) {
        recorde = pontos;
        salvar("bitBlocksRecorde", recorde);
    }
    atualizarHUD();

    elPontuacaoFinal.textContent = pontos.toLocaleString("pt-BR");
    elResumoFinal.textContent = `Nível ${nivel} · ${linhas} blocos minerados · ${bitcoinsExplodidos} ₿`;
    elNovoRecorde.style.display = bateuRecorde ? "block" : "none";
    setTimeout(() => mostrar("gameover"), 900);
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

function explodir(x, y, cor, quantidade) {
    const cx = x * CEL + CEL / 2;
    const cy = y * CEL + CEL / 2;
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const forca = 1 + Math.random() * 4;
        particulas.push({
            x: cx,
            y: cy,
            vx: Math.cos(angulo) * forca,
            vy: Math.sin(angulo) * forca - 1.5,
            vida: 1,
            cor
        });
    }
}

function flutuar(texto, x, y, cor, tamanho) {
    textos.push({ texto, x: x * CEL + CEL / 2, y: y * CEL + CEL / 2, cor, tamanho, vida: 1 });
}

function clarear(hex, quantidade) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + quantidade);
    const g = Math.min(255, ((n >> 8) & 255) + quantidade);
    const b = Math.min(255, (n & 255) + quantidade);
    return `rgb(${r}, ${g}, ${b})`;
}

function desenharMoeda(c, cx, cy, raio) {
    c.save();
    c.shadowColor = DOURADO;
    c.shadowBlur = 14;
    const gradiente = c.createRadialGradient(cx - raio * 0.3, cy - raio * 0.3, raio * 0.1, cx, cy, raio);
    gradiente.addColorStop(0, "#fff3b0");
    gradiente.addColorStop(1, "#e08a00");
    c.fillStyle = gradiente;
    c.beginPath();
    c.arc(cx, cy, raio, 0, Math.PI * 2);
    c.fill();

    c.shadowBlur = 0;
    c.strokeStyle = "rgba(255, 255, 255, 0.5)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, raio * 0.78, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = "#fff";
    c.font = `bold ${raio * 1.25}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("₿", cx, cy + raio * 0.06);
    c.restore();
}

const MARGEM_SPRITE = 10;
const sprites = new Map();

function sprite(valor, cor, tamanho) {
    const chave = `${valor}-${cor}-${tamanho}`;
    if (!sprites.has(chave)) {
        const c = document.createElement("canvas");
        c.width = c.height = tamanho + MARGEM_SPRITE * 2;
        pintarBloco(c.getContext("2d"), MARGEM_SPRITE, MARGEM_SPRITE, tamanho, valor, cor);
        sprites.set(chave, c);
    }
    return sprites.get(chave);
}

function desenharBloco(c, px, py, tamanho, valor, cor) {
    c.drawImage(sprite(valor, cor, tamanho), px - MARGEM_SPRITE, py - MARGEM_SPRITE);
}

function pintarBloco(c, px, py, tamanho, valor, cor) {
    c.save();

    if (valor === BITCOIN) {
        c.fillStyle = "#2a1a05";
        c.beginPath();
        c.roundRect(px + 1, py + 1, tamanho - 2, tamanho - 2, 5);
        c.fill();
        desenharMoeda(c, px + tamanho / 2, py + tamanho / 2, tamanho / 2 - 3);
        c.restore();
        return;
    }

    c.shadowColor = cor;
    c.shadowBlur = 10;
    const gradiente = c.createLinearGradient(px, py, px + tamanho, py + tamanho);
    gradiente.addColorStop(0, clarear(cor, 60));
    gradiente.addColorStop(1, cor);
    c.fillStyle = gradiente;
    c.beginPath();
    c.roundRect(px + 1, py + 1, tamanho - 2, tamanho - 2, 5);
    c.fill();

    c.shadowBlur = 0;
    c.fillStyle = "rgba(255, 255, 255, 0.25)";
    c.beginPath();
    c.roundRect(px + 4, py + 4, tamanho - 8, tamanho * 0.25, 3);
    c.fill();
    c.restore();
}

const fundo = document.createElement("canvas");
fundo.width = canvas.width;
fundo.height = canvas.height;
(() => {
    const c = fundo.getContext("2d");
    c.fillStyle = "#0a0a0f";
    c.fillRect(0, 0, fundo.width, fundo.height);
    c.strokeStyle = "rgba(247, 147, 26, 0.07)";
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 1; x < COLUNAS; x++) {
        c.moveTo(x * CEL + 0.5, 0);
        c.lineTo(x * CEL + 0.5, fundo.height);
    }
    for (let y = 1; y < LINHAS; y++) {
        c.moveTo(0, y * CEL + 0.5);
        c.lineTo(fundo.width, y * CEL + 0.5);
    }
    c.stroke();
})();

function desenharFundo() {
    ctx.drawImage(fundo, 0, 0);
}

function desenharTabuleiro() {
    const linhasCinza = estado === "gameover" ? Math.floor(tempoGameOver / 35) : 0;

    tabuleiro.forEach((linha, y) => {
        const cinza = y >= LINHAS - linhasCinza;
        linha.forEach((valor, x) => {
            if (valor) desenharBloco(ctx, x * CEL, y * CEL, CEL, valor, cinza ? "#3f3f46" : CORES[valor]);
        });
    });

    if (estado === "limpando") {
        const brilho = 1 - tempoLimpeza / 220;
        ctx.save();
        ctx.fillStyle = `rgba(255, 220, 150, ${Math.max(brilho, 0) * 0.85})`;
        ctx.shadowColor = DOURADO;
        ctx.shadowBlur = 20;
        linhasLimpando.forEach(y => ctx.fillRect(0, y * CEL, canvas.width, CEL));
        ctx.restore();
    }
}

function desenharPeca() {
    if (!peca || estado === "gameover" || estado === "limpando") return;
    const cor = corDaPeca(peca);

    let sombraY = peca.y;
    while (!colide(peca.matriz, peca.x, sombraY + 1)) sombraY++;

    ctx.save();
    ctx.strokeStyle = cor;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    peca.matriz.forEach((linha, y) => {
        linha.forEach((valor, x) => {
            if (!valor) return;
            ctx.beginPath();
            ctx.roundRect((peca.x + x) * CEL + 3, (sombraY + y) * CEL + 3, CEL - 6, CEL - 6, 4);
            ctx.stroke();
        });
    });
    ctx.restore();

    peca.matriz.forEach((linha, y) => {
        linha.forEach((valor, x) => {
            if (valor && peca.y + y >= 0) {
                desenharBloco(ctx, (peca.x + x) * CEL, (peca.y + y) * CEL, CEL, valor, cor);
            }
        });
    });
}

function desenharEfeitos(delta) {
    const passo = delta / 16.67;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    particulas.forEach(p => {
        p.x += p.vx * passo;
        p.y += p.vy * passo;
        p.vy += 0.15 * passo;
        p.vx *= 0.97;
        p.vida -= 0.02 * passo;

        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.restore();
    particulas = particulas.filter(p => p.vida > 0);
    if (particulas.length > 400) particulas.splice(0, particulas.length - 400);

    textos.forEach(t => {
        t.y -= 0.6 * passo;
        t.vida -= 0.012 * passo;

        ctx.save();
        ctx.globalAlpha = Math.max(Math.min(t.vida * 2, 1), 0);
        ctx.font = `800 ${t.tamanho}px Orbitron, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = t.cor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = t.cor;
        ctx.fillText(t.texto, t.x, t.y);
        ctx.restore();
    });
    textos = textos.filter(t => t.vida > 0);
}

function desenharMini(c, p, cx, cy, tamanho) {
    const cheias = [];
    p.matriz.forEach((linha, y) => linha.forEach((valor, x) => valor && cheias.push([x, y, valor])));
    const xs = cheias.map(([x]) => x);
    const ys = cheias.map(([, y]) => y);
    const largura = (Math.max(...xs) - Math.min(...xs) + 1) * tamanho;
    const altura = (Math.max(...ys) - Math.min(...ys) + 1) * tamanho;
    const ox = cx - largura / 2 - Math.min(...xs) * tamanho;
    const oy = cy - altura / 2 - Math.min(...ys) * tamanho;
    const cor = corDaPeca(p);

    cheias.forEach(([x, y, valor]) => desenharBloco(c, ox + x * tamanho, oy + y * tamanho, tamanho, valor, cor));
}

function desenharLaterais() {
    ctxGuardada.clearRect(0, 0, 120, 90);
    if (guardada) {
        ctxGuardada.save();
        ctxGuardada.globalAlpha = podeGuardar ? 1 : 0.35;
        desenharMini(ctxGuardada, guardada, 60, 45, 22);
        ctxGuardada.restore();
    }

    ctxProximas.clearRect(0, 0, 120, 270);
    if (fila) {
        fila.forEach((p, i) => desenharMini(ctxProximas, p, 60, 45 + i * 90, i === 0 ? 24 : 20));
    }
}

function loop(tempo) {
    if (ultimoTempo === undefined) ultimoTempo = tempo;
    const delta = Math.min(tempo - ultimoTempo, 100);
    ultimoTempo = tempo;

    if (estado === "jogando") {
        repetirTeclas(delta);
    }

    if (estado === "jogando") {
        acumuladoQueda += delta;
        if (acumuladoQueda >= velocidade()) {
            acumuladoQueda = 0;
            if (!noChao()) peca.y++;
        }

        if (noChao()) {
            tempoTrava += delta;
            if (tempoTrava >= ATRASO_TRAVA) travar();
        } else {
            tempoTrava = 0;
        }
    } else if (estado === "limpando") {
        tempoLimpeza += delta;
        if (tempoLimpeza >= 220) finalizarLimpeza();
    } else if (estado === "gameover") {
        tempoGameOver += delta;
    }

    ctx.save();
    if (tremor > 0) {
        ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
        tremor *= 0.88;
        if (tremor < 0.4) tremor = 0;
    }
    desenharFundo();
    if (tabuleiro) {
        desenharTabuleiro();
        desenharPeca();
    }
    desenharEfeitos(delta);
    ctx.restore();

    requestAnimationFrame(loop);
}

const ACOES = {
    esquerda: () => mover(-1),
    direita: () => mover(1),
    descer: descer,
    girar: () => girar(1),
    girarAnti: () => girar(-1),
    soltar: soltar,
    guardar: guardar
};

function executar(acao) {
    if (estado !== "jogando") return;
    ACOES[acao]();
}

const MAPA_TECLAS = {
    ArrowLeft: "esquerda",
    ArrowRight: "direita",
    ArrowDown: "descer",
    ArrowUp: "girar",
    x: "girar",
    X: "girar",
    z: "girarAnti",
    Z: "girarAnti",
    " ": "soltar",
    c: "guardar",
    C: "guardar",
    Shift: "guardar"
};

const ATRASO_REPETICAO = 140;
const INTERVALO_REPETICAO = { esquerda: 45, direita: 45, descer: 30 };
const segurando = {};

function repetirTeclas(delta) {
    Object.entries(segurando).forEach(([acao, tecla]) => {
        tecla.tempo += delta;
        if (tecla.tempo < ATRASO_REPETICAO) return;
        tecla.resto += delta;
        while (tecla.resto >= INTERVALO_REPETICAO[acao] && estado === "jogando") {
            executar(acao);
            tecla.resto -= INTERVALO_REPETICAO[acao];
        }
    });
}

document.addEventListener("keyup", evento => {
    const acao = MAPA_TECLAS[evento.key];
    if (acao) delete segurando[acao];
});

window.addEventListener("blur", () => {
    Object.keys(segurando).forEach(acao => delete segurando[acao]);
});

document.addEventListener("keydown", evento => {
    const acao = MAPA_TECLAS[evento.key];

    if (acao) {
        evento.preventDefault();
        if (evento.repeat) return;
        if (estado === "inicio" && evento.key === " ") {
            iniciar();
            return;
        }
        executar(acao);
        if (INTERVALO_REPETICAO[acao]) {
            if (acao === "esquerda") delete segurando.direita;
            if (acao === "direita") delete segurando.esquerda;
            segurando[acao] = { tempo: 0, resto: 0 };
        }
    } else if (evento.key === "p" || evento.key === "P" || evento.key === "Escape") {
        alternarPausa();
    } else if (evento.key === "Enter" && (estado === "inicio" || estado === "gameover")) {
        iniciar();
    }
});

document.querySelectorAll(".controles button").forEach(botao => {
    const acao = botao.dataset.acao;
    const repete = ["esquerda", "direita", "descer"].includes(acao);
    let atraso, intervalo;

    const parar = () => {
        clearTimeout(atraso);
        clearInterval(intervalo);
    };

    botao.addEventListener("pointerdown", evento => {
        evento.preventDefault();
        executar(acao);
        if (repete) {
            atraso = setTimeout(() => {
                intervalo = setInterval(() => executar(acao), INTERVALO_REPETICAO[acao]);
            }, ATRASO_REPETICAO);
        }
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(tipo => botao.addEventListener(tipo, parar));
});

document.getElementById("btnIniciar").addEventListener("click", iniciar);
document.getElementById("btnReiniciar").addEventListener("click", iniciar);

elRecorde.textContent = recorde.toLocaleString("pt-BR");
requestAnimationFrame(loop);
