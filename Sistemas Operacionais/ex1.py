"""
Trabalho: Explorando os Serviços do Sistema Operacional

5 operações usando 3 categorias de serviços do SO:
    DIRETÓRIOS -> 1. criar diretório   3. listar diretório
    ARQUIVOS   -> 2. escrever arquivo  4. ler arquivo
    SISTEMA    -> 5. informações do sistema
"""

import os
import platform


# ---------------- DIRETÓRIOS ----------------

def criar_diretorio(nome):
    os.makedirs(nome, exist_ok=True)
    print(f"1. Diretório '{nome}' criado.")


def listar_diretorio(nome):
    print(f"3. Conteúdo de '{nome}': {os.listdir(nome)}")


# ---------------- ARQUIVOS ----------------

def escrever_arquivo(caminho, texto):
    with open(caminho, "w", encoding="utf-8") as arq:
        arq.write(texto)
    print(f"2. Arquivo '{caminho}' criado.")


def ler_arquivo(caminho):
    with open(caminho, "r", encoding="utf-8") as arq:
        print(f"4. Conteúdo do arquivo: {arq.read()}")


# ---------------- SISTEMA ----------------

def info_sistema():
    print("5. Informações do sistema:")
    print(f"   Sistema operacional: {platform.system()} {platform.release()}")
    print(f"   Arquitetura: {platform.machine()}")
    print(f"   Núcleos de CPU: {os.cpu_count()}")


# ---------------- EXECUÇÃO ----------------

pasta = "minha_pasta"
arquivo = os.path.join(pasta, "teste.txt")

criar_diretorio(pasta)
escrever_arquivo(arquivo, "Olá, Sistema Operacional!")
listar_diretorio(pasta)
ler_arquivo(arquivo)
info_sistema()
