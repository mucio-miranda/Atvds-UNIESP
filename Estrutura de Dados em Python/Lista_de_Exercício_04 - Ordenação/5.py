'''
5. Implemente uma função que aceite um vetor de números inteiros e remova todos os elementos
duplicados, retornando o vetor resultante sem duplicatas. Não é permitido utilizar a função "set()"
'''

def remover_duplicados(vetor):
    resultado = []
    for numero in vetor:
        if numero not in resultado:
            resultado.append(numero)
    return resultado


numeros = [1, 3, 2, 3, 5, 1, 4, 2, 6]
print("Vetor original:", numeros)
print("Vetor sem duplicatas:", remover_duplicados(numeros))
