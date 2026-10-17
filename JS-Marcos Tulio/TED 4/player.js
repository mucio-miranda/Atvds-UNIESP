// ===== Miniplayer "Rádio Protesto" (YouTube IFrame API) =====
// Cada faixa tem mais de um vídeo: se um bloquear o player embutido, tenta o próximo.
const playlist = [
    { artista: 'CAZUZA', musica: 'IDEOLOGIA', ids: ['aF-8PYOcyc4', 'XoiF-pDzod4', 'hfsxcebq5Rc'] },
    { artista: 'LEGIÃO URBANA', musica: 'QUE PAÍS É ESTE', ids: ['sZyAcK2xD90', 'M3mEqIDRqvU', 'z6uM7FehywQ'] },
    { artista: 'ULTRAJE A RIGOR', musica: 'INÚTIL', ids: ['9aHoWTs6xE0', '_sl08Zp8ZPQ', '1GhbNozeP0g'] },
    { artista: 'TITÃS', musica: 'IGREJA', ids: ['ZcuIkL6qoF4', 'jvLfW0vWt64'] },
    { artista: 'CAZUZA', musica: 'BRASIL', ids: ['kCUZr_K8et8', 'AkoP48N1oYw', 'BpfhRnjRvcY'] },
    { artista: 'PARALAMAS DO SUCESSO', musica: 'LUÍS INÁCIO (300 PICARETAS)', ids: ['Jrw6m4xejQY', 'yrH0E6JtGQw'] },
    { artista: "RACIONAIS MC'S", musica: 'DIÁRIO DE UM DETENTO', ids: ['BElpPiZR-aQ', 'dGFxdmuDA4A', 'K_A4BweRg4A'] },
    { artista: 'PLANET HEMP', musica: 'A CULPA É DE QUEM?', ids: ['pdGa70W52F0', 'HPFIZuXmiTE', '45NS7LNFZkY'] },
    { artista: 'CHICO SCIENCE & NAÇÃO ZUMBI', musica: 'BANDITISMO POR UMA QUESTÃO DE CLASSE', ids: ['W0pW5h532_w', '2Ohe3XZHEBI'] }
];

const mpLed = document.getElementById('mpLed');
const mpContador = document.getElementById('mpContador');
const mpLetreiro = document.getElementById('mpLetreiro');
const mpBarra = document.getElementById('mpBarra');
const mpTempo = document.getElementById('mpTempo');
const mpDuracao = document.getElementById('mpDuracao');
const mpPlay = document.getElementById('mpPlay');
const mpAnterior = document.getElementById('mpAnterior');
const mpProxima = document.getElementById('mpProxima');

let player = null;      // criado só no primeiro play
let carregandoApi = null;
let faixaAtual = 0;
let tentativa = 0;      // qual vídeo da faixa está sendo tentado
let falhasSeguidas = 0; // evita ficar pulando para sempre se nada carregar
let tocando = false;
let timerProgresso;

function mostrarFaixa(mensagem) {
    const f = playlist[faixaAtual];
    mpContador.textContent = `${faixaAtual + 1}/${playlist.length}`;
    mpLetreiro.textContent = mensagem || `${f.artista} - ${f.musica}`;
}

function formatarTempo(segundos) {
    const s = Math.floor(segundos || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function atualizarProgresso() {
    if (!player || !player.getDuration) return;
    const atual = player.getCurrentTime();
    const total = player.getDuration();
    mpBarra.style.width = total ? `${(atual / total) * 100}%` : '0%';
    mpTempo.textContent = formatarTempo(atual);
    mpDuracao.textContent = formatarTempo(total);
}

function definirTocando(estado) {
    tocando = estado;
    mpPlay.innerHTML = estado ? '&#10074;&#10074;' : '&#9654;';
    mpPlay.setAttribute('aria-label', estado ? 'Pausar' : 'Tocar');
    mpLed.classList.toggle('aceso', estado);
    mpLetreiro.classList.toggle('rolando', estado);

    clearInterval(timerProgresso);
    if (estado) timerProgresso = setInterval(atualizarProgresso, 500);
}

// injeta o script do YouTube apenas uma vez
function carregarApiYouTube() {
    if (!carregandoApi) {
        carregandoApi = new Promise(resolve => {
            window.onYouTubeIframeAPIReady = resolve;
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        });
    }
    return carregandoApi;
}

async function criarPlayer() {
    mostrarFaixa('SINTONIZANDO...');
    await carregarApiYouTube();

    player = new YT.Player('ytPlayer', {
        width: 200,
        height: 200,
        videoId: playlist[faixaAtual].ids[tentativa],
        playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            ...(location.protocol.startsWith('http') ? { origin: location.origin } : {})
        },
        events: {
            onReady: (e) => { mostrarFaixa(); e.target.playVideo(); },
            onStateChange: aoMudarEstado,
            onError: aoDarErro
        }
    });
}

function aoMudarEstado(e) {
    if (e.data === YT.PlayerState.PLAYING) {
        falhasSeguidas = 0;
        mostrarFaixa();
        definirTocando(true);
    } else if (e.data === YT.PlayerState.PAUSED) {
        definirTocando(false);
    } else if (e.data === YT.PlayerState.ENDED) {
        trocarFaixa(faixaAtual + 1);
    }
}

// vídeo bloqueado/removido: tenta o reserva, depois pula de faixa
function aoDarErro() {
    const ids = playlist[faixaAtual].ids;
    tentativa++;

    if (tentativa < ids.length) {
        player.loadVideoById(ids[tentativa]);
        return;
    }

    falhasSeguidas++;
    if (falhasSeguidas >= playlist.length) {
        definirTocando(false);
        mostrarFaixa('SEM SINAL :( ABRA PELO LIVE SERVER');
        return;
    }

    mostrarFaixa('FAIXA CENSURADA! PULANDO...');
    setTimeout(() => trocarFaixa(faixaAtual + 1), 1200);
}

function trocarFaixa(indice) {
    faixaAtual = (indice + playlist.length) % playlist.length;
    tentativa = 0;
    mpBarra.style.width = '0%';
    mpTempo.textContent = '0:00';
    mpDuracao.textContent = '0:00';
    mostrarFaixa();

    // antes do primeiro play só troca o nome no visor, sem tocar nada
    if (player && player.loadVideoById) player.loadVideoById(playlist[faixaAtual].ids[0]);
}

function playPause() {
    if (!player) {
        criarPlayer();
        return;
    }
    if (tocando) player.pauseVideo();
    else player.playVideo();
}

mpPlay.addEventListener('click', playPause);
mpAnterior.addEventListener('click', () => trocarFaixa(faixaAtual - 1));
mpProxima.addEventListener('click', () => trocarFaixa(faixaAtual + 1));

mostrarFaixa();
