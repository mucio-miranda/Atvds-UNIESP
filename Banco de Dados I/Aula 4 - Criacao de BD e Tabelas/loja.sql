/*

USE master;
GO

CREATE DATABASE Loja
ON PRIMARY (
    NAME = Loja_dados,
    FILENAME = 'C:\Banco_Dados\Loja.mdf',
    SIZE = 5MB,
    MAXSIZE = 10MB,
    FILEGROWTH = 1MB
)
LOG ON (
    NAME = Loja_log,
    FILENAME = 'C:\Banco_Dados\Loja_log.ldf',
    SIZE = 2MB,
    MAXSIZE = 5MB,
    FILEGROWTH = 1MB
);
GO

USE Loja;
GO

CREATE TABLE TblPais (
    sigla   CHAR(3)     NOT NULL,
    nome    VARCHAR(15) NOT NULL,
    CONSTRAINT PK_pais      PRIMARY KEY (sigla),
    CONSTRAINT UN_pais_nome UNIQUE (nome)
);
GO

CREATE TABLE TblCidade (
    codigo  SMALLINT    NOT NULL,
    nome    VARCHAR(30) NOT NULL,
    uf      CHAR(2)     NOT NULL,
    pais    CHAR(3)     NOT NULL,
    CONSTRAINT PK_cidade      PRIMARY KEY (codigo),
    CONSTRAINT FK_cidade_pais FOREIGN KEY (pais) REFERENCES TblPais (sigla)
);
GO

CREATE TABLE TblFuncao (
    codigo   TINYINT     NOT NULL,
    nome     VARCHAR(30) NOT NULL,
    gratific SMALLMONEY  NOT NULL,
    CONSTRAINT PK_funcao      PRIMARY KEY (codigo),
    CONSTRAINT UN_funcao_nome UNIQUE (nome)
);
GO

CREATE TABLE TblTipo (
    codigo    TINYINT     NOT NULL,
    nome      VARCHAR(15) NOT NULL,
    descricao TEXT        NULL,
    CONSTRAINT PK_tipo        PRIMARY KEY (codigo),
    CONSTRAINT UN_tipo_nome   UNIQUE (nome),
    CONSTRAINT CK_tipo_codigo CHECK (LEN(codigo) < 3)
);
GO

CREATE TABLE TblCliente (
    codigo   CHAR(5)     NOT NULL,
    nome     VARCHAR(40) NOT NULL,
    tipo     CHAR(1)     NOT NULL,
    contato  VARCHAR(30) NULL,
    cargo    VARCHAR(30) NULL,
    endereco VARCHAR(50) NOT NULL,
    cidade   SMALLINT    NOT NULL,
    cep      VARCHAR(10) NULL,
    fone     VARCHAR(16) NULL,
    fax      VARCHAR(16) NULL,
    obs      TEXT        NULL,
    CONSTRAINT PK_cliente        PRIMARY KEY (codigo),
    CONSTRAINT CK_cliente_codigo CHECK (codigo LIKE '[A-Z][A-Z][A-Z][A-Z][A-Z]'),
    CONSTRAINT CK_cliente_tipo   CHECK (tipo LIKE '[FJ]'),
    CONSTRAINT FK_cliente_cidade FOREIGN KEY (cidade) REFERENCES TblCidade (codigo)
);
GO

CREATE TABLE TblSetor (
    sigla    CHAR(3)     NOT NULL,
    nome     VARCHAR(30) NOT NULL,
    ramal    SMALLINT    NULL,
    superior CHAR(3)     NULL,
    chefe    TINYINT     NULL,
    CONSTRAINT PK_setor          PRIMARY KEY (sigla),
    CONSTRAINT CK_setor_sigla    CHECK (sigla LIKE '[A-Z][A-Z][A-Z]'),
    CONSTRAINT UN_setor_nome     UNIQUE (nome),
    CONSTRAINT CK_setor_ramal    CHECK (LEN(ramal) < 4),
    CONSTRAINT CK_setor_superior CHECK (superior LIKE '[A-Z][A-Z][A-Z]'),
    CONSTRAINT FK_setor_setor    FOREIGN KEY (superior) REFERENCES TblSetor (sigla),
    CONSTRAINT UN_setor_chefe    UNIQUE (chefe)
);
GO

CREATE TABLE TblFuncionario (
    codigo   TINYINT       NOT NULL,
    nome     VARCHAR(40)   NOT NULL,
    sexo     CHAR(1)       NOT NULL,
    estcivil CHAR(1)       NOT NULL,
    rg       VARCHAR(15)   NOT NULL,
    cpf      VARCHAR(12)   NOT NULL,
    trat     VARCHAR(4)    NOT NULL,
    datanasc SMALLDATETIME NOT NULL,
    [natural] SMALLINT      NOT NULL,
    dataadm  SMALLDATETIME NOT NULL,
    endereco VARCHAR(40)   NOT NULL,
    compl    VARCHAR(20)   NULL,
    bairro   VARCHAR(20)   NULL,
    reside   SMALLINT      NOT NULL,
    cep      VARCHAR(10)   NULL,
    fone     VARCHAR(10)   NULL,
    celular  VARCHAR(10)   NULL,
    funcao   TINYINT       NULL,
    setor    CHAR(3)       NOT NULL,
    salario  SMALLMONEY    NOT NULL,
    email    VARCHAR(40)   NOT NULL,
    obs      TEXT          NULL,
    CONSTRAINT PK_funcionario         PRIMARY KEY (codigo),
    CONSTRAINT CK_funcionario_codigo  CHECK (LEN(codigo) < 3),
    CONSTRAINT CK_funcionario_sexo    CHECK (sexo LIKE '[FM]'),
    CONSTRAINT CK_funcionario_estcivil CHECK (estcivil LIKE '[SCDVO]'),
    CONSTRAINT UN_funcionario_rg      UNIQUE (rg),
    CONSTRAINT UN_funcionario_cpf     UNIQUE (cpf),
    CONSTRAINT CK_funcionario_trat    CHECK (trat IN ('Sr', 'Sra', 'Srta', 'Dr', 'Dra')),
    CONSTRAINT FK_funcionario_cidade1 FOREIGN KEY ([natural]) REFERENCES TblCidade (codigo),
    CONSTRAINT FK_funcionario_cidade2 FOREIGN KEY (reside) REFERENCES TblCidade (codigo),
    CONSTRAINT FK_funcionario_funcao  FOREIGN KEY (funcao) REFERENCES TblFuncao (codigo),
    CONSTRAINT FK_funcionario_setor   FOREIGN KEY (setor) REFERENCES TblSetor (sigla)
);
GO

ALTER TABLE TblSetor
    ADD CONSTRAINT FK_setor_chefe FOREIGN KEY (chefe) REFERENCES TblFuncionario (codigo);
GO

CREATE TABLE TblProduto (
    codigo    SMALLINT    NOT NULL,
    nome      VARCHAR(40) NOT NULL,
    descricao VARCHAR(45) NOT NULL,
    apresent  VARCHAR(30) NOT NULL,
    venda     SMALLMONEY  NOT NULL,
    custo     SMALLMONEY  NOT NULL,
    quantest  SMALLINT    NOT NULL,
    estmin    SMALLINT    NULL,
    tipo      TINYINT     NOT NULL,
    situacao  CHAR(1)     NULL,
    CONSTRAINT PK_produto          PRIMARY KEY (codigo),
    CONSTRAINT UN_produto_nome     UNIQUE (nome),
    CONSTRAINT FK_produto_tipo     FOREIGN KEY (tipo) REFERENCES TblTipo (codigo),
    CONSTRAINT CK_produto_situacao CHECK (situacao LIKE '[NDS]')
);
GO

CREATE TABLE TblPedido (
    codigo      SMALLINT      NOT NULL,
    cliente     CHAR(5)       NOT NULL,
    vendedor    TINYINT       NOT NULL,
    datapedid   SMALLDATETIME NOT NULL,
    datafatura  SMALLDATETIME NULL,
    CONSTRAINT PK_pedido             PRIMARY KEY (codigo),
    CONSTRAINT CK_pedido_codigo      CHECK (LEN(codigo) < 6),
    CONSTRAINT FK_pedido_cliente     FOREIGN KEY (cliente) REFERENCES TblCliente (codigo),
    CONSTRAINT FK_pedido_funcionario FOREIGN KEY (vendedor) REFERENCES TblFuncionario (codigo)
);
GO

CREATE TABLE TblItens (
    pedido   SMALLINT     NOT NULL,
    produto  SMALLINT     NOT NULL,
    preco    SMALLMONEY   NOT NULL,
    quant    SMALLINT     NOT NULL,
    desconto DECIMAL(4,1) NOT NULL,
    CONSTRAINT PK_itens         PRIMARY KEY (pedido, produto),
    CONSTRAINT FK_itens_pedido  FOREIGN KEY (pedido) REFERENCES TblPedido (codigo),
    CONSTRAINT FK_itens_produto FOREIGN KEY (produto) REFERENCES TblProduto (codigo)
);
GO
