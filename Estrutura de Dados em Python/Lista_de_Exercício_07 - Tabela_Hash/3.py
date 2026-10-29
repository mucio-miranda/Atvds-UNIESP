'''
3. Verifique se a lista de caracteres apresenta colisão quando utilizamos uma tabela hash.
Valore['U','N','I','E','S','P','F','A','C','U','L','D','A','D','E']?
'''

def funcao_hash(caractere, tamanho):
    return ord(caractere) % tamanho


def verificar_colisao(caracteres):
    tamanho = len(caracteres)
    tabela = [[] for _ in range(tamanho)]
    colisoes = []
    for caractere in caracteres:
        indice = funcao_hash(caractere, tamanho)
        if tabela[indice]:
            colisoes.append((caractere, indice, list(tabela[indice])))
        tabela[indice].append(caractere)
    return tabela, colisoes


caracteres = ['U', 'N', 'I', 'E', 'S', 'P', 'F', 'A', 'C', 'U', 'L', 'D', 'A', 'D', 'E']
tabela, colisoes = verificar_colisao(caracteres)

print("Tabela hash (tamanho", len(caracteres), "- h(c) = ord(c) %", len(caracteres), "):")
for indice, posicao in enumerate(tabela):
    print(indice, "->", posicao)

if colisoes:
    print("\nA lista apresenta colisão!")
    for caractere, indice, existentes in colisoes:
        print(f"'{caractere}' (ord = {ord(caractere)}) colidiu no índice {indice} com {existentes}")
else:
    print("\nA lista não apresenta colisão.")
