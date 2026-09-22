namespace GestaoProjetos.DTOs
{
    public class ProjetoDto
    {
        public int IdProjeto { get; set; }

        public int IdCliente { get; set; }

        public int? IdResponsavel { get; set; }

        public string Codigo { get; set; } = string.Empty;

        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public string? LocalObra { get; set; }

        public DateOnly? DataInicio { get; set; }

        public DateOnly? PrazoPrevisto { get; set; }

        public string Estado { get; set; } = string.Empty;

        public string? Observacoes { get; set; }

        public bool Ativo { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }

        public string? NomeCliente { get; set; }

        public string? NomeResponsavel { get; set; }
    }
}