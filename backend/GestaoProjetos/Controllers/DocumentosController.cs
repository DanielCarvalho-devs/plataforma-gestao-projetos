using GestaoProjetos.Data;
using GestaoProjetos.DTOs;
using GestaoProjetos.Models;
using GestaoProjetos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestaoProjetos.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly HistoricoService _historicoService;
        private readonly IWebHostEnvironment _environment;

        // Tamanho máximo permitido: 25 MB
        private const long TamanhoMaximoArquivo = 25 * 1024 * 1024;

        // Extensões permitidas para upload
        private static readonly HashSet<string> ExtensoesPermitidas =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ".pdf",
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".dwg",
                ".dxf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".zip"
            };

        public DocumentosController(
            ApplicationDbContext context,
            HistoricoService historicoService,
            IWebHostEnvironment environment)
        {
            _context = context;
            _historicoService = historicoService;
            _environment = environment;
        }

        // =====================================================
        // UTILIZADOR AUTENTICADO
        // =====================================================

        private int? ObterIdUtilizadorAutenticado()
        {
            var valor =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (int.TryParse(valor, out var idUtilizador))
            {
                return idUtilizador;
            }

            return null;
        }

        // =====================================================
        // PASTA DE UPLOADS
        // =====================================================

        private string ObterPastaUploads()
        {
            var webRoot =
                string.IsNullOrWhiteSpace(_environment.WebRootPath)
                    ? Path.Combine(
                        _environment.ContentRootPath,
                        "wwwroot")
                    : _environment.WebRootPath;

            return Path.Combine(
                webRoot,
                "uploads",
                "projetos");
        }

        // =====================================================
        // CONVERTER CAMINHO DA BD EM CAMINHO FÍSICO
        // =====================================================

        private string? ObterCaminhoFisicoArquivo(string? caminho)
        {
            if (string.IsNullOrWhiteSpace(caminho))
            {
                return null;
            }

            var caminhoNormalizado =
                caminho
                    .Replace('\\', '/')
                    .Trim();

            const string prefixo =
                "/uploads/projetos/";

            // Documentos antigos podem possuir caminhos locais
            // ou externos. Não tentamos tratá-los como uploads.
            if (!caminhoNormalizado.StartsWith(
                    prefixo,
                    StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var relativo =
                caminhoNormalizado
                    .TrimStart('/')
                    .Replace(
                        '/',
                        Path.DirectorySeparatorChar);

            var webRoot =
                string.IsNullOrWhiteSpace(_environment.WebRootPath)
                    ? Path.Combine(
                        _environment.ContentRootPath,
                        "wwwroot")
                    : _environment.WebRootPath;

            var raizUploads =
                Path.GetFullPath(
                    Path.Combine(
                        webRoot,
                        "uploads",
                        "projetos"));

            var caminhoFisico =
                Path.GetFullPath(
                    Path.Combine(
                        webRoot,
                        relativo));

            // Proteção contra tentativa de sair da pasta uploads.
            if (!caminhoFisico.StartsWith(
                    raizUploads + Path.DirectorySeparatorChar,
                    StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return caminhoFisico;
        }

        // =====================================================
        // LIMPAR NOME DO FICHEIRO
        // =====================================================

        private static string LimparNomeArquivo(string nomeArquivo)
        {
            var nome =
                Path.GetFileNameWithoutExtension(
                    nomeArquivo);

            foreach (var caractere
                     in Path.GetInvalidFileNameChars())
            {
                nome =
                    nome.Replace(
                        caractere,
                        '_');
            }

            nome = nome.Trim();

            if (string.IsNullOrWhiteSpace(nome))
            {
                nome = "documento";
            }

            if (nome.Length > 80)
            {
                nome = nome[..80];
            }

            return nome;
        }

        // =====================================================
        // VALIDAR FICHEIRO
        // =====================================================

        private string? ValidarArquivo(IFormFile arquivo)
        {
            if (arquivo == null ||
                arquivo.Length == 0)
            {
                return
                    "Selecione um ficheiro válido.";
            }

            if (arquivo.Length >
                TamanhoMaximoArquivo)
            {
                return
                    "O ficheiro excede o tamanho máximo permitido de 25 MB.";
            }

            var extensao =
                Path.GetExtension(
                    arquivo.FileName);

            if (string.IsNullOrWhiteSpace(extensao) ||
                !ExtensoesPermitidas.Contains(extensao))
            {
                return
                    "Tipo de ficheiro não permitido. São aceites PDF, imagens, DWG, DXF, Word, Excel e ZIP.";
            }

            return null;
        }

        // =====================================================
        // GUARDAR FICHEIRO FISICAMENTE
        // =====================================================

        private async Task<string> GuardarArquivoAsync(
            IFormFile arquivo,
            int idProjeto)
        {
            var pastaProjeto =
                Path.Combine(
                    ObterPastaUploads(),
                    idProjeto.ToString());

            Directory.CreateDirectory(
                pastaProjeto);

            var extensao =
                Path.GetExtension(
                        arquivo.FileName)
                    .ToLowerInvariant();

            var nomeSeguro =
                LimparNomeArquivo(
                    arquivo.FileName);

            var nomeFisico =
                $"{Guid.NewGuid():N}-{nomeSeguro}{extensao}";

            var caminhoFisico =
                Path.Combine(
                    pastaProjeto,
                    nomeFisico);

            await using var stream =
                new FileStream(
                    caminhoFisico,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None);

            await arquivo.CopyToAsync(
                stream);

            return
                $"/uploads/projetos/{idProjeto}/{nomeFisico}";
        }

        // =====================================================
        // ELIMINAR FICHEIRO FÍSICO
        // =====================================================

        private void EliminarArquivoFisico(
            string? caminho)
        {
            try
            {
                var caminhoFisico =
                    ObterCaminhoFisicoArquivo(
                        caminho);

                if (caminhoFisico != null &&
                    System.IO.File.Exists(
                        caminhoFisico))
                {
                    System.IO.File.Delete(
                        caminhoFisico);
                }
            }
            catch
            {
                // Uma eventual falha ao apagar o ficheiro
                // físico não interrompe a operação principal.
            }
        }

        // =====================================================
        // GET: api/Documentos
        // Qualquer utilizador autenticado
        // =====================================================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<DocumentoDto>>>
            GetDocumentos()
        {
            var documentos =
                await _context.Documentos
                    .AsNoTracking()
                    .OrderByDescending(
                        d => d.DataUpload)
                    .Select(d =>
                        new DocumentoDto
                        {
                            IdDocumento =
                                d.IdDocumento,

                            IdProjeto =
                                d.IdProjeto,

                            Nome =
                                d.Nome,

                            Caminho =
                                d.Caminho,

                            Tipo =
                                d.Tipo,

                            DataUpload =
                                d.DataUpload,

                            CodigoProjeto =
                                d.IdProjetoNavigation
                                    .Codigo,

                            NomeProjeto =
                                d.IdProjetoNavigation
                                    .Nome
                        })
                    .ToListAsync();

            return Ok(documentos);
        }

        // =====================================================
        // GET: api/Documentos/1
        // =====================================================

        [HttpGet("{id}")]
        public async Task<
            ActionResult<DocumentoDto>>
            GetDocumento(int id)
        {
            var documento =
                await _context.Documentos
                    .AsNoTracking()
                    .Where(d =>
                        d.IdDocumento == id)
                    .Select(d =>
                        new DocumentoDto
                        {
                            IdDocumento =
                                d.IdDocumento,

                            IdProjeto =
                                d.IdProjeto,

                            Nome =
                                d.Nome,

                            Caminho =
                                d.Caminho,

                            Tipo =
                                d.Tipo,

                            DataUpload =
                                d.DataUpload,

                            CodigoProjeto =
                                d.IdProjetoNavigation
                                    .Codigo,

                            NomeProjeto =
                                d.IdProjetoNavigation
                                    .Nome
                        })
                    .FirstOrDefaultAsync();

            if (documento == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Documento não encontrado."
                });
            }

            return Ok(documento);
        }

        // =====================================================
        // GET: api/Documentos/projeto/1
        // =====================================================

        [HttpGet("projeto/{idProjeto}")]
        public async Task<
            ActionResult<IEnumerable<DocumentoDto>>>
            GetDocumentosPorProjeto(
                int idProjeto)
        {
            var projetoExiste =
                await _context.Projetos
                    .AnyAsync(p =>
                        p.IdProjeto == idProjeto &&
                        p.Ativo);

            if (!projetoExiste)
            {
                return NotFound(new
                {
                    mensagem =
                        "Projeto não encontrado ou inativo."
                });
            }

            var documentos =
                await _context.Documentos
                    .AsNoTracking()
                    .Where(d =>
                        d.IdProjeto == idProjeto)
                    .OrderByDescending(
                        d => d.DataUpload)
                    .Select(d =>
                        new DocumentoDto
                        {
                            IdDocumento =
                                d.IdDocumento,

                            IdProjeto =
                                d.IdProjeto,

                            Nome =
                                d.Nome,

                            Caminho =
                                d.Caminho,

                            Tipo =
                                d.Tipo,

                            DataUpload =
                                d.DataUpload,

                            CodigoProjeto =
                                d.IdProjetoNavigation
                                    .Codigo,

                            NomeProjeto =
                                d.IdProjetoNavigation
                                    .Nome
                        })
                    .ToListAsync();

            return Ok(documentos);
        }

        // =====================================================
        // POST: api/Documentos
        //
        // Mantemos esta rota para compatibilidade com os
        // registos antigos baseados apenas em caminho.
        // =====================================================

        [HttpPost]
        [Authorize(
            Roles =
                "Administrador,Gestor,Colaborador")]
        public async Task<ActionResult>
            CriarDocumento(
                DocumentoRequestDto request)
        {
            var projetoExiste =
                await _context.Projetos
                    .AnyAsync(p =>
                        p.IdProjeto ==
                            request.IdProjeto &&
                        p.Ativo);

            if (!projetoExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto informado não existe ou está inativo."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do documento é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Caminho))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O caminho do documento é obrigatório."
                });
            }

            var documento =
                new Documento
                {
                    IdProjeto =
                        request.IdProjeto,

                    Nome =
                        request.Nome.Trim(),

                    Caminho =
                        request.Caminho.Trim(),

                    Tipo =
                        string.IsNullOrWhiteSpace(
                            request.Tipo)
                            ? null
                            : request.Tipo.Trim(),

                    DataUpload =
                        DateTime.Now
                };

            _context.Documentos.Add(
                documento);

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await _historicoService
                .RegistarAsync(
                    documento.IdProjeto,
                    idUtilizador,
                    "CRIACAO_DOCUMENTO",
                    "Documento",
                    documento.IdDocumento,
                    $"Documento #{documento.IdDocumento} \"{documento.Nome}\" registado."
                );

            return CreatedAtAction(
                nameof(GetDocumento),
                new
                {
                    id =
                        documento.IdDocumento
                },
                new
                {
                    documento.IdDocumento,

                    mensagem =
                        "Documento registado com sucesso."
                });
        }

        // =====================================================
        // POST: api/Documentos/upload
        //
        // UPLOAD REAL DO FICHEIRO
        // =====================================================

        [HttpPost("upload")]
        [Authorize(
            Roles =
                "Administrador,Gestor,Colaborador")]
        [RequestSizeLimit(
            TamanhoMaximoArquivo)]
        public async Task<ActionResult>
            UploadDocumento(
                [FromForm] int idProjeto,
                [FromForm] string nome,
                [FromForm] string? tipo,
                [FromForm] IFormFile arquivo)
        {
            var projetoExiste =
                await _context.Projetos
                    .AnyAsync(p =>
                        p.IdProjeto == idProjeto &&
                        p.Ativo);

            if (!projetoExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto informado não existe ou está inativo."
                });
            }

            if (string.IsNullOrWhiteSpace(nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do documento é obrigatório."
                });
            }

            var erroArquivo =
                ValidarArquivo(arquivo);

            if (erroArquivo != null)
            {
                return BadRequest(new
                {
                    mensagem =
                        erroArquivo
                });
            }

            string? caminhoGuardado =
                null;

            try
            {
                caminhoGuardado =
                    await GuardarArquivoAsync(
                        arquivo,
                        idProjeto);

                var documento =
                    new Documento
                    {
                        IdProjeto =
                            idProjeto,

                        Nome =
                            nome.Trim(),

                        Caminho =
                            caminhoGuardado,

                        Tipo =
                            string.IsNullOrWhiteSpace(
                                tipo)
                                ? null
                                : tipo.Trim(),

                        DataUpload =
                            DateTime.Now
                    };

                _context.Documentos.Add(
                    documento);

                await _context.SaveChangesAsync();

                var idUtilizador =
                    ObterIdUtilizadorAutenticado();

                await _historicoService
                    .RegistarAsync(
                        documento.IdProjeto,
                        idUtilizador,
                        "UPLOAD_DOCUMENTO",
                        "Documento",
                        documento.IdDocumento,
                        $"Documento #{documento.IdDocumento} \"{documento.Nome}\" carregado para a plataforma."
                    );

                return CreatedAtAction(
                    nameof(GetDocumento),
                    new
                    {
                        id =
                            documento.IdDocumento
                    },
                    new
                    {
                        documento.IdDocumento,
                        documento.Nome,
                        documento.Tipo,
                        documento.Caminho,
                        documento.DataUpload,

                        mensagem =
                            "Documento carregado com sucesso."
                    });
            }
            catch
            {
                if (caminhoGuardado != null)
                {
                    EliminarArquivoFisico(
                        caminhoGuardado);
                }

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        mensagem =
                            "Não foi possível guardar o documento."
                    });
            }
        }

        // =====================================================
        // PUT: api/Documentos/1
        // =====================================================

        [HttpPut("{id}")]
        [Authorize(
            Roles =
                "Administrador,Gestor,Colaborador")]
        public async Task<IActionResult>
            AtualizarDocumento(
                int id,
                DocumentoRequestDto request)
        {
            var documento =
                await _context.Documentos
                    .FirstOrDefaultAsync(d =>
                        d.IdDocumento == id);

            if (documento == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Documento não encontrado."
                });
            }

            var projetoExiste =
                await _context.Projetos
                    .AnyAsync(p =>
                        p.IdProjeto ==
                            request.IdProjeto &&
                        p.Ativo);

            if (!projetoExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto informado não existe ou está inativo."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Nome))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O nome do documento é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Caminho))
            {
                return BadRequest(new
                {
                    mensagem =
                        "O caminho do documento é obrigatório."
                });
            }

            var projetoAnterior =
                documento.IdProjeto;

            var nomeAnterior =
                documento.Nome;

            var caminhoAnterior =
                documento.Caminho;

            var tipoAnterior =
                documento.Tipo;

            documento.IdProjeto =
                request.IdProjeto;

            documento.Nome =
                request.Nome.Trim();

            documento.Caminho =
                request.Caminho.Trim();

            documento.Tipo =
                string.IsNullOrWhiteSpace(
                    request.Tipo)
                    ? null
                    : request.Tipo.Trim();

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            var descricao =
                $"Documento #{documento.IdDocumento} atualizado.";

            if (nomeAnterior != documento.Nome)
            {
                descricao +=
                    $" Nome alterado de \"{nomeAnterior}\" para \"{documento.Nome}\".";
            }

            if (caminhoAnterior !=
                documento.Caminho)
            {
                descricao +=
                    " Caminho do documento alterado.";
            }

            if (tipoAnterior != documento.Tipo)
            {
                descricao +=
                    $" Tipo alterado de \"{tipoAnterior ?? "não definido"}\" para \"{documento.Tipo ?? "não definido"}\".";
            }

            if (projetoAnterior !=
                documento.IdProjeto)
            {
                descricao +=
                    $" Projeto alterado de #{projetoAnterior} para #{documento.IdProjeto}.";
            }

            await _historicoService
                .RegistarAsync(
                    documento.IdProjeto,
                    idUtilizador,
                    "ATUALIZACAO_DOCUMENTO",
                    "Documento",
                    documento.IdDocumento,
                    descricao
                );

            return NoContent();
        }

        // =====================================================
        // GET: api/Documentos/1/download
        //
        // DOWNLOAD DO FICHEIRO
        // =====================================================

        [HttpGet("{id}/download")]
        public async Task<IActionResult>
            DownloadDocumento(int id)
        {
            var documento =
                await _context.Documentos
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d =>
                        d.IdDocumento == id);

            if (documento == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Documento não encontrado."
                });
            }

            var caminhoFisico =
                ObterCaminhoFisicoArquivo(
                    documento.Caminho);

            if (caminhoFisico == null ||
                !System.IO.File.Exists(
                    caminhoFisico))
            {
                return NotFound(new
                {
                    mensagem =
                        "O ficheiro físico deste documento não foi encontrado. Este registo pode pertencer ao sistema antigo de caminhos."
                });
            }

            var extensao =
                Path.GetExtension(
                    caminhoFisico);

            var nomeDownload =
                documento.Nome.Trim();

            if (!nomeDownload.EndsWith(
                    extensao,
                    StringComparison.OrdinalIgnoreCase))
            {
                nomeDownload +=
                    extensao;
            }

            var stream =
                new FileStream(
                    caminhoFisico,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read);

            return File(
                stream,
                "application/octet-stream",
                nomeDownload);
        }

        // =====================================================
        // GET: api/Documentos/1/visualizar
        //
        // PDF e imagens podem ser visualizados diretamente
        // no navegador.
        // =====================================================

        [HttpGet("{id}/visualizar")]
        public async Task<IActionResult>
            VisualizarDocumento(int id)
        {
            var documento =
                await _context.Documentos
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d =>
                        d.IdDocumento == id);

            if (documento == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Documento não encontrado."
                });
            }

            var caminhoFisico =
                ObterCaminhoFisicoArquivo(
                    documento.Caminho);

            if (caminhoFisico == null ||
                !System.IO.File.Exists(
                    caminhoFisico))
            {
                return NotFound(new
                {
                    mensagem =
                        "O ficheiro físico não foi encontrado."
                });
            }

            var extensao =
                Path.GetExtension(
                        caminhoFisico)
                    .ToLowerInvariant();

            var contentType =
                extensao switch
                {
                    ".pdf" =>
                        "application/pdf",

                    ".png" =>
                        "image/png",

                    ".jpg" =>
                        "image/jpeg",

                    ".jpeg" =>
                        "image/jpeg",

                    ".webp" =>
                        "image/webp",

                    _ =>
                        "application/octet-stream"
                };

            var stream =
                new FileStream(
                    caminhoFisico,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read);

            return File(
                stream,
                contentType,
                enableRangeProcessing: true);
        }

        // =====================================================
        // DELETE: api/Documentos/1
        //
        // Apenas Administrador ou Gestor
        // =====================================================

        [HttpDelete("{id}")]
        [Authorize(
            Roles =
                "Administrador,Gestor")]
        public async Task<IActionResult>
            EliminarDocumento(int id)
        {
            var documento =
                await _context.Documentos
                    .FindAsync(id);

            if (documento == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Documento não encontrado."
                });
            }

            // Guardamos os dados antes de eliminar
            // o registo da base de dados.

            var idProjeto =
                documento.IdProjeto;

            var idDocumento =
                documento.IdDocumento;

            var nome =
                documento.Nome;

            var tipo =
                documento.Tipo;

            var caminho =
                documento.Caminho;

            _context.Documentos.Remove(
                documento);

            await _context.SaveChangesAsync();

            // Se for um ficheiro carregado pela plataforma,
            // também eliminamos o ficheiro físico.
            EliminarArquivoFisico(
                caminho);

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await _historicoService
                .RegistarAsync(
                    idProjeto,
                    idUtilizador,
                    "ELIMINACAO_DOCUMENTO",
                    "Documento",
                    idDocumento,
                    $"Documento #{idDocumento} \"{nome}\" eliminado. Tipo: \"{tipo ?? "não definido"}\"."
                );

            return NoContent();
        }
    }
}