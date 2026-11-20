const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");

const elAltitude = document.getElementById("altitude");
const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elMoedas = document.getElementById("moedas");
const elNomeFase = document.getElementById("nomeFase");
const elBarraLua = document.getElementById("barraLua");
const elFaltaLua = document.getElementById("faltaLua");
const elBarraCombustivel = document.getElementById("barraCombustivel");
const elEscudo = document.getElementById("escudo");
const elBanner = document.getElementById("banner");
const elBannerRotulo = document.getElementById("bannerRotulo");
const elBannerTitulo = document.getElementById("bannerTitulo");
const elTituloFinal = document.getElementById("tituloFinal");
const elMotivo = document.getElementById("motivo");
const elPontuacaoFinal = document.getElementById("pontuacaoFinal");
const elResumoFinal = document.getElementById("resumoFinal");
const elNovoRecorde = document.getElementById("novoRecorde");

const overlays = {
    inicio: document.getElementById("inicio"),
    pausa: document.getElementById("pausa"),
    gameover: document.getElementById("gameover")
};

const LARGURA = canvas.width;
const ALTURA = canvas.height;
const FOGUETE_Y = ALTURA - 130;
const LARANJA = "#f7931a";
const DOURADO = "#ffc94d";
const DISTANCIA_LUA = 384400;
const KM_POR_PX = 5.6;

const FASES = [
    { nome: "Decolagem", km: 0 },
    { nome: "Estratosfera", km: 50 },
    { nome: "Órbita baixa", km: 400 },
    { nome: "Cinturão de satélites", km: 36000 },
    { nome: "Espaço profundo", km: 150000 },
    { nome: "Aproximação lunar", km: 300000 }
];

let foguete, obstaculos, coletaveis, estrelas, nuvens;
let particulas = [];
let textos = [];
let altitude, km, moedas, pontos, combustivel, escudo, faseAtual;
let tempos;
let estado = "inicio";
let tremor = 0;
let ultimoTempo;
let alvoPonteiro = null;
let recorde = Number(ler("toTheMoonRecorde")) || 0;
const teclas = { esquerda: false, direita: false, turbo: false };

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

function aleatorio(min, max) {
    return min + Math.random() * (max - min);
}

function criarEstrelas() {
    estrelas = Array.from({ length: 90 }, () => ({
        x: Math.random() * LARGURA,
        y: Math.random() * ALTURA,
        z: aleatorio(0.2, 1),
        tamanho: Math.random() < 0.15 ? 2 : 1
    }));
    nuvens = Array.from({ length: 6 }, () => ({
        x: Math.random() * LARGURA,
        y: Math.random() * ALTURA,
        escala: aleatorio(0.6, 1.4)
    }));
}

function iniciar() {
    foguete = { x: LARGURA / 2, vx: 0 };
    obstaculos = [];
    coletaveis = [];
    particulas = [];
    textos = [];
    altitude = 0;
    km = 0;
    moedas = 0;
    pontos = 0;
    combustivel = 100;
    escudo = 0;
    faseAtual = 0;
    tempos = { asteroide: 0, satelite: 0, moeda: 0, combustivel: 0, escudo: 0 };
    alvoPonteiro = null;
    criarEstrelas();
    estado = "jogando";
    mostrar(null);
    atualizarHUD();
}

function velocidadeSubida() {
    const base = 210 + Math.min(altitude / 180, 320);
    return teclas.turbo && combustivel > 0 ? base * 1.7 : base;
}

function progresso() {
    return Math.min(km / DISTANCIA_LUA, 1);
}

function intervaloAsteroide() {
    if (km < 50) return 1.6;
    return Math.max(0.32, 1.1 - progresso() * 0.8);
}

function gerarAsteroide() {
    const raio = aleatorio(14, 30 + progresso() * 14);
    obstaculos.push({
        tipo: "asteroide",
        x: aleatorio(raio, LARGURA - raio),
        y: -raio - 10,
        raio,
        rotacao: Math.random() * Math.PI * 2,
        giro: aleatorio(-2, 2),
        vx: aleatorio(-30, 30) * (0.5 + progresso()),
        variante: Math.floor(Math.random() * 3)
    });
}

function gerarSatelite() {
    const daEsquerda = Math.random() < 0.5;
    obstaculos.push({
        tipo: "satelite",
        x: daEsquerda ? -40 : LARGURA + 40,
        y: aleatorio(-40, ALTURA * 0.35),
        vx: (daEsquerda ? 1 : -1) * aleatorio(70, 140),
        largura: 64,
        altura: 22
    });
}

function gerarMoedas() {
    const padrao = Math.floor(Math.random() * 3);
    const baseX = aleatorio(40, LARGURA - 40);
    for (let i = 0; i < 5; i++) {
        let x = baseX;
        if (padrao === 1) x = Math.min(LARGURA - 20, Math.max(20, baseX + (i - 2) * 26));
        if (padrao === 2) x = baseX + Math.sin(i * 1.2) * 40;
        coletaveis.push({ tipo: "moeda", x: Math.min(LARGURA - 20, Math.max(20, x)), y: -20 - i * 34 });
    }
}

function gerarItem(tipo) {
    coletaveis.push({ tipo, x: aleatorio(30, LARGURA - 30), y: -30 });
}

function atualizar(delta) {
    const dt = delta / 1000;
    const subida = velocidadeSubida();

    altitude += subida * dt;
    km = altitude * KM_POR_PX;

    const gasto = (teclas.turbo ? 10 : 3.2) * dt;
    combustivel = Math.max(0, combustivel - gasto);
    if (escudo > 0) escudo -= delta;

    pontos = Math.floor(km / 10) + moedas * 100;

    let novaFase = 0;
    FASES.forEach((fase, i) => {
        if (km >= fase.km) novaFase = i;
    });
    if (novaFase > faseAtual) {
        faseAtual = novaFase;
        mostrarBanner("NOVA FASE", FASES[faseAtual].nome);
    }

    if (km >= DISTANCIA_LUA) {
        vitoria();
        return;
    }

    if (combustivel <= 0) {
        fimDeJogo("O combustível acabou!");
        return;
    }

    moverFoguete(dt);

    tempos.asteroide += dt;
    if (tempos.asteroide >= intervaloAsteroide()) {
        tempos.asteroide = 0;
        gerarAsteroide();
    }

    if (faseAtual >= 2) {
        tempos.satelite += dt;
        if (tempos.satelite >= Math.max(2, 5 - progresso() * 3)) {
            tempos.satelite = 0;
            gerarSatelite();
        }
    }

    tempos.moeda += dt;
    if (tempos.moeda >= 1.8) {
        tempos.moeda = 0;
        gerarMoedas();
    }

    tempos.combustivel += dt;
    if (tempos.combustivel >= (combustivel < 40 ? 3.5 : 6.5)) {
        tempos.combustivel = 0;
        gerarItem("combustivel");
    }

    tempos.escudo += dt;
    if (tempos.escudo >= 22) {
        tempos.escudo = 0;
        gerarItem("escudo");
    }

    const queda = subida * dt;

    obstaculos.forEach(o => {
        o.y += queda;
        o.x += o.vx * dt;
        if (o.tipo === "asteroide") o.rotacao += o.giro * dt;
    });
    obstaculos = obstaculos.filter(o => o.y < ALTURA + 80 && o.x > -100 && o.x < LARGURA + 100);

    coletaveis.forEach(c => {
        c.y += queda;
    });
    coletaveis = coletaveis.filter(c => c.y < ALTURA + 40);

    estrelas.forEach(s => {
        s.y += queda * s.z * 0.35;
        if (s.y > ALTURA) {
            s.y -= ALTURA;
            s.x = Math.random() * LARGURA;
        }
    });
    nuvens.forEach(n => {
        n.y += queda * 0.8;
        if (n.y > ALTURA + 80) {
            n.y = -80;
            n.x = Math.random() * LARGURA;
        }
    });

    soltarFumaca(subida);
    verificarColisoes();
    atualizarHUD();
}

function moverFoguete(dt) {
    const aceleracao = 1800;
    if (teclas.esquerda) foguete.vx -= aceleracao * dt;
    if (teclas.direita) foguete.vx += aceleracao * dt;

    if (!teclas.esquerda && !teclas.direita) {
        if (alvoPonteiro !== null) {
            foguete.vx = (alvoPonteiro - foguete.x) * 8;
        } else {
            foguete.vx *= Math.pow(0.02, dt);
        }
    }

    foguete.vx = Math.max(-420, Math.min(420, foguete.vx));
    foguete.x += foguete.vx * dt;
    if (foguete.x < 22) {
        foguete.x = 22;
        foguete.vx = 0;
    }
    if (foguete.x > LARGURA - 22) {
        foguete.x = LARGURA - 22;
        foguete.vx = 0;
    }
}

function soltarFumaca(subida) {
    const turbo = teclas.turbo && combustivel > 0;
    const quantidade = turbo ? 3 : 2;
    for (let i = 0; i < quantidade; i++) {
        particulas.push({
            x: foguete.x + aleatorio(-5, 5),
            y: FOGUETE_Y + 34,
            vx: aleatorio(-25, 25),
            vy: aleatorio(80, 160) + subida * 0.25,
            vida: 1,
            decaimento: aleatorio(1.6, 2.6),
            cor: Math.random() < 0.5 ? LARANJA : turbo ? "#22d3ee" : "#fde047",
            tamanho: aleatorio(3, 6)
        });
    }
    if (particulas.length > 300) particulas.splice(0, particulas.length - 300);
}

function circuloColide(cx, cy, r, o) {
    if (o.tipo === "asteroide") {
        return Math.hypot(cx - o.x, cy - o.y) < r + o.raio * 0.82;
    }
    const px = Math.max(o.x - o.largura / 2, Math.min(cx, o.x + o.largura / 2));
    const py = Math.max(o.y - o.altura / 2, Math.min(cy, o.y + o.altura / 2));
    return Math.hypot(cx - px, cy - py) < r;
}

function verificarColisoes() {
    const corpo = { x: foguete.x, y: FOGUETE_Y + 6, r: 13 };
    const nariz = { x: foguete.x, y: FOGUETE_Y - 20, r: 8 };

    for (const o of obstaculos) {
        if (circuloColide(corpo.x, corpo.y, corpo.r, o) || circuloColide(nariz.x, nariz.y, nariz.r, o)) {
            if (escudo > 0) {
                escudo = 0;
                obstaculos = obstaculos.filter(outro => outro !== o);
                explodir(o.x, o.y, "#22d3ee", 30);
                flutuar("ESCUDO!", foguete.x, FOGUETE_Y - 50, "#22d3ee", 16);
                tremor = 8;
                return;
            }
            fimDeJogo(o.tipo === "asteroide" ? "Atingido por um asteroide!" : "Bateu num satélite!");
            return;
        }
    }

    coletaveis = coletaveis.filter(c => {
        if (Math.hypot(c.x - foguete.x, c.y - (FOGUETE_Y - 4)) > 30) return true;

        if (c.tipo === "moeda") {
            moedas++;
            flutuar("+100", c.x, c.y, LARANJA, 14);
            explodir(c.x, c.y, LARANJA, 10);
        } else if (c.tipo === "combustivel") {
            combustivel = Math.min(100, combustivel + 35);
            flutuar("+35% ⛽", c.x, c.y, "#22c55e", 14);
            explodir(c.x, c.y, "#22c55e", 14);
        } else if (c.tipo === "escudo") {
            escudo = 8000;
            flutuar("ESCUDO", c.x, c.y, "#22d3ee", 14);
            explodir(c.x, c.y, "#22d3ee", 14);
        }
        return false;
    });
}

function vitoria() {
    estado = "gameover";
    pontos += 50000;
    explodir(foguete.x, FOGUETE_Y, DOURADO, 80);
    finalizar("TO THE MOON!", "Você levou o Bitcoin até a Lua! +50.000");
}

function fimDeJogo(motivo) {
    estado = "gameover";
    tremor = 16;
    explodir(foguete.x, FOGUETE_Y, LARANJA, 60);
    explodir(foguete.x, FOGUETE_Y, "#e5e7eb", 30);
    finalizar("GAMEOVER", motivo);
}

function finalizar(titulo, motivo) {
    const bateuRecorde = pontos > recorde;
    if (bateuRecorde) {
        recorde = pontos;
        salvar("toTheMoonRecorde", recorde);
    }
    atualizarHUD();

    elTituloFinal.textContent = titulo;
    elTituloFinal.classList.toggle("vitoria", titulo !== "GAMEOVER");
    elMotivo.textContent = motivo;
    elPontuacaoFinal.textContent = pontos.toLocaleString("pt-BR");
    elResumoFinal.textContent = `${Math.floor(km).toLocaleString("pt-BR")} km · ${moedas} ₿`;
    elNovoRecorde.style.display = bateuRecorde ? "block" : "none";
    setTimeout(() => mostrar("gameover"), 1000);
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
    elAltitude.textContent = `${Math.floor(km).toLocaleString("pt-BR")} km`;
    elPontos.textContent = pontos.toLocaleString("pt-BR");
    elRecorde.textContent = Math.max(recorde, pontos).toLocaleString("pt-BR");
    elMoedas.textContent = moedas;
    elNomeFase.textContent = FASES[faseAtual].nome;
    elBarraLua.style.width = `${progresso() * 100}%`;
    elFaltaLua.textContent = `${Math.max(0, Math.ceil(DISTANCIA_LUA - km)).toLocaleString("pt-BR")} km até a Lua`;
    elBarraCombustivel.style.width = `${combustivel}%`;
    elBarraCombustivel.classList.toggle("baixo", combustivel < 25);
    elEscudo.style.visibility = escudo > 0 ? "visible" : "hidden";
}

function explodir(x, y, cor, quantidade) {
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const forca = aleatorio(40, 260);
        particulas.push({
            x,
            y,
            vx: Math.cos(angulo) * forca,
            vy: Math.sin(angulo) * forca,
            vida: 1,
            decaimento: aleatorio(0.8, 1.6),
            cor,
            tamanho: aleatorio(2, 5)
        });
    }
}

function flutuar(texto, x, y, cor, tamanho) {
    textos.push({ texto, x, y, cor, tamanho, vida: 1 });
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

function spriteFoguete() {
    return sprite("foguete", 60, 90, c => {
        c.translate(30, 45);

        c.fillStyle = LARANJA;
        c.beginPath();
        c.moveTo(-11, 10);
        c.lineTo(-24, 32);
        c.lineTo(-10, 28);
        c.closePath();
        c.moveTo(11, 10);
        c.lineTo(24, 32);
        c.lineTo(10, 28);
        c.closePath();
        c.fill();

        const corpo = c.createLinearGradient(-14, 0, 14, 0);
        corpo.addColorStop(0, "#9ca3af");
        corpo.addColorStop(0.45, "#f9fafb");
        corpo.addColorStop(1, "#6b7280");
        c.fillStyle = corpo;
        c.beginPath();
        c.moveTo(0, -40);
        c.bezierCurveTo(16, -24, 15, 10, 11, 30);
        c.lineTo(-11, 30);
        c.bezierCurveTo(-15, 10, -16, -24, 0, -40);
        c.fill();

        c.fillStyle = LARANJA;
        c.beginPath();
        c.moveTo(0, -40);
        c.bezierCurveTo(9, -31, 11, -26, 12, -22);
        c.lineTo(-12, -22);
        c.bezierCurveTo(-11, -26, -9, -31, 0, -40);
        c.fill();

        c.fillStyle = "#0f172a";
        c.beginPath();
        c.arc(0, -10, 7.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#38bdf8";
        c.beginPath();
        c.arc(0, -10, 5.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(255, 255, 255, 0.7)";
        c.beginPath();
        c.arc(-2, -12, 1.8, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = LARANJA;
        c.font = "bold 13px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("₿", 0, 12);

        c.fillStyle = "#374151";
        c.fillRect(-8, 30, 16, 5);
    });
}

function spriteAsteroide(variante) {
    return sprite(`asteroide-${variante}`, 80, 80, c => {
        c.translate(40, 40);
        const pontosForma = 11;
        const raios = [];
        let semente = variante * 7 + 3;
        for (let i = 0; i < pontosForma; i++) {
            semente = (semente * 9301 + 49297) % 233280;
            raios.push(28 + (semente / 233280) * 10);
        }

        const gradiente = c.createRadialGradient(-10, -10, 4, 0, 0, 38);
        gradiente.addColorStop(0, "#a8a29e");
        gradiente.addColorStop(1, "#44403c");
        c.fillStyle = gradiente;
        c.beginPath();
        raios.forEach((r, i) => {
            const angulo = (i / pontosForma) * Math.PI * 2;
            const x = Math.cos(angulo) * r;
            const y = Math.sin(angulo) * r;
            if (i === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
        });
        c.closePath();
        c.fill();

        c.fillStyle = "rgba(0, 0, 0, 0.3)";
        [[-10, -6, 7], [9, 8, 5], [6, -14, 4], [-6, 14, 4]].forEach(([x, y, r]) => {
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
        });
    });
}

function spriteSatelite() {
    return sprite("satelite", 80, 40, c => {
        c.translate(40, 20);
        c.fillStyle = "#1d4ed8";
        c.fillRect(-36, -8, 24, 16);
        c.fillRect(12, -8, 24, 16);
        c.strokeStyle = "#93c5fd";
        c.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            c.strokeRect(-36 + i * 8, -8, 8, 16);
            c.strokeRect(12 + i * 8, -8, 8, 16);
        }
        c.fillStyle = "#9ca3af";
        c.fillRect(-12, -1, 24, 2);
        c.fillStyle = DOURADO;
        c.beginPath();
        c.roundRect(-9, -10, 18, 20, 3);
        c.fill();
        c.fillStyle = "#e5e7eb";
        c.beginPath();
        c.arc(0, -14, 4, Math.PI, 0);
        c.fill();
    });
}

function spriteMoeda() {
    return sprite("moeda", 40, 40, c => {
        c.shadowColor = LARANJA;
        c.shadowBlur = 8;
        const gradiente = c.createRadialGradient(15, 15, 2, 20, 20, 14);
        gradiente.addColorStop(0, "#ffd08a");
        gradiente.addColorStop(1, "#d9730d");
        c.fillStyle = gradiente;
        c.beginPath();
        c.arc(20, 20, 13, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#fff";
        c.font = "bold 16px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("₿", 20, 21);
    });
}

function spriteCombustivel() {
    return sprite("combustivel", 40, 44, c => {
        c.shadowColor = "#22c55e";
        c.shadowBlur = 10;
        c.fillStyle = "#16a34a";
        c.beginPath();
        c.roundRect(8, 10, 24, 28, 5);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#15803d";
        c.fillRect(14, 5, 10, 7);
        c.fillStyle = "#fff";
        c.beginPath();
        c.moveTo(20, 16);
        c.quadraticCurveTo(27, 25, 20, 31);
        c.quadraticCurveTo(13, 25, 20, 16);
        c.fill();
    });
}

function spriteEscudo() {
    return sprite("escudo", 44, 44, c => {
        c.shadowColor = "#22d3ee";
        c.shadowBlur = 12;
        c.strokeStyle = "#22d3ee";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(22, 22, 15, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "rgba(34, 211, 238, 0.25)";
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#e0f2fe";
        c.beginPath();
        c.moveTo(22, 12);
        c.lineTo(30, 16);
        c.lineTo(28, 26);
        c.lineTo(22, 32);
        c.lineTo(16, 26);
        c.lineTo(14, 16);
        c.closePath();
        c.fill();
    });
}

function misturar(cor1, cor2, t) {
    const a = cor1.match(/\w\w/g).map(h => parseInt(h, 16));
    const b = cor2.match(/\w\w/g).map(h => parseInt(h, 16));
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

function desenharCeu() {
    const t = Math.min(km / 400, 1);
    const gradiente = ctx.createLinearGradient(0, 0, 0, ALTURA);
    gradiente.addColorStop(0, misturar("2563eb", "03040c", t));
    gradiente.addColorStop(1, misturar("93c5fd", "0b1026", t));
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    const brilhoEstrelas = Math.min(Math.max((km - 20) / 300, 0), 1);
    if (brilhoEstrelas > 0) {
        ctx.fillStyle = "#fff";
        estrelas.forEach(s => {
            ctx.globalAlpha = brilhoEstrelas * s.z;
            ctx.fillRect(s.x, s.y, s.tamanho, s.tamanho);
        });
        ctx.globalAlpha = 1;
    }

    if (km < 80) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - km / 80)})`;
        nuvens.forEach(n => {
            ctx.beginPath();
            ctx.ellipse(n.x, n.y, 46 * n.escala, 16 * n.escala, 0, 0, Math.PI * 2);
            ctx.ellipse(n.x - 26 * n.escala, n.y + 6, 26 * n.escala, 12 * n.escala, 0, 0, Math.PI * 2);
            ctx.ellipse(n.x + 28 * n.escala, n.y + 5, 28 * n.escala, 12 * n.escala, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    if (km > 200000) {
        const aproximacao = (km - 200000) / (DISTANCIA_LUA - 200000);
        const raio = 24 + aproximacao * aproximacao * 260;
        const cy = 70 + raio * 0.2;
        const lua = ctx.createRadialGradient(LARGURA / 2 - raio * 0.3, cy - raio * 0.3, raio * 0.1, LARGURA / 2, cy, raio);
        lua.addColorStop(0, "#f8fafc");
        lua.addColorStop(1, "#94a3b8");
        ctx.fillStyle = lua;
        ctx.beginPath();
        ctx.arc(LARGURA / 2, cy, raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(71, 85, 105, 0.35)";
        [[-0.3, -0.1, 0.18], [0.25, 0.2, 0.12], [0.1, -0.4, 0.09], [-0.15, 0.4, 0.1]].forEach(([fx, fy, fr]) => {
            ctx.beginPath();
            ctx.arc(LARGURA / 2 + fx * raio, cy + fy * raio, fr * raio, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    const chao = ALTURA - 60 + altitude;
    if (chao < ALTURA) {
        ctx.fillStyle = "#166534";
        ctx.fillRect(0, chao, LARGURA, ALTURA);
        ctx.fillStyle = "#374151";
        ctx.fillRect(LARGURA / 2 - 50, chao - 8, 100, 10);
        ctx.fillStyle = LARANJA;
        ctx.fillRect(LARGURA / 2 - 50, chao - 8, 100, 3);
    }
}

function desenharObjetos(tempo) {
    coletaveis.forEach(c => {
        if (c.tipo === "moeda") {
            const s = spriteMoeda();
            const giro = Math.max(Math.abs(Math.cos(tempo / 300 + c.x)), 0.15);
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(giro, 1);
            ctx.drawImage(s, -20, -20);
            ctx.restore();
        } else if (c.tipo === "combustivel") {
            ctx.drawImage(spriteCombustivel(), c.x - 20, c.y - 22 + Math.sin(tempo / 200) * 2);
        } else {
            ctx.drawImage(spriteEscudo(), c.x - 22, c.y - 22 + Math.sin(tempo / 200) * 2);
        }
    });

    obstaculos.forEach(o => {
        if (o.tipo === "asteroide") {
            const s = spriteAsteroide(o.variante);
            const escala = o.raio / 34;
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.rotacao);
            ctx.scale(escala, escala);
            ctx.drawImage(s, -40, -40);
            ctx.restore();
        } else {
            ctx.drawImage(spriteSatelite(), o.x - 40, o.y - 20);
        }
    });
}

function desenharFoguete(tempo) {
    if (estado === "gameover" && km < DISTANCIA_LUA) return;
    const inclinacao = Math.max(-0.35, Math.min(0.35, foguete.vx / 1200));
    const turbo = teclas.turbo && combustivel > 0 && estado === "jogando";

    ctx.save();
    ctx.translate(foguete.x, FOGUETE_Y);
    ctx.rotate(inclinacao);

    const tamanhoChama = (turbo ? 30 : 18) + Math.sin(tempo / 40) * 4;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = turbo ? "rgba(34, 211, 238, 0.85)" : "rgba(247, 147, 26, 0.85)";
    ctx.beginPath();
    ctx.moveTo(-7, 34);
    ctx.quadraticCurveTo(0, 34 + tamanhoChama * 1.6, 7, 34);
    ctx.fill();
    ctx.fillStyle = "rgba(254, 240, 138, 0.9)";
    ctx.beginPath();
    ctx.moveTo(-4, 34);
    ctx.quadraticCurveTo(0, 34 + tamanhoChama, 4, 34);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.drawImage(spriteFoguete(), -30, -45);

    if (escudo > 0 && (escudo > 2000 || Math.floor(tempo / 120) % 2)) {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
        ctx.fillStyle = "rgba(34, 211, 238, 0.12)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, -2, 30, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function desenharEfeitos(delta) {
    const dt = delta / 1000;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    particulas.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vida -= p.decaimento * dt;
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x - p.tamanho / 2, p.y - p.tamanho / 2, p.tamanho, p.tamanho);
    });
    ctx.restore();
    particulas = particulas.filter(p => p.vida > 0);

    textos.forEach(t => {
        t.y -= 40 * dt;
        t.vida -= 0.9 * dt;
        ctx.save();
        ctx.globalAlpha = Math.max(Math.min(t.vida * 2, 1), 0);
        ctx.font = `800 ${t.tamanho}px Orbitron, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
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

    if (estado === "jogando") atualizar(delta);

    ctx.save();
    if (tremor > 0) {
        ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
        tremor *= 0.9;
        if (tremor < 0.4) tremor = 0;
    }
    if (foguete) {
        desenharCeu();
        desenharObjetos(tempo);
        desenharFoguete(tempo);
    } else {
        km = 0;
        altitude = 0;
        if (!estrelas) criarEstrelas();
        desenharCeu();
    }
    desenharEfeitos(delta);
    ctx.restore();

    requestAnimationFrame(loop);
}

const MAPA_TECLAS = {
    ArrowLeft: "esquerda",
    a: "esquerda",
    A: "esquerda",
    ArrowRight: "direita",
    d: "direita",
    D: "direita",
    " ": "turbo",
    ArrowUp: "turbo",
    w: "turbo",
    W: "turbo"
};

document.addEventListener("keydown", evento => {
    const acao = MAPA_TECLAS[evento.key];
    if (acao) {
        evento.preventDefault();
        if (acao === "turbo" && !evento.repeat && (estado === "inicio" || overlays.gameover.classList.contains("ativo"))) {
            iniciar();
            return;
        }
        teclas[acao] = true;
        if (acao !== "turbo") alvoPonteiro = null;
    } else if (evento.key === "p" || evento.key === "P" || evento.key === "Escape") {
        alternarPausa();
    } else if (evento.key === "Enter" && (estado === "inicio" || overlays.gameover.classList.contains("ativo"))) {
        iniciar();
    }
});

document.addEventListener("keyup", evento => {
    const acao = MAPA_TECLAS[evento.key];
    if (acao) teclas[acao] = false;
});

window.addEventListener("blur", () => {
    teclas.esquerda = teclas.direita = teclas.turbo = false;
    if (estado === "jogando") alternarPausa();
});

function posicaoPonteiro(evento) {
    const retangulo = canvas.getBoundingClientRect();
    return ((evento.clientX - retangulo.left) / retangulo.width) * LARGURA;
}

canvas.addEventListener("pointerdown", evento => {
    alvoPonteiro = posicaoPonteiro(evento);
    canvas.setPointerCapture(evento.pointerId);
});
canvas.addEventListener("pointermove", evento => {
    if (evento.buttons || evento.pointerType === "mouse") alvoPonteiro = posicaoPonteiro(evento);
});
canvas.addEventListener("pointerleave", () => {
    alvoPonteiro = null;
});

document.querySelectorAll(".controles button").forEach(botao => {
    const acao = botao.dataset.acao;
    botao.addEventListener("pointerdown", evento => {
        evento.preventDefault();
        teclas[acao] = true;
        alvoPonteiro = null;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(tipo => botao.addEventListener(tipo, () => {
        teclas[acao] = false;
    }));
});

document.getElementById("btnIniciar").addEventListener("click", iniciar);
document.getElementById("btnReiniciar").addEventListener("click", iniciar);

elRecorde.textContent = recorde.toLocaleString("pt-BR");
requestAnimationFrame(loop);
