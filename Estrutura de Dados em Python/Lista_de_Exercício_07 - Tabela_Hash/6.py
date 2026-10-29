'''
6. Desenhe uma tabela de hash resultante da introdução das chaves 12, 44, 13, 88, 23, 94, 11, 39, 20,
16 e 5, usando a função de hash h(k) = (2k + 5)%11.
'''

def funcao_hash(chave):
    return (2 * chave + 5) % tamanho


def inserir(tabela, chave):
    indice = funcao_hash(chave)
    tabela[indice].append(chave)
    return indice


tamanho = 11
tabela = [[] for _ in range(tamanho)]
chaves = [12, 44, 13, 88, 23, 94, 11, 39, 20, 16, 5]

for chave in chaves:
    indice = inserir(tabela, chave)
    print(f"h({chave}) = (2 * {chave} + 5) % 11 = {indice} -> índice {indice}")

print("\nTabela hash resultante:")
for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)
