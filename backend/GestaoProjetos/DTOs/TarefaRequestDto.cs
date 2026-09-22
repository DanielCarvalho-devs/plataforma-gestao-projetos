using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs
{
    public class TarefaRequestDto
    {
        [Required]
        public int IdProjeto { get; set; }

        public int? IdUtilizador { get; set; }

        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        [Required]
        public DateOnly Data { get; set; }

        [Range(0, 999999.99)]
        public decimal? Horas { get; set; }

        [Required]
        [MaxLength(50)]
        public string Estado { get; set; } = "Pendente";

        [Required]
        [MaxLength(30)]
        public string Prioridade { get; set; } = "Normal";
    }
}