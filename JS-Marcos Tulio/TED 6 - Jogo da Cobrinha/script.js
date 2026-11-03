const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const tela = document.getElementById("tela");

const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elNivel = document.getElementById("nivel");
const elPontuacaoFinal = document.getElementById("pontuacaoFinal");
const elNovoRecorde = document.getElementById("novoRecorde");

const telaInicio = document.getElementById("inicio");
const telaPausa = document.getElementById("pausa");
const telaGameOver = document.getElementById("gameover");

const TAMANHO = 24;
const COLUNAS = canvas.width / TAMANHO;
const LINHAS = canvas.height / TAMANHO;

const AZUL = "#38bdf8";
const AZUL_ESCURO = "#2563eb";
const VERMELHO = "#f43f5e";

const TECLAS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
};

let cobra, direcao, filaDirecoes, comida, pontos, nivel;
let velocidade, acumulado, ultimoTempo;
let estado = "inicio";
let particulas = [];
let tremor = 0;
let recorde = lerRecorde();

elRecorde.textContent = recorde;

function lerRecorde() {
    try {
        return Number(localStorage.getItem("neonSnakeRecorde")) || 0;
    } catch {
        return 0;
    }
}

function salvarRecorde(valor) {
    try {
        localStorage.setItem("neonSnakeRecorde", valor);
    } catch {}
}

function iniciar() {
    const meio = Math.floor(COLUNAS / 2);
    cobra = [{ x: meio, y: meio }];
    direcao = { x: 1, y: 0 };
    filaDirecoes = [];
    pontos = 0;
    nivel = 1;
    velocidade = 140;
    acumulado = 0;
    particulas = [];
    atualizarPlacar();
    gerarComida();

    telaInicio.classList.remove("ativo");
    telaGameOver.classList.remove("ativo");
    telaPausa.classList.remove("ativo");
    estado = "jogando";
}

function gerarComida() {
    do {
        comida = {
            x: Math.floor(Math.random() * COLUNAS),
            y: Math.floor(Math.random() * LINHAS)
        };
    } while (cobra.some(parte => parte.x === comida.x && parte.y === comida.y));
}

function atualizarPlacar() {
    elPontos.textContent = pontos;
    elNivel.textContent = nivel;
}

function passo() {
    if (filaDirecoes.length) direcao = filaDirecoes.shift();

    const cabeca = {
        x: (cobra[0].x + direcao.x + COLUNAS) % COLUNAS,
        y: (cobra[0].y + direcao.y + LINHAS) % LINHAS
    };

    if (cobra.some(parte => parte.x === cabeca.x && parte.y === cabeca.y)) {
        fimDeJogo();
        return;
    }

    cobra.unshift(cabeca);

    if (cabeca.x === comida.x && cabeca.y === comida.y) {
        pontos++;
        if (pontos % 5 === 0) {
            nivel++;
            velocidade = Math.max(60, velocidade - 12);
        }
        explodir(comida.x, comida.y, VERMELHO);
        atualizarPlacar();
        gerarComida();
    } else {
        cobra.pop();
    }
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
        salvarRecorde(recorde);
        elRecorde.textContent = recorde;
    }

    elPontuacaoFinal.textContent = pontos;
    elNovoRecorde.style.display = bateuRecorde ? "block" : "none";
    setTimeout(() => telaGameOver.classList.add("ativo"), 500);
}

function alternarPausa() {
    if (estado === "jogando") {
        estado = "pausado";
        telaPausa.classList.add("ativo");
    } else if (estado === "pausado") {
        estado = "jogando";
        telaPausa.classList.remove("ativo");
    }
}

function quadradoArredondado(x, y, tamanho, raio) {
    ctx.beginPath();
    ctx.roundRect(x, y, tamanho, tamanho, raio);
    ctx.fill();
}

function desenharGrade() {
    ctx.fillStyle = "#070b1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    for (let x = 0; x < COLUNAS; x++) {
        for (let y = 0; y < LINHAS; y++) {
            ctx.beginPath();
            ctx.arc(x * TAMANHO + TAMANHO / 2, y * TAMANHO + TAMANHO / 2, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function desenharComida(tempo) {
    const pulso = Math.sin(tempo / 180) * 2.5;
    const margem = 3 - pulso / 2;
    const tamanho = TAMANHO - margem * 2;

    ctx.save();
    ctx.shadowColor = VERMELHO;
    ctx.shadowBlur = 20 + pulso * 4;
    ctx.fillStyle = VERMELHO;
    quadradoArredondado(comida.x * TAMANHO + margem, comida.y * TAMANHO + margem, tamanho, 6);
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
    const frente = 4;
    const lado = 4.5;

    ctx.fillStyle = "#0f172a";
    [-1, 1].forEach(s => {
        const ox = direcao.x * frente + direcao.y * lado * s;
        const oy = direcao.y * frente + direcao.x * lado * s;
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

    desenharGrade();
    if (cobra) {
        desenharComida(tempo);
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
    if (!nova || estado !== "jogando") return;

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
        if (estado === "inicio" || estado === "gameover") iniciar();
        else alternarPausa();
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

document.getElementById("btnIniciar").addEventListener("click", iniciar);
document.getElementById("btnReiniciar").addEventListener("click", iniciar);

requestAnimationFrame(loop);
