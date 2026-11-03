const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const placar = document.getElementById("placar");
const telaGameOver = document.getElementById("gameover");
const pontuacaoFinal = document.getElementById("pontuacaoFinal");

const tamanho = 20;
const colunas = canvas.width / tamanho;
const linhas = canvas.height / tamanho;

let cobra;
let direcao;
let proximaDirecao;
let comida;
let pontos;
let intervalo;

function iniciar() {
    cobra = [{ x: 10, y: 10 }];
    direcao = { x: 1, y: 0 };
    proximaDirecao = direcao;
    pontos = 0;
    placar.textContent = "Pontuação: 0";
    telaGameOver.style.display = "none";
    gerarComida();

    clearInterval(intervalo);
    intervalo = setInterval(atualizar, 120);
}

function gerarComida() {
    do {
        comida = {
            x: Math.floor(Math.random() * colunas),
            y: Math.floor(Math.random() * linhas)
        };
    } while (cobra.some(parte => parte.x === comida.x && parte.y === comida.y));
}

function atualizar() {
    direcao = proximaDirecao;

    const cabeca = {
        x: (cobra[0].x + direcao.x + colunas) % colunas,
        y: (cobra[0].y + direcao.y + linhas) % linhas
    };

    if (cobra.some(parte => parte.x === cabeca.x && parte.y === cabeca.y)) {
        fimDeJogo();
        return;
    }

    cobra.unshift(cabeca);

    if (cabeca.x === comida.x && cabeca.y === comida.y) {
        pontos++;
        placar.textContent = "Pontuação: " + pontos;
        gerarComida();
    } else {
        cobra.pop();
    }

    desenhar();
}

function desenhar() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.fillRect(comida.x * tamanho, comida.y * tamanho, tamanho - 1, tamanho - 1);

    ctx.fillStyle = "blue";
    cobra.forEach(parte => {
        ctx.fillRect(parte.x * tamanho, parte.y * tamanho, tamanho - 1, tamanho - 1);
    });
}

function fimDeJogo() {
    clearInterval(intervalo);
    pontuacaoFinal.textContent = "Pontuação: " + pontos;
    telaGameOver.style.display = "flex";
}

document.addEventListener("keydown", evento => {
    const teclas = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }
    };
    const nova = teclas[evento.key];
    if (!nova) return;

    evento.preventDefault();

    if (nova.x === -direcao.x && nova.y === -direcao.y) return;
    proximaDirecao = nova;
});

document.getElementById("btnReiniciar").addEventListener("click", iniciar);

iniciar();
