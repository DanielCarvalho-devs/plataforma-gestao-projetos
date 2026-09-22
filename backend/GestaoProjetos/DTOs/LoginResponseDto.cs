namespace GestaoProjetos.DTOs
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiraEm { get; set; }

        public int IdUtilizador { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Perfil { get; set; } = string.Empty;
    }
}