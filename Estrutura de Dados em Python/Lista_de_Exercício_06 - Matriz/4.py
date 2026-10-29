'''
4. Qual a semana com menor horário de descanso?
'''

dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
semanas = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

horas_sono = [
    [8, 6, 7, 8, 6],
    [5, 5, 6, 7, 8],
    [6, 7, 8, 6, 5],
    [7, 5, 9, 7, 4],
]


def total_por_semana(matriz):
    totais = []
    for linha in matriz:
        totais.append(sum(linha))
    return totais


totais = total_por_semana(horas_sono)
menor = min(totais)
resultado = [semanas[i] for i in range(len(totais)) if totais[i] == menor]
print("Total de horas por semana:", dict(zip(semanas, totais)))
print("Semana(s) com menor horário de descanso:", ", ".join(resultado), "-", menor, "horas")
