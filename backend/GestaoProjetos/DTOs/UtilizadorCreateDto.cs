using System.ComponentModel.DataAnnotations;

namespace GestaoProjetos.DTOs
{
    public class UtilizadorCreateDto
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [MaxLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress(ErrorMessage = "O email informado não é válido.")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(8, ErrorMessage = "A senha deve possuir pelo menos 8 caracteres.")]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "O perfil é obrigatório.")]
        [MaxLength(50)]
        public string Perfil { get; set; } = string.Empty;
    }
}