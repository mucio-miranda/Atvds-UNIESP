'''
2. Escreva uma função em Python para ordenar um vetor de inteiros, ele deve receber um parâmetro que
serve como chave para realizar a ordenação crescente ou decrescente.
'''

def selection_sort(vetor, ordem="crescente"):
    tamanho = len(vetor)
    for i in range(tamanho - 1):
        escolhido = i
        for j in range(i + 1, tamanho):
            if ordem == "crescente":
                if vetor[j] < vetor[escolhido]:
                    escolhido = j
            else:
                if vetor[j] > vetor[escolhido]:
                    escolhido = j
        if escolhido != i:
            vetor[i], vetor[escolhido] = vetor[escolhido], vetor[i]
    return vetor


numeros = [5, 2, 9, 1, 7, 3]
print("Vetor original:", numeros)
print("Ordem crescente:", selection_sort(numeros.copy(), "crescente"))
print("Ordem decrescente:", selection_sort(numeros.copy(), "decrescente"))
