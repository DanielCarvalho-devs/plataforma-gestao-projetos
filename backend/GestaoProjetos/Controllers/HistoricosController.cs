using GestaoProjetos.Data;
using GestaoProjetos.DTOs;
using GestaoProjetos.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestaoProjetos.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class HistoricosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HistoricosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/Historicos
        // Qualquer utilizador autenticado
        // =====================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoricoDto>>>
            GetHistoricos()
        {
            var historicos = await _context.Historicos
                .AsNoTracking()
                .OrderByDescending(h => h.DataAcao)
                .Select(h => new HistoricoDto
                {
                    IdHistorico = h.IdHistorico,
                    IdProjeto = h.IdProjeto,
                    IdUtilizador = h.IdUtilizador,
                    Acao = h.Acao,
                    Entidade = h.Entidade,
                    IdRegisto = h.IdRegisto,
                    Descricao = h.Descricao,
                    DataAcao = h.DataAcao,

                    CodigoProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Codigo
                            : null,

                    NomeProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Nome
                            : null,

                    NomeUtilizador =
                        h.IdUtilizadorNavigation != null
                            ? h.IdUtilizadorNavigation.Nome
                            : null
                })
                .ToListAsync();

            return Ok(historicos);
        }

        // =====================================================
        // GET: api/Historicos/1
        // =====================================================

        [HttpGet("{id:long}")]
        public async Task<ActionResult<HistoricoDto>>
            GetHistorico(long id)
        {
            var historico = await _context.Historicos
                .AsNoTracking()
                .Where(h => h.IdHistorico == id)
                .Select(h => new HistoricoDto
                {
                    IdHistorico = h.IdHistorico,
                    IdProjeto = h.IdProjeto,
                    IdUtilizador = h.IdUtilizador,
                    Acao = h.Acao,
                    Entidade = h.Entidade,
                    IdRegisto = h.IdRegisto,
                    Descricao = h.Descricao,
                    DataAcao = h.DataAcao,

                    CodigoProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Codigo
                            : null,

                    NomeProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Nome
                            : null,

                    NomeUtilizador =
                        h.IdUtilizadorNavigation != null
                            ? h.IdUtilizadorNavigation.Nome
                            : null
                })
                .FirstOrDefaultAsync();

            if (historico == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Registo de histórico não encontrado."
                });
            }

            return Ok(historico);
        }

        // =====================================================
        // GET: api/Historicos/projeto/1
        // =====================================================

        [HttpGet("projeto/{idProjeto}")]
        public async Task<ActionResult<IEnumerable<HistoricoDto>>>
            GetHistoricosPorProjeto(int idProjeto)
        {
            var projetoExiste = await _context.Projetos
                .AnyAsync(p => p.IdProjeto == idProjeto);

            if (!projetoExiste)
            {
                return NotFound(new
                {
                    mensagem = "Projeto não encontrado."
                });
            }

            var historicos = await _context.Historicos
                .AsNoTracking()
                .Where(h => h.IdProjeto == idProjeto)
                .OrderByDescending(h => h.DataAcao)
                .Select(h => new HistoricoDto
                {
                    IdHistorico = h.IdHistorico,
                    IdProjeto = h.IdProjeto,
                    IdUtilizador = h.IdUtilizador,
                    Acao = h.Acao,
                    Entidade = h.Entidade,
                    IdRegisto = h.IdRegisto,
                    Descricao = h.Descricao,
                    DataAcao = h.DataAcao,

                    CodigoProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Codigo
                            : null,

                    NomeProjeto =
                        h.IdProjetoNavigation != null
                            ? h.IdProjetoNavigation.Nome
                            : null,

                    NomeUtilizador =
                        h.IdUtilizadorNavigation != null
                            ? h.IdUtilizadorNavigation.Nome
                            : null
                })
                .ToListAsync();

            return Ok(historicos);
        }

        // =====================================================
        // POST: api/Historicos
        // Administrador, Gestor e Colaborador
        // =====================================================

        [HttpPost]
        [Authorize(Roles = "Administrador,Gestor,Colaborador")]
        public async Task<ActionResult> CriarHistorico(
            HistoricoRequestDto request)
        {
            // Projeto agora é opcional
            if (request.IdProjeto.HasValue)
            {
                var projetoExiste = await _context.Projetos
                    .AnyAsync(p =>
                        p.IdProjeto ==
                        request.IdProjeto.Value);

                if (!projetoExiste)
                {
                    return BadRequest(new
                    {
                        mensagem =
                            "O projeto informado não existe."
                    });
                }
            }

            // Utilizador também é opcional
            if (request.IdUtilizador.HasValue)
            {
                var utilizadorExiste =
                    await _context.Utilizadores
                        .AnyAsync(u =>
                            u.IdUtilizador ==
                            request.IdUtilizador.Value);

                if (!utilizadorExiste)
                {
                    return BadRequest(new
                    {
                        mensagem =
                            "O utilizador informado não existe."
                    });
                }
            }

            if (string.IsNullOrWhiteSpace(request.Acao))
            {
                return BadRequest(new
                {
                    mensagem =
                        "A ação do histórico é obrigatória."
                });
            }

            var historico = new Historico
            {
                IdProjeto = request.IdProjeto,

                IdUtilizador =
                    request.IdUtilizador,

                Acao =
                    request.Acao.Trim(),

                Entidade =
                    string.IsNullOrWhiteSpace(
                        request.Entidade)
                        ? null
                        : request.Entidade.Trim(),

                IdRegisto =
                    request.IdRegisto,

                Descricao =
                    string.IsNullOrWhiteSpace(
                        request.Descricao)
                        ? null
                        : request.Descricao.Trim(),

                DataAcao =
                    request.DataAcao
                    ?? DateTime.Now
            };

            _context.Historicos.Add(historico);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetHistorico),
                new
                {
                    id = historico.IdHistorico
                },
                new
                {
                    historico.IdHistorico,

                    mensagem =
                        "Registo de histórico criado com sucesso."
                });
        }

        // =====================================================
        // DELETE: api/Historicos/1
        // APENAS Administrador
        // =====================================================

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult>
            EliminarHistorico(long id)
        {
            var historico = await _context.Historicos
                .FindAsync(id);

            if (historico == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Registo de histórico não encontrado."
                });
            }

            _context.Historicos.Remove(historico);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}