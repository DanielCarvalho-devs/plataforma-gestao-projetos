using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

[Index("Email", Name = "UQ_Utilizadores_Email", IsUnique = true)]
public partial class Utilizadore
{
    [Key]
    public int IdUtilizador { get; set; }

    [StringLength(150)]
    public string Nome { get; set; } = null!;

    [StringLength(150)]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    public string PasswordHash { get; set; } = null!;

    [StringLength(50)]
    public string Perfil { get; set; } = null!;

    [StringLength(500)]
    public string? FotoPerfil { get; set; }

    public bool Ativo { get; set; }

    public DateTime DataCriacao { get; set; }

    [InverseProperty("IdUtilizadorNavigation")]
    public virtual ICollection<Alteraco> Alteracos { get; set; } = new List<Alteraco>();

    [InverseProperty("IdUtilizadorNavigation")]
    public virtual ICollection<Historico> Historicos { get; set; } = new List<Historico>();

    [InverseProperty("IdResponsavelNavigation")]
    public virtual ICollection<Projeto> Projetos { get; set; } = new List<Projeto>();

    [InverseProperty("IdUtilizadorNavigation")]
    public virtual ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>();
}