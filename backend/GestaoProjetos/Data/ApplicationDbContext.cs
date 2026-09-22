using System;
using System.Collections.Generic;
using GestaoProjetos.Models;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Data;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Alteraco> Alteracoes { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<Documento> Documentos { get; set; }

    public virtual DbSet<Historico> Historicos { get; set; }

    public virtual DbSet<Projeto> Projetos { get; set; }

    public virtual DbSet<Tarefa> Tarefas { get; set; }

    public virtual DbSet<Utilizadore> Utilizadores { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alteraco>(entity =>
        {
            entity.Property(e => e.DataAlteracao).HasDefaultValueSql("(sysdatetime())", "DF_Alteracoes_Data");
            entity.Property(e => e.Estado).HasDefaultValue("Pendente", "DF_Alteracoes_Estado");

            entity.HasOne(d => d.IdProjetoNavigation).WithMany(p => p.Alteracos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Alteracoes_Projetos");

            entity.HasOne(d => d.IdUtilizadorNavigation).WithMany(p => p.Alteracos).HasConstraintName("FK_Alteracoes_Utilizadores");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_Clientes_Ativo");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_Clientes_DataCriacao");
        });

        modelBuilder.Entity<Documento>(entity =>
        {
            entity.Property(e => e.DataUpload).HasDefaultValueSql("(sysdatetime())", "DF_Documentos_DataUpload");

            entity.HasOne(d => d.IdProjetoNavigation).WithMany(p => p.Documentos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Documentos_Projetos");
        });

        modelBuilder.Entity<Historico>(entity =>
        {
            entity.Property(e => e.DataAcao).HasDefaultValueSql("(sysdatetime())", "DF_Historico_DataAcao");

            entity.HasOne(d => d.IdProjetoNavigation).WithMany(p => p.Historicos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Historico_Projetos");

            entity.HasOne(d => d.IdUtilizadorNavigation).WithMany(p => p.Historicos).HasConstraintName("FK_Historico_Utilizadores");
        });

        modelBuilder.Entity<Projeto>(entity =>
        {
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_Projetos_Ativo");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_Projetos_DataCriacao");
            entity.Property(e => e.Estado).HasDefaultValue("Planeado", "DF_Projetos_Estado");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.Projetos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Projetos_Clientes");

            entity.HasOne(d => d.IdResponsavelNavigation).WithMany(p => p.Projetos).HasConstraintName("FK_Projetos_Responsavel");
        });

        modelBuilder.Entity<Tarefa>(entity =>
        {
            entity.Property(e => e.Data).HasDefaultValueSql("(CONVERT([date],getdate()))", "DF_Tarefas_Data");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_Tarefas_DataCriacao");
            entity.Property(e => e.Estado).HasDefaultValue("Pendente", "DF_Tarefas_Estado");
            entity.Property(e => e.Prioridade).HasDefaultValue("Normal", "DF_Tarefas_Prioridade");

            entity.HasOne(d => d.IdProjetoNavigation).WithMany(p => p.Tarefas)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tarefas_Projetos");

            entity.HasOne(d => d.IdUtilizadorNavigation).WithMany(p => p.Tarefas).HasConstraintName("FK_Tarefas_Utilizadores");
        });

        modelBuilder.Entity<Utilizadore>(entity =>
        {
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_Utilizadores_Ativo");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_Utilizadores_DataCriacao");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
