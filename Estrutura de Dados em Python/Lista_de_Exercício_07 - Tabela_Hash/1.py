'''
1. Verifique se a lista de valores apresenta colisão quando utilizamos uma tabela hash.
Valore[120, 123, 145, 90, 39, 45, 23, 220]?
'''

def funcao_hash(valor, tamanho):
    return valor % tamanho


def verificar_colisao(valores):
    tamanho = len(valores)
    tabela = [[] for _ in range(tamanho)]
    colisoes = []
    for valor in valores:
        indice = funcao_hash(valor, tamanho)
        if tabela[indice]:
            colisoes.append((valor, indice, list(tabela[indice])))
        tabela[indice].append(valor)
    return tabela, colisoes


valores = [120, 123, 145, 90, 39, 45, 23, 220]
tabela, colisoes = verificar_colisao(valores)

print("Tabela hash (tamanho", len(valores), "- h(x) = x %", len(valores), "):")
for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)

if colisoes:
    print("\nA lista apresenta colisão!")
    for valor, indice, existentes in colisoes:
        print(f"Valor {valor} colidiu no índice {indice} com {existentes}")
else:
    print("\nA lista não apresenta colisão.")
