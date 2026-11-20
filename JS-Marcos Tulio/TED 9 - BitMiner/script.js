const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");
const ctxProxima = document.getElementById("proxima").getContext("2d");

const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elMoedas = document.getElementById("moedas");
const elLinhas = document.getElementById("linhas");
const elPicaretas = document.getElementById("picaretas");
const elNivel = document.getElementById("nivel");
const elNomeNivel = document.getElementById("nomeNivel");
const elBarra = document.getElementById("barra");
const elFaltam = document.getElementById("faltam");
const elBanner = document.getElementById("banner");
const elBannerRotulo = document.getElementById("bannerRotulo");
const elBannerTitulo = document.getElementById("bannerTitulo");
const elMotivo = document.getElementById("motivo");
const elPontuacaoFinal = document.getElementById("pontuacaoFinal");
const elResumoFinal = document.getElementById("resumoFinal");
const elNovoRecorde = document.getElementById("novoRecorde");

const overlays = {
    inicio: document.getElementById("inicio"),
    pausa: document.getElementById("pausa"),
    gameover: document.getElementById("gameover")
};

const COLUNAS = 10;
const LINHAS = 16;
const CEL = canvas.width / COLUNAS;
const LARANJA = "#f7931a";
const DOURADO = "#ffc94d";
const MAX_PICARETAS = 5;
const MOEDAS_POR_NIVEL = 6;

const MINERAIS = [
    null,
    { nome: "carvão", cor: "#8b8b96" },
    { nome: "ferro", cor: "#e4e4e7" },
    { nome: "cobre", cor: "#f97316" },
    { nome: "ouro", cor: "#facc15" },
    { nome: "esmeralda", cor: "#10b981" },
    { nome: "diamante", cor: "#22d3ee" },
    { nome: "rubi", cor: "#f43f5e" }
];

const FORMAS = [
    [[1, 1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]]
];

const NIVEIS = ["Gênesis", "Halving", "Mineração", "Blockchain", "Bull Run", "Altseason", "To the Moon", "Satoshi"];

let tabuleiro, mineiro, pecas, aviso, proxima, moedasNoMapa;
let pontos, moedasColetadas, linhasMineradas, picaretas, nivel;
let estado = "inicio";
let tempoSpawn = 0;
let tempoMoeda = 0;
let tempoSobrevivencia = 0;
let tempoQuedaMineiro = 0;
let particulas = [];
let textos = [];
let flashes = [];
let tremor = 0;
let ultimoTempo;
let recorde = Number(ler("bitMinerRecorde")) || 0;

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

function nomeNivel() {
    return NIVEIS[Math.min(nivel - 1, NIVEIS.length - 1)];
}

function velocidadeQueda() {
    return Math.max(110, 520 * Math.pow(0.86, nivel - 1));
}

function atrasoSpawn() {
    return Math.max(250, 900 - (nivel - 1) * 80);
}

function maxPecas() {
    return nivel >= 4 ? 2 : 1;
}

function girarMatriz(m) {
    return m[0].map((_, i) => m.map(linha => linha[i]).reverse());
}

function criarPeca() {
    let matriz = FORMAS[Math.floor(Math.random() * FORMAS.length)].map(linha => [...linha]);
    const giros = Math.floor(Math.random() * 4);
    for (let i = 0; i < giros; i++) matriz = girarMatriz(matriz);
    return {
        matriz,
        mineral: 1 + Math.floor(Math.random() * 7),
        x: 0,
        y: -matriz.length,
        tempo: 0
    };
}

function colunasOcupadas() {
    const colunas = new Set();
    const marcar = p => {
        for (let i = 0; i < p.matriz[0].length; i++) colunas.add(p.x + i);
    };
    pecas.forEach(marcar);
    if (aviso) marcar(aviso.peca);
    return colunas;
}

function prepararQueda() {
    const peca = proxima;
    proxima = criarPeca();
    const largura = peca.matriz[0].length;
    const ocupadas = colunasOcupadas();

    let x = Math.floor(Math.random() * (COLUNAS - largura + 1));
    for (let tentativa = 0; tentativa < 15; tentativa++) {
        const candidato = Math.floor(Math.random() * (COLUNAS - largura + 1));
        let livre = true;
        for (let i = 0; i < largura; i++) if (ocupadas.has(candidato + i)) livre = false;
        if (livre) {
            x = candidato;
            break;
        }
    }

    peca.x = x;
    aviso = { peca, tempo: 0, duracao: 650 };
    desenharProxima();
}

function iniciar() {
    tabuleiro = Array.from({ length: LINHAS }, () => Array(COLUNAS).fill(0));
    for (let x = 0; x < COLUNAS; x++) {
        if (x !== 4 && Math.random() < 0.6) tabuleiro[LINHAS - 1][x] = 1 + Math.floor(Math.random() * 7);
    }

    mineiro = { x: 4, y: LINHAS - 1, dir: 1, graca: 0 };
    pecas = [];
    aviso = null;
    proxima = criarPeca();
    moedasNoMapa = [];
    pontos = 0;
    moedasColetadas = 0;
    linhasMineradas = 0;
    picaretas = 3;
    nivel = 1;
    tempoSpawn = 400;
    tempoMoeda = 0;
    tempoSobrevivencia = 0;
    tempoQuedaMineiro = 0;
    particulas = [];
    textos = [];
    flashes = [];

    gerarMoeda();
    gerarMoeda();
    estado = "jogando";
    mostrar(null);
    atualizarHUD();
    desenharProxima();
}

function dentro(x, y) {
    return x >= 0 && x < COLUNAS && y < LINHAS;
}

function bloco(x, y) {
    if (!dentro(x, y)) return true;
    if (y < 0) return false;
    return tabuleiro[y][x] !== 0;
}

function pecaEm(x, y) {
    return pecas.find(p => {
        const lx = x - p.x;
        const ly = y - p.y;
        return ly >= 0 && ly < p.matriz.length && lx >= 0 && lx < p.matriz[0].length && p.matriz[ly][lx];
    });
}

function livre(x, y) {
    return !bloco(x, y) && !pecaEm(x, y) && y >= 0;
}

function colide(matriz, px, py) {
    for (let y = 0; y < matriz.length; y++) {
        for (let x = 0; x < matriz[y].length; x++) {
            if (matriz[y][x] && bloco(px + x, py + y)) return true;
        }
    }
    return false;
}

function apoiado() {
    return bloco(mineiro.x, mineiro.y + 1) || !!pecaEm(mineiro.x, mineiro.y + 1);
}

function andar(dx) {
    mineiro.dir = dx;
    const nx = mineiro.x + dx;

    if (livre(nx, mineiro.y)) {
        mineiro.x = nx;
        coletar();
        return;
    }

    if (bloco(nx, mineiro.y) && dentro(nx, mineiro.y) && livre(nx, mineiro.y - 1) && livre(mineiro.x, mineiro.y - 1)) {
        mineiro.x = nx;
        mineiro.y--;
        coletar();
    }
}

function pular() {
    if (!apoiado() || !livre(mineiro.x, mineiro.y - 1)) return;
    mineiro.y--;
    mineiro.graca = 280;
    coletar();
}

function cavar(dx, dy) {
    const x = mineiro.x + dx;
    const y = mineiro.y + dy;
    if (x < 0 || x >= COLUNAS || y < 0 || y >= LINHAS || !tabuleiro[y][x]) return;

    if (picaretas <= 0) {
        flutuar("Sem picaretas!", mineiro.x, mineiro.y - 1, "#f43f5e", 12);
        return;
    }

    const mineral = MINERAIS[tabuleiro[y][x]];
    picaretas--;
    tabuleiro[y][x] = 0;
    pontos += 10 * nivel;
    tremor = Math.max(tremor, 3);
    explodir(x, y, mineral.cor, 16);
    flutuar(`+${10 * nivel}`, x, y, mineral.cor, 12);
    atualizarHUD();
}

function coletar() {
    const indice = moedasNoMapa.findIndex(m => m.x === mineiro.x && m.y === mineiro.y);
    if (indice === -1) return;

    const moeda = moedasNoMapa[indice];
    moedasNoMapa.splice(indice, 1);

    const valor = (moeda.dourada ? 500 : 100) * nivel;
    pontos += valor;
    moedasColetadas++;
    picaretas = Math.min(MAX_PICARETAS, picaretas + (moeda.dourada ? 2 : 1));
    explodir(moeda.x, moeda.y, moeda.dourada ? DOURADO : LARANJA, moeda.dourada ? 30 : 16);
    flutuar(`₿ +${valor}`, moeda.x, moeda.y, moeda.dourada ? DOURADO : LARANJA, moeda.dourada ? 18 : 14);

    const novoNivel = Math.floor(moedasColetadas / MOEDAS_POR_NIVEL) + 1;
    if (novoNivel > nivel) {
        nivel = novoNivel;
        mostrarBanner("HALVING!", `Nível ${nivel} · ${nomeNivel()}`);
    }

    tempoMoeda = 0;
    atualizarHUD();
}

function gerarMoeda() {
    for (let tentativa = 0; tentativa < 40; tentativa++) {
        const x = Math.floor(Math.random() * COLUNAS);
        let y = LINHAS - 1;
        while (y >= 0 && tabuleiro[y][x]) y--;
        y -= Math.floor(Math.random() * 3);
        if (y < 1) continue;
        if (!livre(x, y)) continue;
        if (x === mineiro.x && y === mineiro.y) continue;
        if (moedasNoMapa.some(m => m.x === x && m.y === y)) continue;

        const dourada = Math.random() < 0.15;
        moedasNoMapa.push({ x, y, dourada, vida: dourada ? 7000 : Infinity });
        return;
    }
}

function travar(peca) {
    let transbordou = false;

    peca.matriz.forEach((linha, ly) => {
        linha.forEach((valor, lx) => {
            if (!valor) return;
            const x = peca.x + lx;
            const y = peca.y + ly;
            if (y < 0) {
                transbordou = true;
                return;
            }
            tabuleiro[y][x] = peca.mineral;
            moedasNoMapa = moedasNoMapa.filter(m => !(m.x === x && m.y === y));
        });
    });

    pecas = pecas.filter(p => p !== peca);
    tremor = Math.max(tremor, 4);

    if (transbordou) {
        fimDeJogo("A mina encheu até o teto!");
        return;
    }

    verificarLinhas();
}

function verificarLinhas() {
    const cheias = [];
    tabuleiro.forEach((linha, y) => {
        if (linha.every(valor => valor)) cheias.push(y);
    });
    if (cheias.length === 0) return;

    const abaixoDoMineiro = cheias.filter(y => y > mineiro.y).length;

    cheias.forEach(y => {
        for (let x = 0; x < COLUNAS; x++) explodir(x, y, MINERAIS[tabuleiro[y][x]].cor, 3);
        flashes.push({ y, vida: 1 });
    });

    cheias.sort((a, b) => a - b).forEach(y => {
        tabuleiro.splice(y, 1);
        tabuleiro.unshift(Array(COLUNAS).fill(0));
    });

    mineiro.y += abaixoDoMineiro;
    moedasNoMapa.forEach(m => {
        m.y += cheias.filter(y => y > m.y).length;
    });

    const ganho = 300 * cheias.length * cheias.length * nivel;
    pontos += ganho;
    linhasMineradas += cheias.length;
    tremor = 10;
    flutuar(cheias.length > 1 ? `${cheias.length} LINHAS!` : "LINHA MINERADA!", 4.5, cheias[0] - 1, DOURADO, 16);
    flutuar(`+${ganho}`, 4.5, cheias[0], LARANJA, 14);
    atualizarHUD();
}

function fimDeJogo(motivo) {
    if (estado === "gameover") return;
    estado = "gameover";
    tremor = 16;

    explodir(mineiro.x, mineiro.y, "#38bdf8", 40);
    explodir(mineiro.x, mineiro.y, LARANJA, 20);

    const bateuRecorde = pontos > recorde;
    if (bateuRecorde) {
        recorde = pontos;
        salvar("bitMinerRecorde", recorde);
    }
    atualizarHUD();

    elMotivo.textContent = motivo;
    elPontuacaoFinal.textContent = pontos.toLocaleString("pt-BR");
    elResumoFinal.textContent = `Nível ${nivel} · ${moedasColetadas} ₿ · ${linhasMineradas} linhas`;
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
    elMoedas.textContent = moedasColetadas;
    elLinhas.textContent = linhasMineradas;
    elNivel.textContent = nivel;
    elNomeNivel.textContent = nomeNivel();

    const progresso = moedasColetadas % MOEDAS_POR_NIVEL;
    elBarra.style.width = `${(progresso / MOEDAS_POR_NIVEL) * 100}%`;
    const faltam = MOEDAS_POR_NIVEL - progresso;
    elFaltam.textContent = `${faltam} ₿ para o halving`;

    elPicaretas.innerHTML = "";
    for (let i = 0; i < MAX_PICARETAS; i++) {
        const icone = document.createElement("span");
        icone.textContent = "⛏";
        if (i >= picaretas) icone.className = "vazia";
        elPicaretas.appendChild(icone);
    }
}

function atualizarPecas(delta) {
    if (aviso) {
        aviso.tempo += delta;
        if (aviso.tempo >= aviso.duracao) {
            pecas.push(aviso.peca);
            aviso = null;
            tempoSpawn = 0;
        }
    } else if (pecas.length < maxPecas()) {
        tempoSpawn += delta;
        if (tempoSpawn >= atrasoSpawn()) prepararQueda();
    }

    for (const peca of [...pecas]) {
        peca.tempo += delta;
        if (peca.tempo < velocidadeQueda()) continue;
        peca.tempo = 0;

        if (colide(peca.matriz, peca.x, peca.y + 1)) {
            travar(peca);
            if (estado !== "jogando") return;
            continue;
        }

        peca.y++;
        if (pecaEm(mineiro.x, mineiro.y) === peca) {
            fimDeJogo(`Esmagado por um bloco de ${MINERAIS[peca.mineral].nome}!`);
            return;
        }
    }
}

function atualizarMineiro(delta) {
    if (mineiro.graca > 0) {
        mineiro.graca -= delta;
        return;
    }

    if (apoiado()) {
        tempoQuedaMineiro = 0;
        return;
    }

    tempoQuedaMineiro += delta;
    if (tempoQuedaMineiro >= 75) {
        tempoQuedaMineiro = 0;
        mineiro.y++;
        coletar();
    }
}

function atualizarMoedas(delta) {
    moedasNoMapa.forEach(m => {
        if (m.dourada) m.vida -= delta;
    });
    moedasNoMapa = moedasNoMapa.filter(m => m.vida > 0);

    const alvo = nivel >= 3 ? 3 : 2;
    if (moedasNoMapa.length < alvo) {
        tempoMoeda += delta;
        if (tempoMoeda >= 1200) {
            tempoMoeda = 0;
            gerarMoeda();
        }
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
    if (particulas.length > 400) particulas.splice(0, particulas.length - 400);
}

function flutuar(texto, x, y, cor, tamanho) {
    textos.push({ texto, x: x * CEL + CEL / 2, y: y * CEL + CEL / 2, cor, tamanho, vida: 1 });
}

const MARGEM = 6;
const sprites = new Map();

function criarSprite(chave, largura, altura, pintar) {
    if (!sprites.has(chave)) {
        const c = document.createElement("canvas");
        c.width = largura;
        c.height = altura;
        pintar(c.getContext("2d"));
        sprites.set(chave, c);
    }
    return sprites.get(chave);
}

function spriteBloco(mineral, tamanho) {
    return criarSprite(`bloco-${mineral}-${tamanho}`, tamanho + MARGEM * 2, tamanho + MARGEM * 2, c => {
        const cor = MINERAIS[mineral].cor;
        const p = MARGEM;
        const gradiente = c.createLinearGradient(p, p, p + tamanho, p + tamanho);
        gradiente.addColorStop(0, "#3d3a45");
        gradiente.addColorStop(1, "#1f1d25");
        c.fillStyle = gradiente;
        c.beginPath();
        c.roundRect(p + 1, p + 1, tamanho - 2, tamanho - 2, 5);
        c.fill();

        c.strokeStyle = cor;
        c.globalAlpha = 0.75;
        c.lineWidth = 1.5;
        c.stroke();
        c.globalAlpha = 1;

        c.shadowColor = cor;
        c.shadowBlur = 6;
        c.fillStyle = cor;
        const pedras = [[0.28, 0.3, 0.13], [0.68, 0.36, 0.1], [0.42, 0.68, 0.11], [0.74, 0.72, 0.07]];
        pedras.forEach(([fx, fy, fr]) => {
            const r = tamanho * fr;
            c.save();
            c.translate(p + tamanho * fx, p + tamanho * fy);
            c.rotate(Math.PI / 4);
            c.fillRect(-r, -r, r * 2, r * 2);
            c.restore();
        });
        c.shadowBlur = 0;
        c.fillStyle = "rgba(255, 255, 255, 0.55)";
        c.fillRect(p + tamanho * 0.25, p + tamanho * 0.25, 3, 3);
    });
}

function spriteMoeda(tamanho, dourada) {
    return criarSprite(`moeda-${tamanho}-${dourada}`, tamanho + 16, tamanho + 16, c => {
        const cx = (tamanho + 16) / 2;
        const raio = tamanho / 2;
        c.shadowColor = dourada ? DOURADO : LARANJA;
        c.shadowBlur = 10;
        const gradiente = c.createRadialGradient(cx - raio * 0.3, cx - raio * 0.3, raio * 0.1, cx, cx, raio);
        gradiente.addColorStop(0, dourada ? "#fff3b0" : "#ffb347");
        gradiente.addColorStop(1, dourada ? "#e0a100" : "#d9730d");
        c.fillStyle = gradiente;
        c.beginPath();
        c.arc(cx, cx, raio, 0, Math.PI * 2);
        c.fill();

        c.shadowBlur = 0;
        c.strokeStyle = "rgba(255, 255, 255, 0.5)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(cx, cx, raio * 0.78, 0, Math.PI * 2);
        c.stroke();

        c.fillStyle = "#fff";
        c.font = `bold ${raio * 1.25}px Arial`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("₿", cx, cx + raio * 0.06);
    });
}

function spriteMineiro() {
    return criarSprite("mineiro", CEL + 20, CEL + 20, c => {
        c.translate(10, 10);
        const s = CEL / 36;
        c.scale(s, s);

        c.fillStyle = "#1e293b";
        c.fillRect(11, 29, 6, 7);
        c.fillRect(20, 29, 6, 7);

        c.fillStyle = "#2563eb";
        c.beginPath();
        c.roundRect(9, 17, 19, 14, 4);
        c.fill();
        c.fillStyle = "#1d4ed8";
        c.fillRect(13, 17, 3, 8);
        c.fillRect(21, 17, 3, 8);
        c.fillStyle = LARANJA;
        c.font = "bold 8px Arial";
        c.textAlign = "center";
        c.fillText("₿", 18.5, 29);

        c.fillStyle = "#f2c094";
        c.beginPath();
        c.arc(18.5, 12, 6.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#0f172a";
        c.fillRect(20, 11, 2, 2);

        c.fillStyle = LARANJA;
        c.beginPath();
        c.arc(18.5, 9, 8, Math.PI, 0);
        c.fill();
        c.fillRect(9.5, 8, 18, 2.5);
        c.fillStyle = "#fef08a";
        c.beginPath();
        c.arc(25, 6.5, 2.5, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#92400e";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(27, 30);
        c.lineTo(33, 14);
        c.stroke();
        c.strokeStyle = "#cbd5e1";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(28, 13);
        c.quadraticCurveTo(33, 10, 37, 15);
        c.stroke();
    });
}

const fundo = document.createElement("canvas");
fundo.width = canvas.width;
fundo.height = canvas.height;
(() => {
    const c = fundo.getContext("2d");
    const gradiente = c.createLinearGradient(0, 0, 0, fundo.height);
    gradiente.addColorStop(0, "#0b0b12");
    gradiente.addColorStop(1, "#1a120b");
    c.fillStyle = gradiente;
    c.fillRect(0, 0, fundo.width, fundo.height);

    c.strokeStyle = "rgba(247, 147, 26, 0.06)";
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

    c.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let i = 0; i < 70; i++) {
        c.fillRect(Math.random() * fundo.width, Math.random() * fundo.height, 2, 2);
    }
})();

function desenharBloco(c, x, y, mineral, tamanho = CEL) {
    c.drawImage(spriteBloco(mineral, tamanho), x - MARGEM, y - MARGEM);
}

function desenharTabuleiro() {
    const cinza = estado === "gameover";
    tabuleiro.forEach((linha, y) => {
        linha.forEach((valor, x) => {
            if (!valor) return;
            if (cinza) ctx.globalAlpha = 0.5;
            desenharBloco(ctx, x * CEL, y * CEL, valor);
            ctx.globalAlpha = 1;
        });
    });
}

function desenharPecas(tempo) {
    pecas.forEach(peca => {
        let sombraY = peca.y;
        while (!colide(peca.matriz, peca.x, sombraY + 1)) sombraY++;

        ctx.save();
        ctx.strokeStyle = MINERAIS[peca.mineral].cor;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        peca.matriz.forEach((linha, ly) => {
            linha.forEach((valor, lx) => {
                if (!valor || sombraY + ly < 0) return;
                ctx.strokeRect((peca.x + lx) * CEL + 4, (sombraY + ly) * CEL + 4, CEL - 8, CEL - 8);
            });
        });
        ctx.restore();

        peca.matriz.forEach((linha, ly) => {
            linha.forEach((valor, lx) => {
                if (valor && peca.y + ly >= 0) desenharBloco(ctx, (peca.x + lx) * CEL, (peca.y + ly) * CEL, peca.mineral);
            });
        });
    });

    if (aviso) {
        const piscar = Math.floor(tempo / 120) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = piscar ? 0.35 : 0.15;
        ctx.fillStyle = "#f43f5e";
        for (let i = 0; i < aviso.peca.matriz[0].length; i++) {
            const x = (aviso.peca.x + i) * CEL;
            ctx.fillRect(x + 2, 0, CEL - 4, CEL * 1.5);
        }
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        const centro = (aviso.peca.x + aviso.peca.matriz[0].length / 2) * CEL;
        ctx.fillText("▼", centro, 26);
        ctx.restore();
    }
}

function desenharMoedas(tempo) {
    moedasNoMapa.forEach(m => {
        if (m.dourada && m.vida < 2000 && Math.floor(tempo / 120) % 2) return;
        const tamanho = m.dourada ? CEL - 6 : CEL - 12;
        const sprite = spriteMoeda(tamanho, m.dourada);
        const giro = Math.max(Math.abs(Math.cos(tempo / 380 + m.x)), 0.15);
        const flutuacao = Math.sin(tempo / 250 + m.x) * 2;

        ctx.save();
        ctx.translate(m.x * CEL + CEL / 2, m.y * CEL + CEL / 2 + flutuacao);
        ctx.scale(giro, 1);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
    });
}

function desenharMineiro(tempo) {
    if (estado === "gameover") return;
    const px = mineiro.x * CEL;
    const py = mineiro.y * CEL;
    const balanco = apoiado() ? Math.sin(tempo / 200) * 0.8 : -1;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255, 220, 120, 0.07)";
    ctx.beginPath();
    const lx = px + CEL / 2 + mineiro.dir * 8;
    ctx.moveTo(lx, py + 6);
    ctx.lineTo(lx + mineiro.dir * CEL * 3, py - CEL * 0.8);
    ctx.lineTo(lx + mineiro.dir * CEL * 3, py + CEL * 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const sprite = spriteMineiro();
    ctx.save();
    ctx.translate(px + CEL / 2, py + CEL / 2 + balanco);
    ctx.scale(mineiro.dir, 1);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
}

function desenharEfeitos(delta) {
    const passo = delta / 16.67;

    flashes.forEach(f => {
        f.vida -= 0.06 * passo;
        ctx.fillStyle = `rgba(255, 220, 150, ${Math.max(f.vida, 0) * 0.7})`;
        ctx.fillRect(0, f.y * CEL, canvas.width, CEL);
    });
    flashes = flashes.filter(f => f.vida > 0);

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

    textos.forEach(t => {
        t.y -= 0.6 * passo;
        t.vida -= 0.014 * passo;
        ctx.save();
        ctx.globalAlpha = Math.max(Math.min(t.vida * 2, 1), 0);
        ctx.font = `800 ${t.tamanho}px Orbitron, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = t.cor;
        ctx.fillText(t.texto, t.x, t.y);
        ctx.restore();
    });
    textos = textos.filter(t => t.vida > 0);
}

function desenharProxima() {
    ctxProxima.clearRect(0, 0, 120, 90);
    if (!proxima) return;
    const tamanho = 20;
    const largura = proxima.matriz[0].length * tamanho;
    const altura = proxima.matriz.length * tamanho;
    const ox = 60 - largura / 2;
    const oy = 45 - altura / 2;
    proxima.matriz.forEach((linha, y) => {
        linha.forEach((valor, x) => {
            if (valor) ctxProxima.drawImage(spriteBloco(proxima.mineral, tamanho), ox + x * tamanho - MARGEM, oy + y * tamanho - MARGEM);
        });
    });
}

function loop(tempo) {
    if (ultimoTempo === undefined) ultimoTempo = tempo;
    const delta = Math.min(tempo - ultimoTempo, 100);
    ultimoTempo = tempo;

    if (estado === "jogando") {
        repetirTeclas(delta);
        if (estado === "jogando") atualizarPecas(delta);
        if (estado === "jogando") atualizarMineiro(delta);
        if (estado === "jogando") atualizarMoedas(delta);

        tempoSobrevivencia += delta;
        if (tempoSobrevivencia >= 1000) {
            tempoSobrevivencia = 0;
            pontos += 10 * nivel;
            atualizarHUD();
        }
    }

    ctx.save();
    if (tremor > 0) {
        ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
        tremor *= 0.88;
        if (tremor < 0.4) tremor = 0;
    }
    ctx.drawImage(fundo, 0, 0);
    if (tabuleiro) {
        desenharTabuleiro();
        desenharPecas(tempo);
        desenharMoedas(tempo);
        desenharMineiro(tempo);
    }
    desenharEfeitos(delta);
    ctx.restore();

    requestAnimationFrame(loop);
}

const ACOES = {
    esquerda: () => andar(-1),
    direita: () => andar(1),
    pular: pular,
    cavarFrente: () => cavar(mineiro.dir, 0),
    cavarBaixo: () => cavar(0, 1)
};

function executar(acao) {
    if (acao === "pausar") {
        alternarPausa();
        return;
    }
    if (estado !== "jogando") return;
    ACOES[acao]();
}

const MAPA_TECLAS = {
    ArrowLeft: "esquerda",
    a: "esquerda",
    A: "esquerda",
    ArrowRight: "direita",
    d: "direita",
    D: "direita",
    ArrowUp: "pular",
    w: "pular",
    W: "pular",
    ArrowDown: "cavarBaixo",
    s: "cavarBaixo",
    S: "cavarBaixo",
    " ": "cavarFrente"
};

const ATRASO_REPETICAO = 170;
const INTERVALO_REPETICAO = { esquerda: 110, direita: 110 };
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

document.addEventListener("keydown", evento => {
    const acao = MAPA_TECLAS[evento.key];

    if (acao) {
        evento.preventDefault();
        if (evento.repeat) return;
        if ((estado === "inicio" || estado === "gameover") && evento.key === " ") {
            if (estado === "inicio" || overlays.gameover.classList.contains("ativo")) iniciar();
            return;
        }
        executar(acao);
        if (INTERVALO_REPETICAO[acao]) {
            delete segurando[acao === "esquerda" ? "direita" : "esquerda"];
            segurando[acao] = { tempo: 0, resto: 0 };
        }
    } else if (evento.key === "p" || evento.key === "P" || evento.key === "Escape") {
        alternarPausa();
    } else if (evento.key === "Enter" && (estado === "inicio" || overlays.gameover.classList.contains("ativo"))) {
        iniciar();
    }
});

document.addEventListener("keyup", evento => {
    const acao = MAPA_TECLAS[evento.key];
    if (acao) delete segurando[acao];
});

window.addEventListener("blur", () => {
    Object.keys(segurando).forEach(acao => delete segurando[acao]);
    if (estado === "jogando") alternarPausa();
});

document.querySelectorAll(".controles button").forEach(botao => {
    const acao = botao.dataset.acao;
    const repete = Boolean(INTERVALO_REPETICAO[acao]);
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
