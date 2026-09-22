USE [master]
GO

IF DB_ID(N'GestaoProjetosDB') IS NULL
BEGIN
    CREATE DATABASE [GestaoProjetosDB];
END
GO

USE [GestaoProjetosDB]
GO

/****** Objeto: Table [dbo].[Alteracoes] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Alteracoes](
    [IdAlteracao] [int] IDENTITY(1,1) NOT NULL,
    [IdProjeto] [int] NOT NULL,
    [IdUtilizador] [int] NULL,
    [Descricao] [nvarchar](max) NOT NULL,
    [DataAlteracao] [datetime2](7) NOT NULL,
    [Estado] [nvarchar](50) NOT NULL,
    [Observacoes] [nvarchar](max) NULL,
 CONSTRAINT [PK_Alteracoes] PRIMARY KEY CLUSTERED
(
    [IdAlteracao] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Clientes] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Clientes](
    [IdCliente] [int] IDENTITY(1,1) NOT NULL,
    [Nome] [nvarchar](150) NOT NULL,
    [Empresa] [nvarchar](150) NULL,
    [Telefone] [nvarchar](30) NULL,
    [Email] [nvarchar](150) NULL,
    [Morada] [nvarchar](250) NULL,
    [Observacoes] [nvarchar](max) NULL,
    [Ativo] [bit] NOT NULL,
    [DataCriacao] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Clientes] PRIMARY KEY CLUSTERED
(
    [IdCliente] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Documentos] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Documentos](
    [IdDocumento] [int] IDENTITY(1,1) NOT NULL,
    [IdProjeto] [int] NOT NULL,
    [Nome] [nvarchar](200) NOT NULL,
    [Caminho] [nvarchar](1000) NOT NULL,
    [Tipo] [nvarchar](100) NULL,
    [DataUpload] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Documentos] PRIMARY KEY CLUSTERED
(
    [IdDocumento] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Historico] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Historico](
    [IdHistorico] [bigint] IDENTITY(1,1) NOT NULL,
    [IdProjeto] [int] NULL,
    [IdUtilizador] [int] NULL,
    [Acao] [nvarchar](100) NOT NULL,
    [Entidade] [nvarchar](100) NULL,
    [IdRegisto] [int] NULL,
    [Descricao] [nvarchar](max) NULL,
    [DataAcao] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Historico] PRIMARY KEY CLUSTERED
(
    [IdHistorico] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Projetos] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Projetos](
    [IdProjeto] [int] IDENTITY(1,1) NOT NULL,
    [IdCliente] [int] NOT NULL,
    [IdResponsavel] [int] NULL,
    [Codigo] [nvarchar](50) NOT NULL,
    [Nome] [nvarchar](200) NOT NULL,
    [Descricao] [nvarchar](max) NULL,
    [LocalObra] [nvarchar](250) NULL,
    [DataInicio] [date] NULL,
    [PrazoPrevisto] [date] NULL,
    [Estado] [nvarchar](50) NOT NULL,
    [Observacoes] [nvarchar](max) NULL,
    [Ativo] [bit] NOT NULL,
    [DataCriacao] [datetime2](7) NOT NULL,
    [DataAtualizacao] [datetime2](7) NULL,
 CONSTRAINT [PK_Projetos] PRIMARY KEY CLUSTERED
(
    [IdProjeto] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Tarefas] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tarefas](
    [IdTarefa] [int] IDENTITY(1,1) NOT NULL,
    [IdProjeto] [int] NOT NULL,
    [IdUtilizador] [int] NULL,
    [Titulo] [nvarchar](200) NOT NULL,
    [Descricao] [nvarchar](max) NULL,
    [Data] [date] NOT NULL,
    [Horas] [decimal](8,2) NULL,
    [Estado] [nvarchar](50) NOT NULL,
    [Prioridade] [nvarchar](30) NOT NULL,
    [DataCriacao] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Tarefas] PRIMARY KEY CLUSTERED
(
    [IdTarefa] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Objeto: Table [dbo].[Utilizadores] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Utilizadores](
    [IdUtilizador] [int] IDENTITY(1,1) NOT NULL,
    [Nome] [nvarchar](150) NOT NULL,
    [Email] [nvarchar](150) NOT NULL,
    [PasswordHash] [nvarchar](255) NOT NULL,
    [Perfil] [nvarchar](50) NOT NULL,
    [Ativo] [bit] NOT NULL,
    [DataCriacao] [datetime2](7) NOT NULL,
    [FotoPerfil] [nvarchar](500) NULL,
 CONSTRAINT [PK_Utilizadores] PRIMARY KEY CLUSTERED
(
    [IdUtilizador] ASC
)WITH (
    PAD_INDEX = OFF,
    STATISTICS_NORECOMPUTE = OFF,
    IGNORE_DUP_KEY = OFF,
    ALLOW_ROW_LOCKS = ON,
    ALLOW_PAGE_LOCKS = ON,
    OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
) ON [PRIMARY]
) ON [PRIMARY]
GO

SET IDENTITY_INSERT [dbo].[Utilizadores] ON
GO



SET IDENTITY_INSERT [dbo].[Utilizadores] OFF
GO

/****** Ãndices ******/
CREATE NONCLUSTERED INDEX [IX_Alteracoes_IdProjeto]
ON [dbo].[Alteracoes]
(
    [IdProjeto] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Documentos_IdProjeto]
ON [dbo].[Documentos]
(
    [IdProjeto] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Historico_DataAcao]
ON [dbo].[Historico]
(
    [DataAcao] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Historico_IdProjeto]
ON [dbo].[Historico]
(
    [IdProjeto] ASC
)
GO

ALTER TABLE [dbo].[Projetos]
ADD CONSTRAINT [UQ_Projetos_Codigo]
UNIQUE NONCLUSTERED
(
    [Codigo] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Projetos_Estado]
ON [dbo].[Projetos]
(
    [Estado] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Projetos_IdCliente]
ON [dbo].[Projetos]
(
    [IdCliente] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Projetos_IdResponsavel]
ON [dbo].[Projetos]
(
    [IdResponsavel] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Tarefas_Estado]
ON [dbo].[Tarefas]
(
    [Estado] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Tarefas_IdProjeto]
ON [dbo].[Tarefas]
(
    [IdProjeto] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_Tarefas_IdUtilizador]
ON [dbo].[Tarefas]
(
    [IdUtilizador] ASC
)
GO

ALTER TABLE [dbo].[Utilizadores]
ADD CONSTRAINT [UQ_Utilizadores_Email]
UNIQUE NONCLUSTERED
(
    [Email] ASC
)
GO

/****** Valores por defeito ******/

ALTER TABLE [dbo].[Alteracoes]
ADD CONSTRAINT [DF_Alteracoes_Data]
DEFAULT (sysdatetime()) FOR [DataAlteracao]
GO

ALTER TABLE [dbo].[Alteracoes]
ADD CONSTRAINT [DF_Alteracoes_Estado]
DEFAULT ('Pendente') FOR [Estado]
GO

ALTER TABLE [dbo].[Clientes]
ADD CONSTRAINT [DF_Clientes_Ativo]
DEFAULT ((1)) FOR [Ativo]
GO

ALTER TABLE [dbo].[Clientes]
ADD CONSTRAINT [DF_Clientes_DataCriacao]
DEFAULT (sysdatetime()) FOR [DataCriacao]
GO

ALTER TABLE [dbo].[Documentos]
ADD CONSTRAINT [DF_Documentos_DataUpload]
DEFAULT (sysdatetime()) FOR [DataUpload]
GO

ALTER TABLE [dbo].[Historico]
ADD CONSTRAINT [DF_Historico_DataAcao]
DEFAULT (sysdatetime()) FOR [DataAcao]
GO

ALTER TABLE [dbo].[Projetos]
ADD CONSTRAINT [DF_Projetos_Estado]
DEFAULT ('Planeado') FOR [Estado]
GO

ALTER TABLE [dbo].[Projetos]
ADD CONSTRAINT [DF_Projetos_Ativo]
DEFAULT ((1)) FOR [Ativo]
GO

ALTER TABLE [dbo].[Projetos]
ADD CONSTRAINT [DF_Projetos_DataCriacao]
DEFAULT (sysdatetime()) FOR [DataCriacao]
GO

ALTER TABLE [dbo].[Tarefas]
ADD CONSTRAINT [DF_Tarefas_Data]
DEFAULT (CONVERT([date],getdate())) FOR [Data]
GO

ALTER TABLE [dbo].[Tarefas]
ADD CONSTRAINT [DF_Tarefas_Estado]
DEFAULT ('Pendente') FOR [Estado]
GO

ALTER TABLE [dbo].[Tarefas]
ADD CONSTRAINT [DF_Tarefas_Prioridade]
DEFAULT ('Normal') FOR [Prioridade]
GO

ALTER TABLE [dbo].[Tarefas]
ADD CONSTRAINT [DF_Tarefas_DataCriacao]
DEFAULT (sysdatetime()) FOR [DataCriacao]
GO

ALTER TABLE [dbo].[Utilizadores]
ADD CONSTRAINT [DF_Utilizadores_Ativo]
DEFAULT ((1)) FOR [Ativo]
GO

ALTER TABLE [dbo].[Utilizadores]
ADD CONSTRAINT [DF_Utilizadores_DataCriacao]
DEFAULT (sysdatetime()) FOR [DataCriacao]
GO

/****** Chaves estrangeiras ******/

ALTER TABLE [dbo].[Alteracoes] WITH CHECK
ADD CONSTRAINT [FK_Alteracoes_Projetos]
FOREIGN KEY([IdProjeto])
REFERENCES [dbo].[Projetos] ([IdProjeto])
GO

ALTER TABLE [dbo].[Alteracoes]
CHECK CONSTRAINT [FK_Alteracoes_Projetos]
GO

ALTER TABLE [dbo].[Alteracoes] WITH CHECK
ADD CONSTRAINT [FK_Alteracoes_Utilizadores]
FOREIGN KEY([IdUtilizador])
REFERENCES [dbo].[Utilizadores] ([IdUtilizador])
GO

ALTER TABLE [dbo].[Alteracoes]
CHECK CONSTRAINT [FK_Alteracoes_Utilizadores]
GO

ALTER TABLE [dbo].[Documentos] WITH CHECK
ADD CONSTRAINT [FK_Documentos_Projetos]
FOREIGN KEY([IdProjeto])
REFERENCES [dbo].[Projetos] ([IdProjeto])
GO

ALTER TABLE [dbo].[Documentos]
CHECK CONSTRAINT [FK_Documentos_Projetos]
GO

ALTER TABLE [dbo].[Historico] WITH CHECK
ADD CONSTRAINT [FK_Historico_Projetos]
FOREIGN KEY([IdProjeto])
REFERENCES [dbo].[Projetos] ([IdProjeto])
GO

ALTER TABLE [dbo].[Historico]
CHECK CONSTRAINT [FK_Historico_Projetos]
GO

ALTER TABLE [dbo].[Historico] WITH CHECK
ADD CONSTRAINT [FK_Historico_Utilizadores]
FOREIGN KEY([IdUtilizador])
REFERENCES [dbo].[Utilizadores] ([IdUtilizador])
GO

ALTER TABLE [dbo].[Historico]
CHECK CONSTRAINT [FK_Historico_Utilizadores]
GO

ALTER TABLE [dbo].[Projetos] WITH CHECK
ADD CONSTRAINT [FK_Projetos_Clientes]
FOREIGN KEY([IdCliente])
REFERENCES [dbo].[Clientes] ([IdCliente])
GO

ALTER TABLE [dbo].[Projetos]
CHECK CONSTRAINT [FK_Projetos_Clientes]
GO

ALTER TABLE [dbo].[Projetos] WITH CHECK
ADD CONSTRAINT [FK_Projetos_Responsavel]
FOREIGN KEY([IdResponsavel])
REFERENCES [dbo].[Utilizadores] ([IdUtilizador])
GO

ALTER TABLE [dbo].[Projetos]
CHECK CONSTRAINT [FK_Projetos_Responsavel]
GO

ALTER TABLE [dbo].[Tarefas] WITH CHECK
ADD CONSTRAINT [FK_Tarefas_Projetos]
FOREIGN KEY([IdProjeto])
REFERENCES [dbo].[Projetos] ([IdProjeto])
GO

ALTER TABLE [dbo].[Tarefas]
CHECK CONSTRAINT [FK_Tarefas_Projetos]
GO

ALTER TABLE [dbo].[Tarefas] WITH CHECK
ADD CONSTRAINT [FK_Tarefas_Utilizadores]
FOREIGN KEY([IdUtilizador])
REFERENCES [dbo].[Utilizadores] ([IdUtilizador])
GO

ALTER TABLE [dbo].[Tarefas]
CHECK CONSTRAINT [FK_Tarefas_Utilizadores]
GO

/****** Regras de validaÃ§Ã£o ******/

ALTER TABLE [dbo].[Projetos] WITH CHECK
ADD CONSTRAINT [CK_Projetos_Datas]
CHECK
(
    [PrazoPrevisto] IS NULL
    OR [DataInicio] IS NULL
    OR [PrazoPrevisto] >= [DataInicio]
)
GO

ALTER TABLE [dbo].[Projetos]
CHECK CONSTRAINT [CK_Projetos_Datas]
GO

ALTER TABLE [dbo].[Tarefas] WITH CHECK
ADD CONSTRAINT [CK_Tarefas_Horas]
CHECK
(
    [Horas] IS NULL
    OR [Horas] >= (0)
)
GO

ALTER TABLE [dbo].[Tarefas]
CHECK CONSTRAINT [CK_Tarefas_Horas]
GO

USE [master]
GO

ALTER DATABASE [GestaoProjetosDB] SET READ_WRITE
GO
