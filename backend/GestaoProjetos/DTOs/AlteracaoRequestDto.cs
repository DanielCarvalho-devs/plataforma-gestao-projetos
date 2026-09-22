
using System;
using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs;

public class AlteracaoRequestDto
{
    [Required(ErrorMessage = "O projeto é obrigatório.")]
    public int IdProjeto { get; set; }

    public int? IdUtilizador { get; set; }

    [Required(ErrorMessage = "A descrição é obrigatória.")]
    public string Descricao { get; set; } = string.Empty;

    public DateTime? DataAlteracao { get; set; }

    [Required(ErrorMessage = "O estado é obrigatório.")]
    [MaxLength(50)]
    public string Estado { get; set; } = string.Empty;

    public string? Observacoes { get; set; }
}