'''
6. Qual o maior tempo de descanso?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def maior_valor(matriz):
    maior = matriz[0][0]
    for linha in matriz:
        for valor in linha:
            if valor > maior:
                maior = valor
    return maior


print("Maior tempo de descanso:", maior_valor(horas_sono), "horas")
