using GestaoProjetos.Data;
using GestaoProjetos.DTOs;
using GestaoProjetos.Models;
using GestaoProjetos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestaoProjetos.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UtilizadoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher<Utilizadore> _passwordHasher;
        private readonly HistoricoService _historicoService;
        private readonly IWebHostEnvironment _environment;

        private const long TamanhoMaximoFoto = 5 * 1024 * 1024;

        private static readonly string[] PerfisPermitidos =
        {
            "Administrador",
            "Gestor",
            "Colaborador"
        };

        private static readonly string[] ExtensoesFotoPermitidas =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        private static readonly string[] TiposConteudoFotoPermitidos =
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        public UtilizadoresController(
            ApplicationDbContext context,
            IPasswordHasher<Utilizadore> passwordHasher,
            HistoricoService historicoService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _historicoService = historicoService;
            _environment = environment;
        }

        // =====================================================
        // MÉTODOS AUXILIARES
        // =====================================================

        private int? ObterIdUtilizadorAutenticado()
        {
            var valor =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (int.TryParse(valor, out var id))
            {
                return id;
            }

            return null;
        }

        private bool UtilizadorEhAdministrador()
        {
            return User.IsInRole("Administrador");
        }

        private string ObterPastaFotosPerfil()
        {
            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");
            }

            var pasta = Path.Combine(
                webRootPath,
                "uploads",
                "perfis");

            Directory.CreateDirectory(pasta);

            return pasta;
        }

        private string? ObterCaminhoFisicoFoto(string? caminhoRelativo)
        {
            if (string.IsNullOrWhiteSpace(caminhoRelativo))
            {
                return null;
            }

            var caminhoNormalizado =
                caminhoRelativo.Replace('\\', '/');

            const string prefixo = "/uploads/perfis/";

            if (!caminhoNormalizado.StartsWith(
                prefixo,
                StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var nomeArquivo =
                Path.GetFileName(caminhoNormalizado);

            if (string.IsNullOrWhiteSpace(nomeArquivo))
            {
                return null;
            }

            return Path.Combine(
                ObterPastaFotosPerfil(),
                nomeArquivo);
        }

        private static string? ValidarFoto(IFormFile foto)
        {
            if (foto == null || foto.Length == 0)
            {
                return "Selecione uma fotografia.";
            }

            if (foto.Length > TamanhoMaximoFoto)
            {
                return "A fotografia não pode ultrapassar 5 MB.";
            }

            var extensao =
                Path.GetExtension(foto.FileName)
                    .ToLowerInvariant();

            if (!ExtensoesFotoPermitidas.Contains(extensao))
            {
                return "Formato de fotografia inválido. Utilize JPG, JPEG, PNG ou WEBP.";
            }

            if (string.IsNullOrWhiteSpace(foto.ContentType) ||
                !TiposConteudoFotoPermitidos.Contains(
                    foto.ContentType.ToLowerInvariant()))
            {
                return "O tipo do ficheiro selecionado não é uma imagem válida.";
            }

            return null;
        }

        private static string ObterContentTypeFoto(
            string caminho)
        {
            var extensao =
                Path.GetExtension(caminho)
                    .ToLowerInvariant();

            return extensao switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }

        private static void EliminarFotoFisica(
            string? caminhoFisico)
        {
            if (string.IsNullOrWhiteSpace(caminhoFisico))
            {
                return;
            }

            try
            {
                if (System.IO.File.Exists(caminhoFisico))
                {
                    System.IO.File.Delete(caminhoFisico);
                }
            }
            catch
            {
                // A falha ao remover o ficheiro físico não deve
                // impedir a operação principal da aplicação.
            }
        }

        // =====================================================
        // GET: api/Utilizadores/meu-perfil
        // =====================================================

        [HttpGet("meu-perfil")]
        public async Task<IActionResult> GetMeuPerfil()
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == null)
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador autenticado."
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .AsNoTracking()
                    .Where(u =>
                        u.IdUtilizador == idAutenticado.Value &&
                        u.Ativo)
                    .Select(u => new
                    {
                        u.IdUtilizador,
                        u.Nome,
                        u.Email,
                        u.Perfil,
                        u.Ativo,
                        u.DataCriacao,
                        TemFotoPerfil =
                            u.FotoPerfil != null &&
                            u.FotoPerfil != string.Empty
                    })
                    .FirstOrDefaultAsync();

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            return Ok(utilizador);
        }

        // =====================================================
        // PUT: api/Utilizadores/meu-perfil
        // =====================================================

        [HttpPut("meu-perfil")]
        public async Task<IActionResult> AtualizarMeuPerfil(
            MeuPerfilUpdateDto request)
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == null)
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador autenticado."
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .FirstOrDefaultAsync(u =>
                        u.IdUtilizador == idAutenticado.Value &&
                        u.Ativo);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do utilizador é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O email é obrigatório."
                });
            }

            var emailNormalizado =
                request.Email
                    .Trim()
                    .ToLowerInvariant();

            var emailDuplicado =
                await _context.Utilizadores
                    .AnyAsync(u =>
                        u.Email.ToLower() == emailNormalizado &&
                        u.IdUtilizador != utilizador.IdUtilizador);

            if (emailDuplicado)
            {
                return Conflict(new
                {
                    mensagem =
                        "Já existe outro utilizador com esse email."
                });
            }

            var nomeAnterior =
                utilizador.Nome;

            var emailAnterior =
                utilizador.Email;

            utilizador.Nome =
                request.Nome.Trim();

            utilizador.Email =
                emailNormalizado;

            await _context.SaveChangesAsync();

            var descricao =
                $"Utilizador #{utilizador.IdUtilizador} atualizou o próprio perfil.";

            if (nomeAnterior != utilizador.Nome)
            {
                descricao +=
                    $" Nome alterado de \"{nomeAnterior}\" para \"{utilizador.Nome}\".";
            }

            if (emailAnterior != utilizador.Email)
            {
                descricao +=
                    " Email alterado.";
            }

            await _historicoService.RegistarAsync(
                null,
                idAutenticado,
                "ATUALIZACAO_PROPRIO_PERFIL",
                "Utilizador",
                utilizador.IdUtilizador,
                descricao
            );

            return Ok(new
            {
                utilizador.IdUtilizador,
                utilizador.Nome,
                utilizador.Email,
                utilizador.Perfil,
                utilizador.Ativo,
                utilizador.DataCriacao,
                TemFotoPerfil =
                    !string.IsNullOrWhiteSpace(
                        utilizador.FotoPerfil),
                mensagem =
                    "Perfil atualizado com sucesso."
            });
        }

        // =====================================================
        // POST: api/Utilizadores/meu-perfil/foto
        // =====================================================

        [HttpPost("meu-perfil/foto")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        public async Task<IActionResult> UploadFotoPerfil(
            [FromForm] IFormFile foto)
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == null)
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador autenticado."
                });
            }

            var erroFoto =
                ValidarFoto(foto);

            if (erroFoto != null)
            {
                return BadRequest(new
                {
                    mensagem = erroFoto
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .FirstOrDefaultAsync(u =>
                        u.IdUtilizador == idAutenticado.Value &&
                        u.Ativo);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            var extensao =
                Path.GetExtension(foto.FileName)
                    .ToLowerInvariant();

            var nomeArquivo =
                $"{Guid.NewGuid():N}{extensao}";

            var pasta =
                ObterPastaFotosPerfil();

            var caminhoFisicoNovo =
                Path.Combine(
                    pasta,
                    nomeArquivo);

            var caminhoRelativoNovo =
                $"/uploads/perfis/{nomeArquivo}";

            var caminhoFotoAnterior =
                ObterCaminhoFisicoFoto(
                    utilizador.FotoPerfil);

            try
            {
                await using (
                    var stream =
                        new FileStream(
                            caminhoFisicoNovo,
                            FileMode.CreateNew,
                            FileAccess.Write,
                            FileShare.None))
                {
                    await foto.CopyToAsync(stream);
                }

                utilizador.FotoPerfil =
                    caminhoRelativoNovo;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    EliminarFotoFisica(
                        caminhoFisicoNovo);

                    throw;
                }

                if (!string.IsNullOrWhiteSpace(
                        caminhoFotoAnterior) &&
                    !string.Equals(
                        caminhoFotoAnterior,
                        caminhoFisicoNovo,
                        StringComparison.OrdinalIgnoreCase))
                {
                    EliminarFotoFisica(
                        caminhoFotoAnterior);
                }

                await _historicoService.RegistarAsync(
                    null,
                    idAutenticado,
                    "ALTERACAO_FOTO_PERFIL",
                    "Utilizador",
                    utilizador.IdUtilizador,
                    $"Utilizador #{utilizador.IdUtilizador} atualizou a fotografia de perfil."
                );

                return Ok(new
                {
                    utilizador.IdUtilizador,
                    utilizador.Nome,
                    utilizador.Email,
                    utilizador.Perfil,
                    utilizador.Ativo,
                    utilizador.DataCriacao,
                    TemFotoPerfil = true,
                    mensagem =
                        "Fotografia de perfil atualizada com sucesso."
                });
            }
            catch (IOException)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        mensagem =
                            "Não foi possível guardar a fotografia de perfil."
                    });
            }
        }

        // =====================================================
        // GET: api/Utilizadores/meu-perfil/foto
        // =====================================================

        [HttpGet("meu-perfil/foto")]
        public async Task<IActionResult> GetMinhaFotoPerfil()
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == null)
            {
                return Unauthorized();
            }

            var fotoPerfil =
                await _context.Utilizadores
                    .AsNoTracking()
                    .Where(u =>
                        u.IdUtilizador == idAutenticado.Value &&
                        u.Ativo)
                    .Select(u => u.FotoPerfil)
                    .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(
                fotoPerfil))
            {
                return NotFound(new
                {
                    mensagem =
                        "O utilizador ainda não possui fotografia de perfil."
                });
            }

            var caminhoFisico =
                ObterCaminhoFisicoFoto(
                    fotoPerfil);

            if (string.IsNullOrWhiteSpace(
                    caminhoFisico) ||
                !System.IO.File.Exists(
                    caminhoFisico))
            {
                return NotFound(new
                {
                    mensagem =
                        "A fotografia de perfil não foi encontrada."
                });
            }

            var contentType =
                ObterContentTypeFoto(
                    caminhoFisico);

            var stream =
                new FileStream(
                    caminhoFisico,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read);

            return File(
                stream,
                contentType);
        }

        // =====================================================
        // DELETE: api/Utilizadores/meu-perfil/foto
        // =====================================================

        [HttpDelete("meu-perfil/foto")]
        public async Task<IActionResult> RemoverMinhaFotoPerfil()
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == null)
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador autenticado."
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .FirstOrDefaultAsync(u =>
                        u.IdUtilizador == idAutenticado.Value &&
                        u.Ativo);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(
                utilizador.FotoPerfil))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O utilizador não possui fotografia de perfil."
                });
            }

            var caminhoFisico =
                ObterCaminhoFisicoFoto(
                    utilizador.FotoPerfil);

            utilizador.FotoPerfil = null;

            await _context.SaveChangesAsync();

            EliminarFotoFisica(
                caminhoFisico);

            await _historicoService.RegistarAsync(
                null,
                idAutenticado,
                "REMOCAO_FOTO_PERFIL",
                "Utilizador",
                utilizador.IdUtilizador,
                $"Utilizador #{utilizador.IdUtilizador} removeu a fotografia de perfil."
            );

            return Ok(new
            {
                TemFotoPerfil = false,
                mensagem =
                    "Fotografia de perfil removida com sucesso."
            });
        }

        // =====================================================
        // GET: api/Utilizadores
        // APENAS Administrador
        // =====================================================

        [HttpGet]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<IEnumerable<UtilizadorDto>>>
            GetUtilizadores()
        {
            var utilizadores =
                await _context.Utilizadores
                    .AsNoTracking()
                    .Where(u => u.Ativo)
                    .OrderBy(u => u.Nome)
                    .Select(u => new UtilizadorDto
                    {
                        IdUtilizador = u.IdUtilizador,
                        Nome = u.Nome,
                        Email = u.Email,
                        Perfil = u.Perfil,
                        Ativo = u.Ativo,
                        DataCriacao = u.DataCriacao
                    })
                    .ToListAsync();

            return Ok(utilizadores);
        }

        // =====================================================
        // GET: api/Utilizadores/1
        // =====================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UtilizadorDto>>
            GetUtilizador(int id)
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (!UtilizadorEhAdministrador() &&
                idAutenticado != id)
            {
                return Forbid();
            }

            var utilizador =
                await _context.Utilizadores
                    .AsNoTracking()
                    .Where(u =>
                        u.IdUtilizador == id &&
                        u.Ativo)
                    .Select(u => new UtilizadorDto
                    {
                        IdUtilizador = u.IdUtilizador,
                        Nome = u.Nome,
                        Email = u.Email,
                        Perfil = u.Perfil,
                        Ativo = u.Ativo,
                        DataCriacao = u.DataCriacao
                    })
                    .FirstOrDefaultAsync();

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            return Ok(utilizador);
        }

        // =====================================================
        // POST: api/Utilizadores
        // APENAS Administrador
        // =====================================================

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult> CriarUtilizador(
            UtilizadorCreateDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do utilizador é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O email é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    mensagem =
                        "A senha é obrigatória."
                });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new
                {
                    mensagem =
                        "A senha deve possuir pelo menos 8 caracteres."
                });
            }

            var emailNormalizado =
                request.Email
                    .Trim()
                    .ToLowerInvariant();

            var emailExiste =
                await _context.Utilizadores
                    .AnyAsync(u =>
                        u.Email.ToLower() ==
                        emailNormalizado);

            if (emailExiste)
            {
                return Conflict(new
                {
                    mensagem =
                        "Já existe um utilizador com esse email."
                });
            }

            if (!PerfisPermitidos.Contains(
                request.Perfil))
            {
                return BadRequest(new
                {
                    mensagem =
                        "Perfil inválido. Utilize Administrador, Gestor ou Colaborador."
                });
            }

            var utilizador =
                new Utilizadore
                {
                    Nome =
                        request.Nome.Trim(),
                    Email =
                        emailNormalizado,
                    Perfil =
                        request.Perfil,
                    Ativo = true,
                    DataCriacao =
                        DateTime.Now,
                    PasswordHash =
                        string.Empty
                };

            utilizador.PasswordHash =
                _passwordHasher.HashPassword(
                    utilizador,
                    request.Password);

            _context.Utilizadores.Add(
                utilizador);

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "CRIACAO_UTILIZADOR",
                "Utilizador",
                utilizador.IdUtilizador,
                $"Utilizador #{utilizador.IdUtilizador} \"{utilizador.Nome}\" criado com perfil \"{utilizador.Perfil}\"."
            );

            return CreatedAtAction(
                nameof(GetUtilizador),
                new
                {
                    id =
                        utilizador.IdUtilizador
                },
                new
                {
                    utilizador.IdUtilizador,
                    mensagem =
                        "Utilizador criado com sucesso."
                });
        }

        // =====================================================
        // PUT: api/Utilizadores/1
        // APENAS Administrador
        // =====================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult>
            AtualizarUtilizador(
                int id,
                UtilizadorUpdateDto request)
        {
            var utilizador =
                await _context.Utilizadores
                    .FirstOrDefaultAsync(u =>
                        u.IdUtilizador == id &&
                        u.Ativo);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do utilizador é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O email é obrigatório."
                });
            }

            var emailNormalizado =
                request.Email
                    .Trim()
                    .ToLowerInvariant();

            var emailDuplicado =
                await _context.Utilizadores
                    .AnyAsync(u =>
                        u.Email.ToLower() ==
                            emailNormalizado &&
                        u.IdUtilizador != id);

            if (emailDuplicado)
            {
                return Conflict(new
                {
                    mensagem =
                        "Já existe outro utilizador com esse email."
                });
            }

            if (!PerfisPermitidos.Contains(
                request.Perfil))
            {
                return BadRequest(new
                {
                    mensagem =
                        "Perfil inválido. Utilize Administrador, Gestor ou Colaborador."
                });
            }

            var nomeAnterior =
                utilizador.Nome;

            var emailAnterior =
                utilizador.Email;

            var perfilAnterior =
                utilizador.Perfil;

            utilizador.Nome =
                request.Nome.Trim();

            utilizador.Email =
                emailNormalizado;

            utilizador.Perfil =
                request.Perfil;

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            var descricao =
                $"Utilizador #{utilizador.IdUtilizador} atualizado.";

            if (nomeAnterior != utilizador.Nome)
            {
                descricao +=
                    $" Nome alterado de \"{nomeAnterior}\" para \"{utilizador.Nome}\".";
            }

            if (emailAnterior != utilizador.Email)
            {
                descricao +=
                    " Email alterado.";
            }

            if (perfilAnterior != utilizador.Perfil)
            {
                descricao +=
                    $" Perfil alterado de \"{perfilAnterior}\" para \"{utilizador.Perfil}\".";
            }

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "ATUALIZACAO_UTILIZADOR",
                "Utilizador",
                utilizador.IdUtilizador,
                descricao
            );

            return NoContent();
        }

        // =====================================================
        // PUT: api/Utilizadores/1/senha
        // =====================================================

        [HttpPut("{id:int}/senha")]
        public async Task<IActionResult> AlterarSenha(
            int id,
            AlterarSenhaDto request)
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (!UtilizadorEhAdministrador() &&
                idAutenticado != id)
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(
                request.NovaPassword))
            {
                return BadRequest(new
                {
                    mensagem =
                        "A nova senha é obrigatória."
                });
            }

            if (request.NovaPassword.Length < 8)
            {
                return BadRequest(new
                {
                    mensagem =
                        "A senha deve possuir pelo menos 8 caracteres."
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .FirstOrDefaultAsync(u =>
                        u.IdUtilizador == id &&
                        u.Ativo);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            utilizador.PasswordHash =
                _passwordHasher.HashPassword(
                    utilizador,
                    request.NovaPassword);

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            var descricao =
                idUtilizadorAutenticado == id
                    ? $"Utilizador #{id} alterou a própria senha."
                    : $"Senha do utilizador #{id} \"{utilizador.Nome}\" foi redefinida por um administrador.";

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "ALTERACAO_SENHA",
                "Utilizador",
                utilizador.IdUtilizador,
                descricao
            );

            return Ok(new
            {
                mensagem =
                    "Senha alterada com sucesso."
            });
        }

        // =====================================================
        // DELETE: api/Utilizadores/1
        // APENAS Administrador
        // =====================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult>
            DesativarUtilizador(int id)
        {
            var idAutenticado =
                ObterIdUtilizadorAutenticado();

            if (idAutenticado == id)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é permitido desativar a própria conta enquanto está autenticado."
                });
            }

            var utilizador =
                await _context.Utilizadores
                    .FindAsync(id);

            if (utilizador == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Utilizador não encontrado."
                });
            }

            if (!utilizador.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O utilizador já se encontra inativo."
                });
            }

            utilizador.Ativo = false;

            await _context.SaveChangesAsync();

            await _historicoService.RegistarAsync(
                null,
                idAutenticado,
                "DESATIVACAO_UTILIZADOR",
                "Utilizador",
                utilizador.IdUtilizador,
                $"Utilizador #{utilizador.IdUtilizador} \"{utilizador.Nome}\" desativado."
            );

            return NoContent();
        }
    }
}