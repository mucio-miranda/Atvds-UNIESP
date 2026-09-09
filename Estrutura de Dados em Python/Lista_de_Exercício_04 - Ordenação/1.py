'''
1. Escreva uma função em Python para ordenar um vetor de inteiros em ordem crescente usando o
algoritmo de Select Sort.
'''

def selection_sort(vetor):
    tamanho = len(vetor)
    for i in range(tamanho - 1):
        menor = i
        for j in range(i + 1, tamanho):
            if vetor[j] < vetor[menor]:
                menor = j
        if menor != i:
            vetor[i], vetor[menor] = vetor[menor], vetor[i]
    return vetor


numeros = [5, 2, 9, 1, 7, 3]
print("Vetor original:", numeros)
print("Vetor ordenado:", selection_sort(numeros))
