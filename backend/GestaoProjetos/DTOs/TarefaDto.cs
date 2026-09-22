namespace GestaoProjetos.DTOs
{
    public class TarefaDto
    {
        public int IdTarefa { get; set; }

        public int IdProjeto { get; set; }

        public int? IdUtilizador { get; set; }

        public string Titulo { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public DateOnly Data { get; set; }

        public decimal? Horas { get; set; }

        public string Estado { get; set; } = string.Empty;

        public string Prioridade { get; set; } = string.Empty;

        public DateTime DataCriacao { get; set; }

        public string? NomeProjeto { get; set; }

        public string? NomeUtilizador { get; set; }
    }
}