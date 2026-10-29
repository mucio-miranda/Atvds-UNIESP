'''
1. Qual o dia da semana com maior horário de descanso?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def total_por_dia(matriz):
    totais = []
    for coluna in range(len(matriz[0])):
        soma = 0
        for linha in range(len(matriz)):
            soma += matriz[linha][coluna]
        totais.append(soma)
    return totais


totais = total_por_dia(horas_sono)
maior = max(totais)
resultado = [dias[i] for i in range(len(totais)) if totais[i] == maior]
print("Total de horas por dia:", dict(zip(dias, totais)))
print("Dia(s) com maior horário de descanso:", ", ".join(resultado), "-", maior, "horas")
