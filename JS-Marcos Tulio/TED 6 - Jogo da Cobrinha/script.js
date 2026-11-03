const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const tela = document.getElementById("tela");

const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elFase = document.getElementById("fase");
const elNomeFase = document.getElementById("nomeFase");
const elProgressoTexto = document.getElementById("progressoTexto");
const elBarra = document.getElementById("barra");
const elListaFases = document.getElementById("listaFases");
const elTransicaoRotulo = document.getElementById("transicaoRotulo");
const elTransicaoTitulo = document.getElementById("transicaoTitulo");
const elTransicaoTexto = document.getElementById("transicaoTexto");
const elPontuacaoFinal = document.getElementById("pontuacaoFinal");
const elFaseFinal = document.getElementById("faseFinal");
const elNovoRecorde = document.getElementById("novoRecorde");

const overlays = {
    inicio: document.getElementById("inicio"),
    transicao: document.getElementById("transicao"),
    pausa: document.getElementById("pausa"),
    gameover: document.getElementById("gameover")
};

const TAMANHO = 24;
const COLUNAS = canvas.width / TAMANHO;
const LINHAS = canvas.height / TAMANHO;

const AZUL = "#38bdf8";
const AZUL_ESCURO = "#2563eb";
const LARANJA = "#f7931a";
const DOURADO = "#ffc94d";

const TECLAS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
};

function linhaH(y, x1, x2) {
    const celulas = [];
    for (let x = x1; x <= x2; x++) celulas.push([x, y]);
    return celulas;
}

function linhaV(x, y1, y2) {
    const celulas = [];
    for (let y = y1; y <= y2; y++) celulas.push([x, y]);
    return celulas;
}

const FASES = [
    {
        nome: "Gênesis",
        descricao: "O primeiro bloco. Colete 5 bitcoins.",
        meta: 5,
        velocidade: 150,
        paredes: false,
        obstaculos: []
    },
    {
        nome: "Halving",
        descricao: "As bordas agora são paredes. Cuidado!",
        meta: 7,
        velocidade: 130,
        paredes: true,
        obstaculos: []
    },
    {
        nome: "Mineração",
        descricao: "Desvie das plataformas de mineração.",
        meta: 8,
        velocidade: 120,
        paredes: true,
        obstaculos: [...linhaH(4, 4, 15), ...linhaH(15, 4, 15)]
    },
    {
        nome: "Blockchain",
        descricao: "Blocos encadeados bloqueiam o caminho.",
        meta: 10,
        velocidade: 110,
        paredes: true,
        obstaculos: [
            ...linhaV(9, 2, 7), ...linhaV(9, 12, 17),
            ...linhaH(4, 3, 5), ...linhaH(4, 14, 16),
            ...linhaH(15, 3, 5), ...linhaH(15, 14, 16)
        ]
    },
    {
        nome: "Bull Run",
        descricao: "O mercado acelerou. Segure firme!",
        meta: 12,
        velocidade: 95,
        paredes: true,
        obstaculos: [
            ...linhaV(10, 4, 7), ...linhaV(10, 13, 16),
            ...linhaH(7, 13, 16), ...linhaH(13, 13, 16),
            [2, 2], [3, 2], [2, 3], [17, 2], [16, 2], [17, 3],
            [2, 17], [3, 17], [2, 16], [17, 17], [16, 17], [17, 16]
        ]
    },
    {
        nome: "To the Moon",
        descricao: "Fase final: colete o máximo que puder!",
        meta: Infinity,
        velocidade: 85,
        paredes: true,
        obstaculos: [
            ...[...linhaH(4, 4, 15), ...linhaH(15, 4, 15), ...linhaV(4, 5, 14), ...linhaV(15, 5, 14)]
                .filter(([x, y]) => !((x === 9 || x === 10) && (y === 4 || y === 15)))
                .filter(([x, y]) => !((y === 9 || y === 10) && (x === 4 || x === 15))),
            [7, 7], [12, 7], [7, 12], [12, 12]
        ]
    }
];

const DURACAO_MEGA = 6000;

let cobra, direcao, filaDirecoes, comida, mega;
let obstaculos = new Set();
let faseAtual = 0;
let coletadas = 0;
let pontos = 0;
let velocidade = 150;
let acumulado = 0;
let ultimoTempo;
let estado = "inicio";
let particulas = [];
let tremor = 0;
let temporizador;
let recorde = Number(ler("bitSnakeRecorde")) || 0;
let faseMaxima = Number(ler("bitSnakeFaseMaxima")) || 0;

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

function renderizarMenu() {
    elListaFases.innerHTML = "";
    FASES.forEach((fase, i) => {
        const botao = document.createElement("button");
        const bloqueada = i > faseMaxima;
        botao.className = "fase-btn";
        botao.disabled = bloqueada;
        botao.innerHTML = `<strong>${i + 1}</strong><span>${bloqueada ? "🔒" : fase.nome}</span>`;
        botao.addEventListener("click", () => iniciarJogo(i));
        elListaFases.appendChild(botao);
    });
}

function iniciarJogo(indice) {
    clearTimeout(temporizador);
    pontos = 0;
    particulas = [];
    carregarFase(indice);
}

function carregarFase(indice) {
    const fase = FASES[indice];
    faseAtual = indice;
    coletadas = 0;
    velocidade = fase.velocidade;
    acumulado = 0;
    mega = null;
    obstaculos = new Set(fase.obstaculos.map(([x, y]) => `${x},${y}`));
    cobra = [{ x: 3, y: 10 }];
    direcao = { x: 1, y: 0 };
    filaDirecoes = [];
    gerarComida();
    atualizarHUD();

    elTransicaoRotulo.textContent = `FASE ${indice + 1} DE ${FASES.length}`;
    elTransicaoTitulo.textContent = fase.nome;
    elTransicaoTexto.textContent = fase.descricao;
    mostrar("transicao");
    estado = "transicao";

    temporizador = setTimeout(() => {
        mostrar(null);
        estado = "jogando";
    }, 1800);
}

function concluirFase() {
    estado = "transicao";
    const proxima = faseAtual + 1;

    if (proxima > faseMaxima) {
        faseMaxima = proxima;
        salvar("bitSnakeFaseMaxima", faseMaxima);
    }

    cobra.forEach(parte => explodir(parte.x, parte.y, DOURADO, 4));
    elTransicaoRotulo.textContent = "FASE CONCLUÍDA";
    elTransicaoTitulo.textContent = FASES[faseAtual].nome + " ✓";
    elTransicaoTexto.textContent = `Próxima: ${FASES[proxima].nome}`;
    mostrar("transicao");

    temporizador = setTimeout(() => carregarFase(proxima), 1600);
}

function celulaLivre(x, y) {
    if (obstaculos.has(`${x},${y}`)) return false;
    if (cobra.some(parte => parte.x === x && parte.y === y)) return false;
    if (comida && comida.x === x && comida.y === y) return false;
    if (mega && mega.x === x && mega.y === y) return false;
    return true;
}

function posicaoAleatoria() {
    let posicao;
    do {
        posicao = {
            x: Math.floor(Math.random() * COLUNAS),
            y: Math.floor(Math.random() * LINHAS)
        };
    } while (!celulaLivre(posicao.x, posicao.y));
    return posicao;
}

function gerarComida() {
    comida = null;
    comida = posicaoAleatoria();
}

function atualizarHUD() {
    const fase = FASES[faseAtual];
    elPontos.textContent = pontos;
    elRecorde.textContent = recorde;
    elFase.textContent = `${faseAtual + 1}/${FASES.length}`;
    elNomeFase.textContent = fase.nome;

    if (fase.meta === Infinity) {
        elProgressoTexto.textContent = `₿ ${coletadas} / ∞`;
        elBarra.style.width = "100%";
        elBarra.classList.add("infinita");
    } else {
        elProgressoTexto.textContent = `₿ ${coletadas} / ${fase.meta}`;
        elBarra.style.width = `${(coletadas / fase.meta) * 100}%`;
        elBarra.classList.remove("infinita");
    }
}

function passo() {
    if (filaDirecoes.length) direcao = filaDirecoes.shift();

    const fase = FASES[faseAtual];
    let x = cobra[0].x + direcao.x;
    let y = cobra[0].y + direcao.y;

    if (fase.paredes) {
        if (x < 0 || x >= COLUNAS || y < 0 || y >= LINHAS) {
            fimDeJogo();
            return;
        }
    } else {
        x = (x + COLUNAS) % COLUNAS;
        y = (y + LINHAS) % LINHAS;
    }

    if (obstaculos.has(`${x},${y}`) || cobra.some(parte => parte.x === x && parte.y === y)) {
        fimDeJogo();
        return;
    }

    cobra.unshift({ x, y });
    let cresceu = false;

    if (mega && mega.x === x && mega.y === y) {
        pontos += 5;
        explodir(x, y, DOURADO, 30);
        mega = null;
        cresceu = true;
    }

    if (comida.x === x && comida.y === y) {
        pontos++;
        coletadas++;
        explodir(x, y, LARANJA);
        cresceu = true;

        if (coletadas >= fase.meta) {
            atualizarHUD();
            concluirFase();
            return;
        }

        gerarComida();
        if (!mega && Math.random() < 0.25) {
            mega = { ...posicaoAleatoria(), restante: DURACAO_MEGA };
        }
    }

    if (!cresceu) cobra.pop();
    atualizarHUD();
}

function explodir(x, y, cor, quantidade = 18) {
    const cx = x * TAMANHO + TAMANHO / 2;
    const cy = y * TAMANHO + TAMANHO / 2;
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const forca = 1 + Math.random() * 3;
        particulas.push({
            x: cx,
            y: cy,
            vx: Math.cos(angulo) * forca,
            vy: Math.sin(angulo) * forca,
            vida: 1,
            cor
        });
    }
}

function fimDeJogo() {
    estado = "gameover";
    tremor = 12;
    cobra.forEach(parte => explodir(parte.x, parte.y, AZUL, 6));

    const bateuRecorde = pontos > recorde;
    if (bateuRecorde) {
        recorde = pontos;
        salvar("bitSnakeRecorde", recorde);
    }
    atualizarHUD();

    elPontuacaoFinal.textContent = pontos;
    elFaseFinal.textContent = `Fase ${faseAtual + 1} · ${FASES[faseAtual].nome}`;
    elNovoRecorde.style.display = bateuRecorde ? "block" : "none";
    temporizador = setTimeout(() => mostrar("gameover"), 500);
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

function irParaMenu() {
    clearTimeout(temporizador);
    estado = "inicio";
    renderizarMenu();
    mostrar("inicio");
}

function quadradoArredondado(x, y, tamanho, raio) {
    ctx.beginPath();
    ctx.roundRect(x, y, tamanho, tamanho, raio);
    ctx.fill();
}

function desenharFundo() {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(247, 147, 26, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < COLUNAS; i++) {
        ctx.moveTo(i * TAMANHO + 0.5, 0);
        ctx.lineTo(i * TAMANHO + 0.5, canvas.height);
        ctx.moveTo(0, i * TAMANHO + 0.5);
        ctx.lineTo(canvas.width, i * TAMANHO + 0.5);
    }
    ctx.stroke();

    if (cobra && FASES[faseAtual].paredes) {
        ctx.save();
        ctx.strokeStyle = LARANJA;
        ctx.lineWidth = 3;
        ctx.shadowColor = LARANJA;
        ctx.shadowBlur = 16;
        ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
        ctx.restore();
    }
}

function desenharObstaculos() {
    ctx.save();
    obstaculos.forEach(chave => {
        const [x, y] = chave.split(",").map(Number);
        const px = x * TAMANHO + 2;
        const py = y * TAMANHO + 2;
        const tamanho = TAMANHO - 4;

        ctx.shadowColor = LARANJA;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#1c1410";
        quadradoArredondado(px, py, tamanho, 4);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(247, 147, 26, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(px, py, tamanho, tamanho, 4);
        ctx.stroke();

        ctx.fillStyle = "rgba(247, 147, 26, 0.35)";
        ctx.fillRect(px + 5, py + 6, tamanho - 10, 2);
        ctx.fillRect(px + 5, py + 11, tamanho - 14, 2);
    });
    ctx.restore();
}

function desenharMoeda(cx, cy, raio, tempo, corClara, corEscura) {
    const giro = Math.cos(tempo / 380);
    const escalaX = Math.max(Math.abs(giro), 0.12);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(escalaX, 1);

    ctx.shadowColor = corClara;
    ctx.shadowBlur = 18;

    const gradiente = ctx.createRadialGradient(-raio * 0.3, -raio * 0.3, raio * 0.1, 0, 0, raio);
    gradiente.addColorStop(0, corClara);
    gradiente.addColorStop(1, corEscura);
    ctx.fillStyle = gradiente;
    ctx.beginPath();
    ctx.arc(0, 0, raio, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, raio * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    if (escalaX > 0.3) {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${raio * 1.25}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₿", 0, raio * 0.06);
    }
    ctx.restore();
}

function desenharComida(tempo) {
    const flutuar = Math.sin(tempo / 250) * 1.5;
    desenharMoeda(
        comida.x * TAMANHO + TAMANHO / 2,
        comida.y * TAMANHO + TAMANHO / 2 + flutuar,
        TAMANHO / 2 - 2,
        tempo,
        "#ffb347",
        "#d9730d"
    );
}

function desenharMega(tempo) {
    const cx = mega.x * TAMANHO + TAMANHO / 2;
    const cy = mega.y * TAMANHO + TAMANHO / 2;
    const proporcao = mega.restante / DURACAO_MEGA;

    ctx.save();
    ctx.globalAlpha = proporcao < 0.3 && Math.floor(tempo / 120) % 2 ? 0.4 : 1;
    desenharMoeda(cx, cy, TAMANHO * 0.62, tempo * 1.4, "#fff3b0", "#e0a100");

    ctx.strokeStyle = DOURADO;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = DOURADO;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, TAMANHO * 0.85, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * proporcao);
    ctx.stroke();

    ctx.font = "bold 10px Orbitron, Arial";
    ctx.fillStyle = DOURADO;
    ctx.textAlign = "center";
    ctx.fillText("+5", cx, cy - TAMANHO);
    ctx.restore();
}

function desenharCobra() {
    ctx.save();
    ctx.shadowColor = AZUL;
    ctx.shadowBlur = 18;

    cobra.forEach((parte, i) => {
        const t = cobra.length > 1 ? i / (cobra.length - 1) : 0;
        const margem = 2 + t * 3;
        const tamanho = TAMANHO - margem * 2;
        const x = parte.x * TAMANHO + margem;
        const y = parte.y * TAMANHO + margem;

        const gradiente = ctx.createLinearGradient(x, y, x + tamanho, y + tamanho);
        gradiente.addColorStop(0, i === 0 ? "#7dd3fc" : AZUL);
        gradiente.addColorStop(1, AZUL_ESCURO);
        ctx.fillStyle = gradiente;
        ctx.globalAlpha = 1 - t * 0.45;
        quadradoArredondado(x, y, tamanho, 6);
    });
    ctx.restore();

    desenharOlhos();
}

function desenharOlhos() {
    const cabeca = cobra[0];
    const cx = cabeca.x * TAMANHO + TAMANHO / 2;
    const cy = cabeca.y * TAMANHO + TAMANHO / 2;

    ctx.fillStyle = "#0f172a";
    [-1, 1].forEach(lado => {
        const ox = direcao.x * 4 + direcao.y * 4.5 * lado;
        const oy = direcao.y * 4 + direcao.x * 4.5 * lado;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, 2.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function desenharParticulas() {
    particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vida -= 0.025;

        ctx.save();
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.shadowColor = p.cor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.restore();
    });
    particulas = particulas.filter(p => p.vida > 0);
}

function desenhar(tempo) {
    ctx.save();
    if (tremor > 0) {
        ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
        tremor *= 0.9;
        if (tremor < 0.5) tremor = 0;
    }

    desenharFundo();
    if (cobra) {
        desenharObstaculos();
        if (comida) desenharComida(tempo);
        if (mega) desenharMega(tempo);
        if (estado !== "gameover") desenharCobra();
    }
    desenharParticulas();
    ctx.restore();
}

function loop(tempo) {
    if (ultimoTempo === undefined) ultimoTempo = tempo;
    const delta = tempo - ultimoTempo;
    ultimoTempo = tempo;

    if (estado === "jogando") {
        if (mega) {
            mega.restante -= delta;
            if (mega.restante <= 0) mega = null;
        }

        acumulado += delta;
        while (acumulado >= velocidade && estado === "jogando") {
            passo();
            acumulado -= velocidade;
        }
    }

    desenhar(tempo);
    requestAnimationFrame(loop);
}

function mudarDirecao(tecla) {
    const nova = TECLAS[tecla];
    if (!nova || (estado !== "jogando" && estado !== "transicao")) return;

    const ultima = filaDirecoes.length ? filaDirecoes[filaDirecoes.length - 1] : direcao;
    if (nova.x === -ultima.x && nova.y === -ultima.y) return;
    if (nova.x === ultima.x && nova.y === ultima.y) return;
    if (filaDirecoes.length < 3) filaDirecoes.push(nova);
}

document.addEventListener("keydown", evento => {
    if (TECLAS[evento.key]) {
        evento.preventDefault();
        mudarDirecao(evento.key);
    } else if (evento.code === "Space") {
        evento.preventDefault();
        if (estado === "inicio") iniciarJogo(0);
        else if (estado === "gameover") iniciarJogo(faseAtual);
        else alternarPausa();
    } else if (evento.key === "Escape" && estado !== "inicio") {
        irParaMenu();
    }
});

document.querySelectorAll(".seta").forEach(botao => {
    botao.addEventListener("click", () => mudarDirecao(botao.dataset.dir));
});

let toqueInicio = null;
tela.addEventListener("touchstart", evento => {
    toqueInicio = evento.touches[0];
}, { passive: true });

tela.addEventListener("touchend", evento => {
    if (!toqueInicio) return;
    const fim = evento.changedTouches[0];
    const dx = fim.clientX - toqueInicio.clientX;
    const dy = fim.clientY - toqueInicio.clientY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) mudarDirecao(dx > 0 ? "ArrowRight" : "ArrowLeft");
        else mudarDirecao(dy > 0 ? "ArrowDown" : "ArrowUp");
    }
    toqueInicio = null;
});

document.getElementById("btnIniciar").addEventListener("click", () => iniciarJogo(0));
document.getElementById("btnReiniciar").addEventListener("click", () => iniciarJogo(faseAtual));
document.getElementById("btnMenu").addEventListener("click", irParaMenu);

elRecorde.textContent = recorde;
renderizarMenu();
requestAnimationFrame(loop);
