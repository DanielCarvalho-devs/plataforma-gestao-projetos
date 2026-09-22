using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Index("IdProjeto", Name = "IX_Alteracoes_IdProjeto")]
public partial class Alteraco
{
    [Key]
    public int IdAlteracao { get; set; }

    public int IdProjeto { get; set; }

    public int? IdUtilizador { get; set; }

    public string Descricao { get; set; } = null!;

    public DateTime DataAlteracao { get; set; }

    [StringLength(50)]
    public string Estado { get; set; } = null!;

    public string? Observacoes { get; set; }

    [ForeignKey("IdProjeto")]
    [InverseProperty("Alteracos")]
    public virtual Projeto IdProjetoNavigation { get; set; } = null!;

    [ForeignKey("IdUtilizador")]
    [InverseProperty("Alteracos")]
    public virtual Utilizadore? IdUtilizadorNavigation { get; set; }
}
