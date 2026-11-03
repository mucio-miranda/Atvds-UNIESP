function somar() {
    const numero1 = parseFloat(document.getElementById("numero1").value);
    const numero2 = parseFloat(document.getElementById("numero2").value);
    const resultado = document.getElementById("resultado");

    if (isNaN(numero1) || isNaN(numero2)) {
        resultado.value = "Informe os dois números";
        return;
    }

    resultado.value = numero1 + numero2;
}

document.getElementById("btnSomar").addEventListener("click", somar);
