'''
5. Dada uma tabela hash de tamanho 17, se as chaves 2, 32, 43, 16, 77, 51, 1, 17, 42, 111 forem
inseridas sequencialmente com a função de hash h(k) = k % 17, mostre o resultado depois de inserir
os valores na ordem dada.
'''

def funcao_hash(chave):
    return chave % tamanho


def inserir(tabela, chave):
    indice = funcao_hash(chave)
    tabela[indice].append(chave)
    return indice


tamanho = 17
tabela = [[] for _ in range(tamanho)]
chaves = [2, 32, 43, 16, 77, 51, 1, 17, 42, 111]

for chave in chaves:
    indice = inserir(tabela, chave)
    print(f"h({chave}) = {chave} % 17 = {indice} -> índice {indice}")

print("\nTabela hash resultante:")
for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)
