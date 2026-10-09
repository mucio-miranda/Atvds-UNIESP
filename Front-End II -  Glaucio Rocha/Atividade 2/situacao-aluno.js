const nomeAluno = prompt("Nome do aluno:");
const nota1 = Number(prompt("Nota 1:"));
const nota2 = Number(prompt("Nota 2:"));
const media = (nota1 + nota2) / 2;
const MEDIA_APROVACAO = 7;

let notaRecuperacao = "";
let situacao;

if (media >= MEDIA_APROVACAO) {
  situacao = "APROVADO";
} else if (media >= 5) {
  notaRecuperacao = Number(prompt("Nota da recuperação:"));
  if (notaRecuperacao < 5) {
    situacao = "REPROVADO";
  } else {
    situacao = "APROVADO";
  }
} else {
  situacao = "REPROVADO";
}

console.log("Nome do aluno:", nomeAluno);
console.log("Nota 1:", nota1);
console.log("Nota 2:", nota2);
console.log("Média:", media);
if (notaRecuperacao !== "") {
  console.log("Nota de Recuperação:", notaRecuperacao);
}
console.log("Situação do Aluno:", situacao);
