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
    public class ProjetosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly HistoricoService _historicoService;

        private static readonly string[] EstadosPermitidos =
        {
            "Planeado",
            "Em desenvolvimento",
            "Suspenso",
            "Concluído",
            "Cancelado"
        };

        public ProjetosController(
            ApplicationDbContext context,
            HistoricoService historicoService)
        {
            _context = context;
            _historicoService = historicoService;
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
        // GET: api/Projetos
        // Apenas projetos ativos
        // Usado também pelo Dashboard
        // =====================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjetoDto>>> GetProjetos()
        {
            var projetos = await _context.Projetos
                .AsNoTracking()
                .Where(p => p.Ativo)
                .OrderBy(p => p.Codigo)
                .Select(p => new ProjetoDto
                {
                    IdProjeto = p.IdProjeto,
                    IdCliente = p.IdCliente,
                    IdResponsavel = p.IdResponsavel,
                    Codigo = p.Codigo,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    LocalObra = p.LocalObra,
                    DataInicio = p.DataInicio,
                    PrazoPrevisto = p.PrazoPrevisto,
                    Estado = p.Estado,
                    Observacoes = p.Observacoes,
                    Ativo = p.Ativo,
                    DataCriacao = p.DataCriacao,
                    DataAtualizacao = p.DataAtualizacao,
                    NomeCliente = p.IdClienteNavigation.Nome,
                    NomeResponsavel =
                        p.IdResponsavelNavigation != null
                            ? p.IdResponsavelNavigation.Nome
                            : null
                })
                .ToListAsync();

            return Ok(projetos);
        }

        // =====================================================
        // GET: api/Projetos/todos
        // Ativos + inativos
        // Usado pelo módulo Projetos
        // =====================================================

        [HttpGet("todos")]
        public async Task<ActionResult<IEnumerable<ProjetoDto>>> GetTodosProjetos()
        {
            var projetos = await _context.Projetos
                .AsNoTracking()
                .OrderByDescending(p => p.Ativo)
                .ThenBy(p => p.Codigo)
                .Select(p => new ProjetoDto
                {
                    IdProjeto = p.IdProjeto,
                    IdCliente = p.IdCliente,
                    IdResponsavel = p.IdResponsavel,
                    Codigo = p.Codigo,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    LocalObra = p.LocalObra,
                    DataInicio = p.DataInicio,
                    PrazoPrevisto = p.PrazoPrevisto,
                    Estado = p.Estado,
                    Observacoes = p.Observacoes,
                    Ativo = p.Ativo,
                    DataCriacao = p.DataCriacao,
                    DataAtualizacao = p.DataAtualizacao,
                    NomeCliente = p.IdClienteNavigation.Nome,
                    NomeResponsavel =
                        p.IdResponsavelNavigation != null
                            ? p.IdResponsavelNavigation.Nome
                            : null
                })
                .ToListAsync();

            return Ok(projetos);
        }

        // =====================================================
        // GET: api/Projetos/5
        // Apenas projeto ativo
        // =====================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjetoDto>> GetProjeto(int id)
        {
            var projeto = await _context.Projetos
                .AsNoTracking()
                .Where(p =>
                    p.IdProjeto == id &&
                    p.Ativo)
                .Select(p => new ProjetoDto
                {
                    IdProjeto = p.IdProjeto,
                    IdCliente = p.IdCliente,
                    IdResponsavel = p.IdResponsavel,
                    Codigo = p.Codigo,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    LocalObra = p.LocalObra,
                    DataInicio = p.DataInicio,
                    PrazoPrevisto = p.PrazoPrevisto,
                    Estado = p.Estado,
                    Observacoes = p.Observacoes,
                    Ativo = p.Ativo,
                    DataCriacao = p.DataCriacao,
                    DataAtualizacao = p.DataAtualizacao,
                    NomeCliente = p.IdClienteNavigation.Nome,
                    NomeResponsavel =
                        p.IdResponsavelNavigation != null
                            ? p.IdResponsavelNavigation.Nome
                            : null
                })
                .FirstOrDefaultAsync();

            if (projeto == null)
            {
                return NotFound(new
                {
                    mensagem = "Projeto não encontrado."
                });
            }

            return Ok(projeto);
        }

        // =====================================================
        // GET: api/Projetos/cliente/1
        // Apenas projetos ativos do cliente
        // =====================================================

        [HttpGet("cliente/{idCliente}")]
        public async Task<ActionResult<IEnumerable<ProjetoDto>>>
            GetProjetosPorCliente(int idCliente)
        {
            var projetos = await _context.Projetos
                .AsNoTracking()
                .Where(p =>
                    p.IdCliente == idCliente &&
                    p.Ativo)
                .OrderBy(p => p.Codigo)
                .Select(p => new ProjetoDto
                {
                    IdProjeto = p.IdProjeto,
                    IdCliente = p.IdCliente,
                    IdResponsavel = p.IdResponsavel,
                    Codigo = p.Codigo,
                    Nome = p.Nome,
                    Descricao = p.Descricao,
                    LocalObra = p.LocalObra,
                    DataInicio = p.DataInicio,
                    PrazoPrevisto = p.PrazoPrevisto,
                    Estado = p.Estado,
                    Observacoes = p.Observacoes,
                    Ativo = p.Ativo,
                    DataCriacao = p.DataCriacao,
                    DataAtualizacao = p.DataAtualizacao,
                    NomeCliente = p.IdClienteNavigation.Nome,
                    NomeResponsavel =
                        p.IdResponsavelNavigation != null
                            ? p.IdResponsavelNavigation.Nome
                            : null
                })
                .ToListAsync();

            return Ok(projetos);
        }

        // =====================================================
        // POST: api/Projetos
        // Administrador ou Gestor
        // =====================================================

        [HttpPost]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<ActionResult> CriarProjeto(
            ProjetoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Codigo))
            {
                return BadRequest(new
                {
                    mensagem = "O código do projeto é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                return BadRequest(new
                {
                    mensagem = "O nome do projeto é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem = "O estado do projeto é obrigatório."
                });
            }

            var clienteExiste = await _context.Clientes
                .AnyAsync(c =>
                    c.IdCliente == request.IdCliente &&
                    c.Ativo);

            if (!clienteExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O cliente informado não existe ou está inativo."
                });
            }

            if (request.IdResponsavel.HasValue)
            {
                var responsavelExiste =
                    await _context.Utilizadores
                        .AnyAsync(u =>
                            u.IdUtilizador ==
                                request.IdResponsavel.Value &&
                            u.Ativo);

                if (!responsavelExiste)
                {
                    return BadRequest(new
                    {
                        mensagem =
                            "O responsável informado não existe ou está inativo."
                    });
                }
            }

            var codigo = request.Codigo.Trim();

            var codigoExiste = await _context.Projetos
                .AnyAsync(p => p.Codigo == codigo);

            if (codigoExiste)
            {
                return Conflict(new
                {
                    mensagem =
                        "Já existe um projeto com esse código."
                });
            }

            if (!EstadosPermitidos.Contains(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem =
                        "Estado do projeto inválido."
                });
            }

            if (request.DataInicio.HasValue &&
                request.PrazoPrevisto.HasValue &&
                request.PrazoPrevisto.Value <
                request.DataInicio.Value)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O prazo previsto não pode ser anterior à data de início."
                });
            }

            var projeto = new Projeto
            {
                IdCliente = request.IdCliente,
                IdResponsavel = request.IdResponsavel,
                Codigo = codigo,
                Nome = request.Nome.Trim(),
                Descricao =
                    string.IsNullOrWhiteSpace(request.Descricao)
                        ? null
                        : request.Descricao.Trim(),
                LocalObra =
                    string.IsNullOrWhiteSpace(request.LocalObra)
                        ? null
                        : request.LocalObra.Trim(),
                DataInicio = request.DataInicio,
                PrazoPrevisto = request.PrazoPrevisto,
                Estado = request.Estado,
                Observacoes =
                    string.IsNullOrWhiteSpace(request.Observacoes)
                        ? null
                        : request.Observacoes.Trim(),
                Ativo = true,
                DataCriacao = DateTime.Now
            };

            _context.Projetos.Add(projeto);

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                projeto.IdProjeto,
                idUtilizador,
                "CRIACAO_PROJETO",
                "Projeto",
                projeto.IdProjeto,
                $"Projeto {projeto.Codigo} - {projeto.Nome} criado."
            );

            return CreatedAtAction(
                nameof(GetProjeto),
                new { id = projeto.IdProjeto },
                new
                {
                    projeto.IdProjeto,
                    mensagem =
                        "Projeto criado com sucesso."
                });
        }

        // =====================================================
        // PUT: api/Projetos/5
        // Administrador ou Gestor
        // =====================================================

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> AtualizarProjeto(
            int id,
            ProjetoRequestDto request)
        {
            var projeto = await _context.Projetos
                .FirstOrDefaultAsync(p =>
                    p.IdProjeto == id &&
                    p.Ativo);

            if (projeto == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Projeto não encontrado ou encontra-se inativo."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Codigo))
            {
                return BadRequest(new
                {
                    mensagem = "O código do projeto é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                return BadRequest(new
                {
                    mensagem = "O nome do projeto é obrigatório."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem = "O estado do projeto é obrigatório."
                });
            }

            var clienteExiste = await _context.Clientes
                .AnyAsync(c =>
                    c.IdCliente == request.IdCliente &&
                    c.Ativo);

            if (!clienteExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O cliente informado não existe ou está inativo."
                });
            }

            if (request.IdResponsavel.HasValue)
            {
                var responsavelExiste =
                    await _context.Utilizadores
                        .AnyAsync(u =>
                            u.IdUtilizador ==
                                request.IdResponsavel.Value &&
                            u.Ativo);

                if (!responsavelExiste)
                {
                    return BadRequest(new
                    {
                        mensagem =
                            "O responsável informado não existe ou está inativo."
                    });
                }
            }

            var codigo = request.Codigo.Trim();

            var codigoDuplicado =
                await _context.Projetos
                    .AnyAsync(p =>
                        p.Codigo == codigo &&
                        p.IdProjeto != id);

            if (codigoDuplicado)
            {
                return Conflict(new
                {
                    mensagem =
                        "Já existe outro projeto com esse código."
                });
            }

            if (!EstadosPermitidos.Contains(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem =
                        "Estado do projeto inválido."
                });
            }

            if (request.DataInicio.HasValue &&
                request.PrazoPrevisto.HasValue &&
                request.PrazoPrevisto.Value <
                request.DataInicio.Value)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O prazo previsto não pode ser anterior à data de início."
                });
            }

            var nomeAnterior = projeto.Nome;
            var estadoAnterior = projeto.Estado;

            projeto.IdCliente = request.IdCliente;
            projeto.IdResponsavel = request.IdResponsavel;
            projeto.Codigo = codigo;
            projeto.Nome = request.Nome.Trim();

            projeto.Descricao =
                string.IsNullOrWhiteSpace(request.Descricao)
                    ? null
                    : request.Descricao.Trim();

            projeto.LocalObra =
                string.IsNullOrWhiteSpace(request.LocalObra)
                    ? null
                    : request.LocalObra.Trim();

            projeto.DataInicio = request.DataInicio;
            projeto.PrazoPrevisto = request.PrazoPrevisto;
            projeto.Estado = request.Estado;

            projeto.Observacoes =
                string.IsNullOrWhiteSpace(request.Observacoes)
                    ? null
                    : request.Observacoes.Trim();

            projeto.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            var descricao =
                $"Projeto {projeto.Codigo} atualizado.";

            if (nomeAnterior != projeto.Nome)
            {
                descricao +=
                    $" Nome alterado de \"{nomeAnterior}\" para \"{projeto.Nome}\".";
            }

            if (estadoAnterior != projeto.Estado)
            {
                descricao +=
                    $" Estado alterado de \"{estadoAnterior}\" para \"{projeto.Estado}\".";
            }

            await _historicoService.RegistarAsync(
                projeto.IdProjeto,
                idUtilizador,
                "ATUALIZACAO_PROJETO",
                "Projeto",
                projeto.IdProjeto,
                descricao
            );

            return NoContent();
        }

        // =====================================================
        // DELETE: api/Projetos/5
        // Administrador ou Gestor
        // Desativação lógica
        // =====================================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> DesativarProjeto(
            int id)
        {
            var projeto =
                await _context.Projetos.FindAsync(id);

            if (projeto == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Projeto não encontrado."
                });
            }

            if (!projeto.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto já se encontra inativo."
                });
            }

            projeto.Ativo = false;
            projeto.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                projeto.IdProjeto,
                idUtilizador,
                "DESATIVACAO_PROJETO",
                "Projeto",
                projeto.IdProjeto,
                $"Projeto {projeto.Codigo} - {projeto.Nome} desativado."
            );

            return NoContent();
        }

        // =====================================================
        // PUT: api/Projetos/5/reativar
        // Administrador ou Gestor
        // =====================================================

        [HttpPut("{id}/reativar")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> ReativarProjeto(
            int id)
        {
            var projeto =
                await _context.Projetos.FindAsync(id);

            if (projeto == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Projeto não encontrado."
                });
            }

            if (projeto.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto já se encontra ativo."
                });
            }

            var clienteAtivo = await _context.Clientes
                .AnyAsync(c =>
                    c.IdCliente == projeto.IdCliente &&
                    c.Ativo);

            if (!clienteAtivo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é possível reativar o projeto porque o cliente associado está inativo."
                });
            }

            if (projeto.IdResponsavel.HasValue)
            {
                var responsavelAtivo =
                    await _context.Utilizadores
                        .AnyAsync(u =>
                            u.IdUtilizador ==
                                projeto.IdResponsavel.Value &&
                            u.Ativo);

                if (!responsavelAtivo)
                {
                    return BadRequest(new
                    {
                        mensagem =
                            "Não é possível reativar o projeto porque o responsável associado está inativo."
                    });
                }
            }

            projeto.Ativo = true;
            projeto.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                projeto.IdProjeto,
                idUtilizador,
                "REATIVACAO_PROJETO",
                "Projeto",
                projeto.IdProjeto,
                $"Projeto {projeto.Codigo} - {projeto.Nome} reativado."
            );

            return NoContent();
        }

        // =====================================================
        // DELETE: api/Projetos/5/permanente
        // Apenas Administrador
        // Exclusão física de projeto inativo
        // =====================================================

        [HttpDelete("{id}/permanente")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ExcluirProjetoPermanentemente(
            int id)
        {
            var projeto =
                await _context.Projetos
                    .FirstOrDefaultAsync(p =>
                        p.IdProjeto == id);

            if (projeto == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Projeto não encontrado."
                });
            }

            if (projeto.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O projeto deve ser desativado antes da exclusão permanente."
                });
            }

            var possuiTarefas =
                await _context.Tarefas
                    .AnyAsync(t =>
                        t.IdProjeto == id);

            if (possuiTarefas)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é possível excluir permanentemente este projeto porque existem tarefas associadas."
                });
            }

            var possuiAlteracoes =
                await _context.Alteracoes
                    .AnyAsync(a =>
                        a.IdProjeto == id);

            if (possuiAlteracoes)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é possível excluir permanentemente este projeto porque existem alterações associadas."
                });
            }

            var possuiDocumentos =
                await _context.Documentos
                    .AnyAsync(d =>
                        d.IdProjeto == id);

            if (possuiDocumentos)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é possível excluir permanentemente este projeto porque existem documentos associados."
                });
            }

            var codigoProjeto = projeto.Codigo;
            var nomeProjeto = projeto.Nome;

            var idUtilizador =
                ObterIdUtilizadorAutenticado();

            await using var transacao =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // =================================================
                // Preserva o histórico já existente.
                // Como IdProjeto em Historico é nullable, retiramos
                // apenas a referência direta antes de apagar o projeto.
                // =================================================

                var historicosProjeto =
                    await _context.Historicos
                        .Where(h =>
                            h.IdProjeto == id)
                        .ToListAsync();

                foreach (var historico in historicosProjeto)
                {
                    historico.IdProjeto = null;
                }

                await _context.SaveChangesAsync();

                // =================================================
                // Remove fisicamente o projeto
                // =================================================

                _context.Projetos.Remove(projeto);

                await _context.SaveChangesAsync();

                // =================================================
                // Regista a exclusão permanente sem FK para projeto
                // =================================================

                await _historicoService.RegistarAsync(
                    null,
                    idUtilizador,
                    "EXCLUSAO_PERMANENTE_PROJETO",
                    "Projeto",
                    id,
                    $"Projeto {codigoProjeto} - {nomeProjeto} excluído permanentemente."
                );

                await transacao.CommitAsync();

                return NoContent();
            }
            catch
            {
                await transacao.RollbackAsync();

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        mensagem =
                            "Não foi possível excluir o projeto permanentemente."
                    });
            }
        }
    }
}
