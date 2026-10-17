// ===== Dados dos candidatos =====
const TITULO = String.raw`
__     _____ _____ _____
\ \   / / _ \_   _| ____|
 \ \ / / | | || | |  _|
  \ V /| |_| || | | |___
   \_/  \___/ |_| |_____|`;

const candidatos = {
    azul: {
        nome: 'BAAL',
        numero: 22,
        retrato: String.raw`
  _/\_/\_/\_
  \________/
  /  _  _  \
 |  (o)(o)  |
 |    <>    |
  \  \__/  /
   \______/
    /    \ `
    },
    vermelho: {
        nome: 'MOLOCH',
        numero: 13,
        retrato: String.raw`
(\          /)
 \\  ____  //
  \\/    \//
   | O  O |
   |  __  |
   | (oo) |
    \_()_/
     \__/   `
    }
};

// ===== Elementos =====
const screen = document.getElementById('screen');
const btnAzul = document.getElementById('btnAzul');
const btnVermelho = document.getElementById('btnVermelho');
const ledAzul = document.getElementById('ledAzul');
const ledVermelho = document.getElementById('ledVermelho');
const btnConfirma = document.getElementById('btnConfirma');
const instrucao = document.getElementById('instrucao');
const impressora = document.getElementById('impressora');
const btnNulo = document.getElementById('btnNulo');
const avisoRetirar = document.getElementById('avisoRetirar');
const cabinet = document.querySelector('.cabinet');
const fogo = document.getElementById('fogo');
const gameOver = document.getElementById('gameOver');
const btnRecomecar = document.getElementById('btnRecomecar');

let linhaStatus;        // linha de status da tela
let roleta;             // painel da roleta do voto nulo
let selecionado = null; // cor do candidato escolhido
let imprimindo = false; // trava os botões enquanto o comprovante sai
let sorteando = false;  // trava os botões enquanto a roleta gira
let foiNulo = false;    // o voto saiu da roleta?
let fimDeJogo = false;  // urna queimou, esperando RECOMEÇAR

// ===== Monta a tela via DOM =====
function criarElemento(tag, classes, texto) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (texto) el.textContent = texto.replace(/^\n/, ''); // remove a quebra inicial das artes ASCII
    return el;
}

function montarTela() {
    screen.appendChild(criarElemento('div', 'ascii titulo-ascii', TITULO));
    screen.appendChild(criarElemento('p', 'subtitulo', '>> OU SOFRA IGUAL <<'));

    const grade = criarElemento('div', 'candidatos');

    for (const cor in candidatos) {
        const c = candidatos[cor];
        const card = criarElemento('div', `candidato ${cor}`);
        card.id = `card-${cor}`;
        card.appendChild(criarElemento('div', 'ascii retrato', c.retrato));
        card.appendChild(criarElemento('p', 'nome', c.nome));
        card.appendChild(criarElemento('p', 'numero', `Nº ${c.numero}`));
        grade.appendChild(card);
    }

    screen.appendChild(grade);

    linhaStatus = criarElemento('p', 'status blink', 'PRESSIONE UM BOTÃO');
    screen.appendChild(linhaStatus);

    roleta = criarElemento('div', 'roleta oculto');
    roleta.appendChild(criarElemento('p', 'roleta-titulo', '~ ROLETA DO VOTO NULO ~'));
    roleta.appendChild(criarElemento('p', 'roleta-nome', ''));
    screen.appendChild(roleta);
}

// ===== Som de fliperama (Web Audio) =====
let audioCtx;

function bip(frequencia, atraso = 0, duracao = 0.2, tipo = 'square') {
    audioCtx = audioCtx || new AudioContext();
    const inicio = audioCtx.currentTime + atraso;
    const osc = audioCtx.createOscillator();
    const ganho = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frequencia, inicio);
    osc.frequency.exponentialRampToValueAtTime(frequencia / 2, inicio + duracao * 0.75);
    ganho.gain.setValueAtTime(0.08, inicio);
    ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
    osc.connect(ganho).connect(audioCtx.destination);
    osc.start(inicio);
    osc.stop(inicio + duracao);
}

// "tchu-tchu-tchu" da urna + estalos da impressora
function somConfirma() {
    [880, 988, 1175, 1319].forEach((f, i) => bip(f, i * 0.09, 0.12));
    for (let i = 0; i < 16; i++) bip(120, 0.5 + i * 0.15, 0.05, 'sawtooth');
}

// ===== Seleção de candidato =====
// acende o card e o LED do candidato
function destacar(cor) {
    document.querySelectorAll('.candidato').forEach(card => card.classList.remove('selecionado'));
    document.getElementById(`card-${cor}`).classList.add('selecionado');

    ledAzul.classList.toggle('aceso', cor === 'azul');
    ledVermelho.classList.toggle('aceso', cor === 'vermelho');
}

function selecionar(cor) {
    if (imprimindo || sorteando) return;
    const c = candidatos[cor];
    selecionado = cor;

    destacar(cor);

    linhaStatus.classList.remove('blink');
    linhaStatus.textContent = `SELECIONADO: ${c.nome} (${c.numero})`;

    // o botão CONFIRMA só aparece depois de escolher alguém
    instrucao.classList.add('oculto');
    btnConfirma.classList.add('visivel');

    bip(cor === 'azul' ? 660 : 440);
}

// ===== Voto nulo: a roleta decide por você =====
function votoNulo() {
    if (imprimindo || sorteando) return;
    sorteando = true;
    selecionado = null;

    btnConfirma.classList.remove('visivel');
    instrucao.classList.add('oculto');
    linhaStatus.classList.add('oculto');
    roleta.classList.remove('oculto');

    const nome = roleta.querySelector('.roleta-nome');
    const cores = ['azul', 'vermelho'];
    const totalPassos = 18 + Math.floor(Math.random() * 6); // sorteio: onde a roleta para
    let passo = 0;
    let intervalo = 50;

    function girar() {
        const cor = cores[passo % 2];
        destacar(cor);
        nome.className = `roleta-nome ${cor}`;
        nome.textContent = `>> ${candidatos[cor].nome} <<`;
        bip(cor === 'azul' ? 660 : 440, 0, 0.06);

        passo++;
        if (passo < totalPassos) {
            intervalo *= 1.13; // desacelera a cada passo
            setTimeout(girar, intervalo);
        } else {
            pararRoleta(cor);
        }
    }

    girar();
}

function pararRoleta(cor) {
    const nome = roleta.querySelector('.roleta-nome');
    nome.classList.add('blink');
    roleta.querySelector('.roleta-titulo').textContent = '~ A ROLETA ESCOLHEU ~';

    // depois de um suspense, o voto é confirmado automaticamente
    setTimeout(() => {
        roleta.classList.add('oculto');
        roleta.querySelector('.roleta-titulo').textContent = '~ ROLETA DO VOTO NULO ~';
        nome.classList.remove('blink');
        linhaStatus.classList.remove('oculto');

        selecionado = cor;
        foiNulo = true;
        sorteando = false;
        confirmar();
    }, 1500);
}

// ===== Confirmação e comprovante =====
function confirmar() {
    if (!selecionado || imprimindo || sorteando) return;
    imprimindo = true;

    btnConfirma.classList.remove('visivel');
    linhaStatus.textContent = 'VOTO CONFIRMADO. IMPRIMINDO...';
    linhaStatus.classList.add('blink');

    somConfirma();
    imprimirComprovante(candidatos[selecionado]);
}

function imprimirComprovante(c) {
    const agora = new Date();
    const protocolo = Math.random().toString(16).slice(2, 10).toUpperCase();

    const papel = criarElemento('div', `papel ${selecionado}`);
    const linhas = [
        ['cab', 'JUSTIÇA ELEITORAL'],
        ['cab', 'DO 3º MUNDO'],
        ['sep', ''],
        ['', 'COMPROVANTE DE VOTO'],
        ['sep', ''],
        ['', `CANDIDATO: ${c.nome}`],
        ['', `NÚMERO:    ${c.numero}`],
        ['', `DATA: ${agora.toLocaleDateString('pt-BR')}`],
        ['', `HORA: ${agora.toLocaleTimeString('pt-BR')}`],
        ['', `PROT: ${protocolo.slice(0, 4)}-${protocolo.slice(4)}`],
        ['sep', ''],
        ...(foiNulo ? [['cab', 'NULO? AQUI NÃO.'], ['cab', 'A ROLETA DECIDIU.'], ['sep', '']] : []),
        ['destaque', 'PARABÉNS!'],
        ['destaque', 'VOCÊ VENDEU SUA'],
        ['destaque', `ALMA PARA ${c.nome}`],
        ['sep', ''],
        ['cab', 'OU SOFRA IGUAL.']
    ];

    linhas.forEach(([classe, texto]) => papel.appendChild(criarElemento('p', classe, texto)));
    papel.appendChild(criarElemento('div', 'codigo-barras'));
    papel.appendChild(criarElemento('p', 'dica', '>> CLIQUE PARA RETIRAR <<'));

    papel.addEventListener('click', () => destacarComprovante(papel));

    // terminou de imprimir: chama a atenção do eleitor
    papel.addEventListener('animationend', (e) => {
        if (e.animationName !== 'imprimir') return;
        papel.classList.add('pronto');
        impressora.classList.add('pronta');
        avisoRetirar.classList.add('visivel');
        linhaStatus.textContent = 'RETIRE SEU COMPROVANTE ▼';
        [523, 659].forEach((f, i) => bip(f, i * 0.15, 0.15, 'triangle'));
    });

    impressora.appendChild(papel);
}

function destacarComprovante(papel) {
    // só dá para retirar depois de sair inteiro da impressora
    if (!papel.classList.contains('pronto') || papel.classList.contains('destacado')) return;
    papel.classList.add('destacado');
    impressora.classList.remove('pronta');
    avisoRetirar.classList.remove('visivel');
    bip(300, 0, 0.15, 'triangle');
    papel.addEventListener('animationend', (e) => {
        if (e.animationName !== 'destacar') return;
        papel.remove();
        queimarUrna();
    }, { once: true });
}

// ===== A urna pega fogo =====
function criarChama() {
    const chama = criarElemento('div', Math.random() < 0.25 ? 'fumaca' : 'chama');
    const tamanho = 30 + Math.random() * 70;
    chama.style.left = `${Math.random() * 100}%`;
    chama.style.bottom = `${Math.random() * 85}%`;
    chama.style.width = `${tamanho}px`;
    chama.style.height = `${tamanho * 1.6}px`;
    chama.style.animationDelay = `0s, ${Math.random() * 0.5}s`;
    fogo.appendChild(chama);
}

function somIncendio() {
    bip(400, 0, 1.5, 'sawtooth'); // urna "desligando"
    for (let i = 0; i < 45; i++) {
        bip(60 + Math.random() * 200, Math.random() * 3.5, 0.04, 'square'); // estalos do fogo
    }
}

function queimarUrna() {
    linhaStatus.textContent = 'ERRO FATAL: ALMA NÃO ENCONTRADA';
    linhaStatus.classList.add('blink');
    screen.classList.add('glitch');
    cabinet.classList.add('tremendo');
    somIncendio();

    // as chamas vão surgindo aos poucos
    let quantidade = 0;
    const acender = setInterval(() => {
        criarChama();
        if (++quantidade >= 28) clearInterval(acender);
    }, 110);

    setTimeout(() => cabinet.classList.add('queimada'), 1200);
    setTimeout(() => screen.classList.add('desligada'), 2000);
    setTimeout(() => {
        fimDeJogo = true;
        gameOver.classList.remove('oculto');
        btnRecomecar.focus();
    }, 3600);
}

function recomecar() {
    if (!fimDeJogo) return;
    fimDeJogo = false;

    gameOver.classList.add('oculto');
    fogo.innerHTML = '';
    cabinet.classList.remove('tremendo', 'queimada');
    screen.classList.remove('glitch', 'desligada'); // a tela "religa" com a animação crt-on
    reiniciar();
    linhaStatus.classList.add('blink');
}

// volta a urna ao estado inicial para o próximo eleitor
function reiniciar() {
    selecionado = null;
    imprimindo = false;
    foiNulo = false;
    document.querySelectorAll('.candidato').forEach(card => card.classList.remove('selecionado'));
    ledAzul.classList.remove('aceso');
    ledVermelho.classList.remove('aceso');
    instrucao.classList.remove('oculto');
    linhaStatus.textContent = 'PRESSIONE UM BOTÃO';
}

// efeito de botão afundando quando acionado pelo teclado
function pressionar(botao) {
    botao.classList.add('pressionado');
    setTimeout(() => botao.classList.remove('pressionado'), 120);
}

// ===== Eventos =====
btnAzul.addEventListener('click', () => selecionar('azul'));
btnVermelho.addEventListener('click', () => selecionar('vermelho'));
btnConfirma.addEventListener('click', confirmar);
btnNulo.addEventListener('click', votoNulo);
btnRecomecar.addEventListener('click', recomecar);

document.addEventListener('keydown', (e) => {
    const tecla = e.key.toLowerCase();
    if (fimDeJogo) {
        if (tecla === 'enter') { e.preventDefault(); recomecar(); }
        return;
    }
    if (tecla === 'enter') {
        e.preventDefault(); // evita "clicar" o botão que estiver em foco
        if (btnConfirma.classList.contains('visivel')) pressionar(btnConfirma);
        confirmar();
    }
    if (tecla === 'a') { pressionar(btnAzul); selecionar('azul'); }
    if (tecla === 'l') { pressionar(btnVermelho); selecionar('vermelho'); }
    if (tecla === 'n') { pressionar(btnNulo); votoNulo(); }
});

montarTela();
