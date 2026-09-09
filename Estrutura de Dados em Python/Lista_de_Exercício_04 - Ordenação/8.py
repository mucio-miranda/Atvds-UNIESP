'''
8. Crie uma função que receba um vetor de números inteiros e retorne a mediana, ou seja, o valor do
meio quando o vetor é ordenado. Certifique-se de que sua função funcione para vetores com
quantidade de elementos ímpares.
'''

def calcular_mediana(vetor):
    ordenado = sorted(vetor)
    posicao_meio = len(ordenado) // 2
    return ordenado[posicao_meio]


numeros = [9, 3, 7, 1, 5]
print("Vetor:", numeros)
print("Vetor ordenado:", sorted(numeros))
print("Mediana:", calcular_mediana(numeros))
