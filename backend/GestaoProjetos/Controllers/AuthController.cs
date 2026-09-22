using GestaoProjetos.Data;
using GestaoProjetos.DTOs;
using GestaoProjetos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GestaoProjetos.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher<Utilizadore> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IPasswordHasher<Utilizadore> passwordHasher,
            IConfiguration configuration)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto request)
        {
            var emailNormalizado = request.Email
                .Trim()
                .ToLowerInvariant();

            var utilizador = await _context.Utilizadores
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == emailNormalizado &&
                    u.Ativo);

            if (utilizador == null)
            {
                return Unauthorized(new
                {
                    mensagem = "Email ou senha inválidos."
                });
            }

            var resultadoSenha = _passwordHasher.VerifyHashedPassword(
                utilizador,
                utilizador.PasswordHash,
                request.Password);

            if (resultadoSenha == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    mensagem = "Email ou senha inválidos."
                });
            }

            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey) ||
                string.IsNullOrWhiteSpace(jwtIssuer) ||
                string.IsNullOrWhiteSpace(jwtAudience))
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        mensagem = "Configuração JWT inválida."
                    });
            }

            var expireMinutes = _configuration.GetValue<int>(
                "Jwt:ExpireMinutes");

            if (expireMinutes <= 0)
            {
                expireMinutes = 120;
            }

            var expiracao = DateTime.UtcNow.AddMinutes(expireMinutes);

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    utilizador.IdUtilizador.ToString()),

                new Claim(
                    ClaimTypes.Name,
                    utilizador.Nome),

                new Claim(
                    ClaimTypes.Email,
                    utilizador.Email),

                new Claim(
                    ClaimTypes.Role,
                    utilizador.Perfil),

                new Claim(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString())
            };

            var chave = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credenciais = new SigningCredentials(
                chave,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expiracao,
                signingCredentials: credenciais);

            var tokenString =
                new JwtSecurityTokenHandler()
                    .WriteToken(token);

            return Ok(new LoginResponseDto
            {
                Token = tokenString,
                ExpiraEm = expiracao,
                IdUtilizador = utilizador.IdUtilizador,
                Nome = utilizador.Nome,
                Email = utilizador.Email,
                Perfil = utilizador.Perfil
            });
        }

        // GET: api/Auth/me
        // Endpoint protegido para testar o JWT
        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var id = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var nome = User.FindFirstValue(
                ClaimTypes.Name);

            var email = User.FindFirstValue(
                ClaimTypes.Email);

            var perfil = User.FindFirstValue(
                ClaimTypes.Role);

            return Ok(new
            {
                idUtilizador = id,
                nome,
                email,
                perfil,
                autenticado = true
            });
        }
    }
}