
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin });
const linhas = rl[Symbol.asyncIterator]();
const perguntar = async (texto) => {
  process.stdout.write(texto);
  const { value } = await linhas.next();
  return value ?? "";
};

const MEDIA_APROVACAO = 7;
const MEDIA_RECUPERACAO = 5;

async function main() {
  let nomeAluno = await perguntar("Nome do aluno: ");
  let nota1 = parseFloat((await perguntar("Nota 1: ")).replace(",", "."));
  let nota2 = parseFloat((await perguntar("Nota 2: ")).replace(",", "."));

  const media = (nota1 + nota2) / 2;
  let notaRecuperacao = null;
  let situacao;

  if (media >= MEDIA_APROVACAO) {
    situacao = "APROVADO";
  } else if (media >= MEDIA_RECUPERACAO) {
    situacao = "RECUPERAÇÃO";
    notaRecuperacao = parseFloat((await perguntar("Nota da recuperação: ")).replace(",", "."));
    if (notaRecuperacao < MEDIA_RECUPERACAO) {
      situacao = "REPROVADO";
    } else {
      situacao = "APROVADO";
    }
  } else {
    situacao = "REPROVADO";
  }

  rl.close();

  console.log("\n----- Resultado -----");
  console.log("Nome do aluno:", nomeAluno);
  console.log("Nota 1:", nota1);
  console.log("Nota 2:", nota2);
  console.log("Média:", media.toFixed(2));
  if (notaRecuperacao !== null) {
    console.log("Nota de Recuperação:", notaRecuperacao);
  }
  console.log("Situação do Aluno:", situacao);
}

main();
