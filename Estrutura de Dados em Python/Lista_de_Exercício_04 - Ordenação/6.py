'''
6. Escreva um programa que ordene um vetor de inteiros em ordem decrescente e, em seguida, conte
quantos números pares e quantos números ímpares existem no vetor ordenado.
'''

def selection_sort_decrescente(vetor):
    tamanho = len(vetor)
    for i in range(tamanho - 1):
        maior = i
        for j in range(i + 1, tamanho):
            if vetor[j] > vetor[maior]:
                maior = j
        if maior != i:
            vetor[i], vetor[maior] = vetor[maior], vetor[i]
    return vetor


numeros = [7, 2, 9, 4, 1, 8, 6, 3]
ordenado = selection_sort_decrescente(numeros)
print("Vetor ordenado (decrescente):", ordenado)

pares = 0
impares = 0
for numero in ordenado:
    if numero % 2 == 0:
        pares += 1
    else:
        impares += 1

print("Quantidade de números pares:", pares)
print("Quantidade de números ímpares:", impares)
