namespace GestaoProjetos.DTOs
{
    public class DocumentoDto
    {
        public int IdDocumento { get; set; }

        public int IdProjeto { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string Caminho { get; set; } = string.Empty;

        public string? Tipo { get; set; }

        public DateTime DataUpload { get; set; }

        public string? CodigoProjeto { get; set; }

        public string? NomeProjeto { get; set; }
    }
}