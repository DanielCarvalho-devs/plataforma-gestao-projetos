using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs
{
    public class AlterarSenhaDto
    {
        [Required(ErrorMessage = "A nova senha é obrigatória.")]
        [MinLength(8, ErrorMessage = "A senha deve possuir pelo menos 8 caracteres.")]
        [MaxLength(100)]
        public string NovaPassword { get; set; } = string.Empty;
    }
}