using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs
{
    public class DocumentoRequestDto
    {
        [Required(ErrorMessage = "O projeto é obrigatório.")]
        public int IdProjeto { get; set; }

        [Required(ErrorMessage = "O nome do documento é obrigatório.")]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O caminho do documento é obrigatório.")]
        [MaxLength(1000)]
        public string Caminho { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Tipo { get; set; }
    }
}