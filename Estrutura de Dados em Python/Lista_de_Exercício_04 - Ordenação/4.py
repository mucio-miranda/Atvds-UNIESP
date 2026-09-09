'''
4. Crie uma função que recebe um vetor de números inteiros e retorna o segundo menor número.
Certifique-se de que sua função funcione mesmo se houver números duplicados no vetor.
'''

def segundo_menor(vetor):
    ordenado = sorted(vetor)
    menor = ordenado[0]
    for numero in ordenado[1:]:
        if numero > menor:
            return numero
    return None


numeros = [4, 2, 2, 7, 1, 1, 9]
print("Vetor:", numeros)
print("Segundo menor número:", segundo_menor(numeros))
