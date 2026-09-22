using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Index("Estado", Name = "IX_Projetos_Estado")]
[Index("IdCliente", Name = "IX_Projetos_IdCliente")]
[Index("IdResponsavel", Name = "IX_Projetos_IdResponsavel")]
[Index("Codigo", Name = "UQ_Projetos_Codigo", IsUnique = true)]
public partial class Projeto
{
    [Key]
    public int IdProjeto { get; set; }

    public int IdCliente { get; set; }

    public int? IdResponsavel { get; set; }

    [StringLength(50)]
    public string Codigo { get; set; } = null!;

    [StringLength(200)]
    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    [StringLength(250)]
    public string? LocalObra { get; set; }

    public DateOnly? DataInicio { get; set; }

    public DateOnly? PrazoPrevisto { get; set; }

    [StringLength(50)]
    public string Estado { get; set; } = null!;

    public string? Observacoes { get; set; }

    public bool Ativo { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    [InverseProperty("IdProjetoNavigation")]
    public virtual ICollection<Alteraco> Alteracos { get; set; } = new List<Alteraco>();

    [InverseProperty("IdProjetoNavigation")]
    public virtual ICollection<Documento> Documentos { get; set; } = new List<Documento>();

    [InverseProperty("IdProjetoNavigation")]
    public virtual ICollection<Historico> Historicos { get; set; } = new List<Historico>();

    [ForeignKey("IdCliente")]
    [InverseProperty("Projetos")]
    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    [ForeignKey("IdResponsavel")]
    [InverseProperty("Projetos")]
    public virtual Utilizadore? IdResponsavelNavigation { get; set; }

    [InverseProperty("IdProjetoNavigation")]
    public virtual ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>();
}
