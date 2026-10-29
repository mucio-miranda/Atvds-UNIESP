'''
9. Qual a percentagem por semana em relação ao total por mês?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def percentual_por_semana(matriz):
    total_mes = sum(sum(linha) for linha in matriz)
    percentuais = []
    for linha in matriz:
        percentuais.append(sum(linha) / total_mes * 100)
    return total_mes, percentuais


total_mes, percentuais = percentual_por_semana(horas_sono)
print("Total de horas no mês:", total_mes)
for i in range(len(semanas)):
    print(f"{semanas[i]}: {sum(horas_sono[i])} horas - {percentuais[i]:.2f}%")
