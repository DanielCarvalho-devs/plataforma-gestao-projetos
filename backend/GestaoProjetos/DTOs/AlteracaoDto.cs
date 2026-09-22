
using System;

namespace GestaoProjetos.DTOs;

public class AlteracaoDto
{
    public int IdAlteracao { get; set; }

    public int IdProjeto { get; set; }

    public int? IdUtilizador { get; set; }

    public string Descricao { get; set; } = string.Empty;

    public DateTime DataAlteracao { get; set; }

    public string Estado { get; set; } = string.Empty;

    public string? Observacoes { get; set; }

    public string? CodigoProjeto { get; set; }

    public string? NomeProjeto { get; set; }

    public string? NomeUtilizador { get; set; }
}