'''
7. Quantos dias da semana tive com o menor tempo de descanso?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def contar_menor(matriz):
    menor = min(min(linha) for linha in matriz)
    quantidade = 0
    for i in range(len(matriz)):
        for j in range(len(matriz[i])):
            if matriz[i][j] == menor:
                quantidade += 1
                print("-", semanas[i], dias[j])
    return menor, quantidade


menor, quantidade = contar_menor(horas_sono)
print("Menor tempo de descanso:", menor, "horas")
print("Quantidade de dias com o menor tempo:", quantidade)
