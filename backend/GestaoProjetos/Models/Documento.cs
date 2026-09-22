using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Index("IdProjeto", Name = "IX_Documentos_IdProjeto")]
public partial class Documento
{
    [Key]
    public int IdDocumento { get; set; }

    public int IdProjeto { get; set; }

    [StringLength(200)]
    public string Nome { get; set; } = null!;

    [StringLength(1000)]
    public string Caminho { get; set; } = null!;

    [StringLength(100)]
    public string? Tipo { get; set; }

    public DateTime DataUpload { get; set; }

    [ForeignKey("IdProjeto")]
    [InverseProperty("Documentos")]
    public virtual Projeto IdProjetoNavigation { get; set; } = null!;
}
