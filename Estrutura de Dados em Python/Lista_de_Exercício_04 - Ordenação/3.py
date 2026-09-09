'''
3. Escreva um programa que encontre o elemento de maior valor em um vetor de inteiros não ordenado
sem usar a função `max()`. Em seguida, encontre o elemento mínimo sem usar a função `min()`.
'''

def encontrar_maior(vetor):
    maior = vetor[0]
    for numero in vetor[1:]:
        if numero > maior:
            maior = numero
    return maior


def encontrar_menor(vetor):
    menor = vetor[0]
    for numero in vetor[1:]:
        if numero < menor:
            menor = numero
    return menor


numeros = [8, 3, 15, 6, 21, 4]
print("Vetor:", numeros)
print("Maior valor:", encontrar_maior(numeros))
print("Menor valor:", encontrar_menor(numeros))
