'''
7. Crie uma função que aceite um vetor de números inteiros e retorne o terceiro maior número.
Certifique-se de que sua função funcione mesmo se houver números duplicados no vetor.
'''

def terceiro_maior(vetor):
    ordenado = sorted(vetor, reverse=True)
    distintos = []
    for numero in ordenado:
        if numero not in distintos:
            distintos.append(numero)
        if len(distintos) == 3:
            return distintos[2]
    return None


numeros = [10, 8, 8, 15, 15, 12, 4]
print("Vetor:", numeros)
print("Terceiro maior número:", terceiro_maior(numeros))
