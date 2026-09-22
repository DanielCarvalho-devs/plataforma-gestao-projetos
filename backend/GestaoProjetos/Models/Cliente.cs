using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Models;

public partial class Cliente
{
    [Key]
    public int IdCliente { get; set; }

    [StringLength(150)]
    public string Nome { get; set; } = null!;

    [StringLength(150)]
    public string? Empresa { get; set; }

    [StringLength(30)]
    public string? Telefone { get; set; }

    [StringLength(150)]
    public string? Email { get; set; }

    [StringLength(250)]
    public string? Morada { get; set; }

    public string? Observacoes { get; set; }

    public bool Ativo { get; set; }

    public DateTime DataCriacao { get; set; }

    [InverseProperty("IdClienteNavigation")]
    public virtual ICollection<Projeto> Projetos { get; set; } = new List<Projeto>();
}
