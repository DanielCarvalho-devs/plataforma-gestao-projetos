namespace GestaoProjetos.DTOs
{
    public class HistoricoDto
    {
        public long IdHistorico { get; set; }

        public int? IdProjeto { get; set; }

        public int? IdUtilizador { get; set; }

        public string Acao { get; set; } = string.Empty;

        public string? Entidade { get; set; }

        public int? IdRegisto { get; set; }

        public string? Descricao { get; set; }

        public DateTime DataAcao { get; set; }

        public string? CodigoProjeto { get; set; }

        public string? NomeProjeto { get; set; }

        public string? NomeUtilizador { get; set; }
    }
}