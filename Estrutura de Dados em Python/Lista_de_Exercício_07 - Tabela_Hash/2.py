'''
2. Diante da lista de Valores[120, 123, 145, 90, 39, 45, 23, 220], qual o valor do índice para 145 que tá
apontando para a tabela hash?
'''

def funcao_hash(valor, tamanho):
    return valor % tamanho


def montar_tabela(valores):
    tamanho = len(valores)
    tabela = [[] for _ in range(tamanho)]
    for valor in valores:
        tabela[funcao_hash(valor, tamanho)].append(valor)
    return tabela


valores = [120, 123, 145, 90, 39, 45, 23, 220]
tabela = montar_tabela(valores)

for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)

indice_145 = funcao_hash(145, len(valores))
print(f"\nh(145) = 145 % {len(valores)} = {indice_145}")
print("O valor 145 está apontando para o índice", indice_145, "da tabela hash.")
