function calcularArea() {
    // Pega os valores digitados (troca vírgula por ponto, ex: 2,5 -> 2.5)
    const base = parseFloat(document.getElementById("base").value.replace(",", "."));
    const altura = parseFloat(document.getElementById("altura").value.replace(",", "."));
    const resultado = document.getElementById("resultado");

    // Validação
    if (isNaN(base) || isNaN(altura) || base <= 0 || altura <= 0) {
        alert("Por favor, informe uma base e uma altura válidas.");
        return;
    }

    // Fórmula: Área = (base * altura) / 2
    const area = (base * altura) / 2;

    // Mostra o resultado na tela
    resultado.style.display = "block";
    resultado.innerHTML = `Área: <strong>${area.toFixed(2)}</strong>`;
}

// Liga o botão à função
document.getElementById("btnCalcular").addEventListener("click", calcularArea);
