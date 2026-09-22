using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Index("Estado", Name = "IX_Tarefas_Estado")]
[Index("IdProjeto", Name = "IX_Tarefas_IdProjeto")]
[Index("IdUtilizador", Name = "IX_Tarefas_IdUtilizador")]
public partial class Tarefa
{
    [Key]
    public int IdTarefa { get; set; }

    public int IdProjeto { get; set; }

    public int? IdUtilizador { get; set; }

    [StringLength(200)]
    public string Titulo { get; set; } = null!;

    public string? Descricao { get; set; }

    public DateOnly Data { get; set; }

    [Column(TypeName = "decimal(8, 2)")]
    public decimal? Horas { get; set; }

    [StringLength(50)]
    public string Estado { get; set; } = null!;

    [StringLength(30)]
    public string Prioridade { get; set; } = null!;

    public DateTime DataCriacao { get; set; }

    [ForeignKey("IdProjeto")]
    [InverseProperty("Tarefas")]
    public virtual Projeto IdProjetoNavigation { get; set; } = null!;

    [ForeignKey("IdUtilizador")]
    [InverseProperty("Tarefas")]
    public virtual Utilizadore? IdUtilizadorNavigation { get; set; }
}
