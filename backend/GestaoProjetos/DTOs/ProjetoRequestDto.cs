using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs
{
    public class ProjetoRequestDto
    {
        [Required]
        public int IdCliente { get; set; }

        public int? IdResponsavel { get; set; }

        [Required]
        [MaxLength(50)]
        public string Codigo { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        [MaxLength(250)]
        public string? LocalObra { get; set; }

        public DateOnly? DataInicio { get; set; }

        public DateOnly? PrazoPrevisto { get; set; }

        [Required]
        [MaxLength(50)]
        public string Estado { get; set; } = "Planeado";

        public string? Observacoes { get; set; }
    }
}