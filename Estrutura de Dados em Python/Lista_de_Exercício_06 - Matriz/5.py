'''
5. Qual o menor tempo de descanso?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def menor_valor(matriz):
    menor = matriz[0][0]
    for linha in matriz:
        for valor in linha:
            if valor < menor:
                menor = valor
    return menor


print("Menor tempo de descanso:", menor_valor(horas_sono), "horas")
