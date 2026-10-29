'''
4. Dado os valores 2341, 4234, 2839, 430, 22, 397, 3920, uma tabela hash de tamanho 7, e função de
hash h(x) = x % 7, mostre o resultante depois de inserir os valores na ordem dada.
'''

def funcao_hash(chave):
    return chave % tamanho


def inserir(tabela, chave):
    indice = funcao_hash(chave)
    tabela[indice].append(chave)
    return indice


tamanho = 7
tabela = [[] for _ in range(tamanho)]
chaves = [2341, 4234, 2839, 430, 22, 397, 3920]

for chave in chaves:
    indice = inserir(tabela, chave)
    print(f"h({chave}) = {chave} % 7 = {indice} -> índice {indice}")

print("\nTabela hash resultante:")
for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)
