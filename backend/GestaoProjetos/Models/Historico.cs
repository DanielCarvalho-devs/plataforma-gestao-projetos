using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Table("Historico")]
[Index("DataAcao", Name = "IX_Historico_DataAcao")]
[Index("IdProjeto", Name = "IX_Historico_IdProjeto")]
public partial class Historico
{
    [Key]
    public long IdHistorico { get; set; }

    public int? IdProjeto { get; set; }

    public int? IdUtilizador { get; set; }

    [StringLength(100)]
    public string Acao { get; set; } = null!;

    [StringLength(100)]
    public string? Entidade { get; set; }

    public int? IdRegisto { get; set; }

    public string? Descricao { get; set; }

    public DateTime DataAcao { get; set; }

    [ForeignKey("IdProjeto")]
    [InverseProperty("Historicos")]
    public virtual Projeto? IdProjetoNavigation { get; set; }

    [ForeignKey("IdUtilizador")]
    [InverseProperty("Historicos")]
    public virtual Utilizadore? IdUtilizadorNavigation { get; set; }
}