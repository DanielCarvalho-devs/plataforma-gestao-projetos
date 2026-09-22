using GestaoProjetos.Data;
using GestaoProjetos.DTOs;
using GestaoProjetos.Models;
using GestaoProjetos.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestaoProjetos.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AlteracoesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly HistoricoService _historicoService;

    private static readonly string[] EstadosPermitidos =
    {
        "Pendente",
        "Em análise",
        "Aprovada",
        "Rejeitada",
        "Concluída"
    };

    public AlteracoesController(
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
    // GET: api/Alteracoes
    // Qualquer utilizador autenticado
    // =====================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AlteracaoDto>>> GetAlteracoes()
    {
        var alteracoes = await _context.Alteracoes
            .AsNoTracking()
            .OrderByDescending(a => a.DataAlteracao)
            .Select(a => new AlteracaoDto
            {
                IdAlteracao = a.IdAlteracao,
                IdProjeto = a.IdProjeto,
                IdUtilizador = a.IdUtilizador,
                Descricao = a.Descricao,
                DataAlteracao = a.DataAlteracao,
                Estado = a.Estado,
                Observacoes = a.Observacoes,

                CodigoProjeto = a.IdProjetoNavigation.Codigo,
                NomeProjeto = a.IdProjetoNavigation.Nome,

                NomeUtilizador = a.IdUtilizadorNavigation != null
                    ? a.IdUtilizadorNavigation.Nome
                    : null
            })
            .ToListAsync();

        return Ok(alteracoes);
    }

    // =====================================================
    // GET: api/Alteracoes/5
    // Qualquer utilizador autenticado
    // =====================================================
    [HttpGet("{id}")]
    public async Task<ActionResult<AlteracaoDto>> GetAlteracao(int id)
    {
        var alteracao = await _context.Alteracoes
            .AsNoTracking()
            .Where(a => a.IdAlteracao == id)
            .Select(a => new AlteracaoDto
            {
                IdAlteracao = a.IdAlteracao,
                IdProjeto = a.IdProjeto,
                IdUtilizador = a.IdUtilizador,
                Descricao = a.Descricao,
                DataAlteracao = a.DataAlteracao,
                Estado = a.Estado,
                Observacoes = a.Observacoes,

                CodigoProjeto = a.IdProjetoNavigation.Codigo,
                NomeProjeto = a.IdProjetoNavigation.Nome,

                NomeUtilizador = a.IdUtilizadorNavigation != null
                    ? a.IdUtilizadorNavigation.Nome
                    : null
            })
            .FirstOrDefaultAsync();

        if (alteracao == null)
        {
            return NotFound(new
            {
                mensagem = "Alteração não encontrada."
            });
        }

        return Ok(alteracao);
    }

    // =====================================================
    // GET: api/Alteracoes/projeto/1
    // Qualquer utilizador autenticado
    // =====================================================
    [HttpGet("projeto/{idProjeto}")]
    public async Task<ActionResult<IEnumerable<AlteracaoDto>>>
        GetAlteracoesProjeto(int idProjeto)
    {
        var projetoExiste = await _context.Projetos
            .AnyAsync(p =>
                p.IdProjeto == idProjeto &&
                p.Ativo);

        if (!projetoExiste)
        {
            return NotFound(new
            {
                mensagem = "Projeto não encontrado ou inativo."
            });
        }

        var alteracoes = await _context.Alteracoes
            .AsNoTracking()
            .Where(a => a.IdProjeto == idProjeto)
            .OrderByDescending(a => a.DataAlteracao)
            .Select(a => new AlteracaoDto
            {
                IdAlteracao = a.IdAlteracao,
                IdProjeto = a.IdProjeto,
                IdUtilizador = a.IdUtilizador,
                Descricao = a.Descricao,
                DataAlteracao = a.DataAlteracao,
                Estado = a.Estado,
                Observacoes = a.Observacoes,

                CodigoProjeto = a.IdProjetoNavigation.Codigo,
                NomeProjeto = a.IdProjetoNavigation.Nome,

                NomeUtilizador = a.IdUtilizadorNavigation != null
                    ? a.IdUtilizadorNavigation.Nome
                    : null
            })
            .ToListAsync();

        return Ok(alteracoes);
    }

    // =====================================================
    // POST: api/Alteracoes
    // Administrador, Gestor e Colaborador
    // =====================================================
    [HttpPost]
    [Authorize(Roles = "Administrador,Gestor,Colaborador")]
    public async Task<ActionResult> CriarAlteracao(
        AlteracaoRequestDto request)
    {
        var projetoExiste = await _context.Projetos
            .AnyAsync(p =>
                p.IdProjeto == request.IdProjeto &&
                p.Ativo);

        if (!projetoExiste)
        {
            return BadRequest(new
            {
                mensagem =
                    "O projeto informado não existe ou está inativo."
            });
        }

        if (request.IdUtilizador.HasValue)
        {
            var utilizadorExiste = await _context.Utilizadores
                .AnyAsync(u =>
                    u.IdUtilizador == request.IdUtilizador.Value &&
                    u.Ativo);

            if (!utilizadorExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O utilizador informado não existe ou está inativo."
                });
            }
        }

        if (string.IsNullOrWhiteSpace(request.Descricao))
        {
            return BadRequest(new
            {
                mensagem = "A descrição da alteração é obrigatória."
            });
        }

        if (!EstadosPermitidos.Contains(request.Estado))
        {
            return BadRequest(new
            {
                mensagem = "Estado da alteração inválido."
            });
        }

        var alteracao = new Alteraco
        {
            IdProjeto = request.IdProjeto,
            IdUtilizador = request.IdUtilizador,

            Descricao = request.Descricao.Trim(),

            DataAlteracao =
                request.DataAlteracao ?? DateTime.Now,

            Estado = request.Estado,

            Observacoes =
                string.IsNullOrWhiteSpace(request.Observacoes)
                    ? null
                    : request.Observacoes.Trim()
        };

        _context.Alteracoes.Add(alteracao);

        await _context.SaveChangesAsync();

        var idUtilizadorAutenticado =
            ObterIdUtilizadorAutenticado();

        await _historicoService.RegistarAsync(
            alteracao.IdProjeto,
            idUtilizadorAutenticado,
            "CRIACAO_ALTERACAO",
            "Alteracao",
            alteracao.IdAlteracao,
            $"Alteração #{alteracao.IdAlteracao} criada com estado \"{alteracao.Estado}\". Descrição: {alteracao.Descricao}"
        );

        return CreatedAtAction(
            nameof(GetAlteracao),
            new { id = alteracao.IdAlteracao },
            new
            {
                idAlteracao = alteracao.IdAlteracao,
                mensagem = "Alteração criada com sucesso."
            });
    }

    // =====================================================
    // PUT: api/Alteracoes/5
    // Administrador, Gestor e Colaborador
    // =====================================================
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador,Gestor,Colaborador")]
    public async Task<IActionResult> AtualizarAlteracao(
        int id,
        AlteracaoRequestDto request)
    {
        var alteracao = await _context.Alteracoes
            .FindAsync(id);

        if (alteracao == null)
        {
            return NotFound(new
            {
                mensagem = "Alteração não encontrada."
            });
        }

        var projetoExiste = await _context.Projetos
            .AnyAsync(p =>
                p.IdProjeto == request.IdProjeto &&
                p.Ativo);

        if (!projetoExiste)
        {
            return BadRequest(new
            {
                mensagem =
                    "O projeto informado não existe ou está inativo."
            });
        }

        if (request.IdUtilizador.HasValue)
        {
            var utilizadorExiste = await _context.Utilizadores
                .AnyAsync(u =>
                    u.IdUtilizador == request.IdUtilizador.Value &&
                    u.Ativo);

            if (!utilizadorExiste)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O utilizador informado não existe ou está inativo."
                });
            }
        }

        if (string.IsNullOrWhiteSpace(request.Descricao))
        {
            return BadRequest(new
            {
                mensagem = "A descrição da alteração é obrigatória."
            });
        }

        if (!EstadosPermitidos.Contains(request.Estado))
        {
            return BadRequest(new
            {
                mensagem = "Estado da alteração inválido."
            });
        }

        var projetoAnterior = alteracao.IdProjeto;
        var estadoAnterior = alteracao.Estado;
        var descricaoAnterior = alteracao.Descricao;
        var utilizadorAnterior = alteracao.IdUtilizador;

        alteracao.IdProjeto = request.IdProjeto;
        alteracao.IdUtilizador = request.IdUtilizador;

        alteracao.Descricao =
            request.Descricao.Trim();

        alteracao.DataAlteracao =
            request.DataAlteracao
            ?? alteracao.DataAlteracao;

        alteracao.Estado = request.Estado;

        alteracao.Observacoes =
            string.IsNullOrWhiteSpace(request.Observacoes)
                ? null
                : request.Observacoes.Trim();

        await _context.SaveChangesAsync();

        var idUtilizadorAutenticado =
            ObterIdUtilizadorAutenticado();

        var descricaoHistorico =
            $"Alteração #{alteracao.IdAlteracao} atualizada.";

        if (estadoAnterior != alteracao.Estado)
        {
            descricaoHistorico +=
                $" Estado alterado de \"{estadoAnterior}\" para \"{alteracao.Estado}\".";
        }

        if (descricaoAnterior != alteracao.Descricao)
        {
            descricaoHistorico +=
                $" Descrição alterada.";
        }

        if (projetoAnterior != alteracao.IdProjeto)
        {
            descricaoHistorico +=
                $" Projeto alterado de #{projetoAnterior} para #{alteracao.IdProjeto}.";
        }

        if (utilizadorAnterior != alteracao.IdUtilizador)
        {
            descricaoHistorico +=
                " Utilizador responsável alterado.";
        }

        await _historicoService.RegistarAsync(
            alteracao.IdProjeto,
            idUtilizadorAutenticado,
            "ATUALIZACAO_ALTERACAO",
            "Alteracao",
            alteracao.IdAlteracao,
            descricaoHistorico
        );

        return NoContent();
    }

    // =====================================================
    // DELETE: api/Alteracoes/5
    // Apenas Administrador ou Gestor
    // =====================================================
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador,Gestor")]
    public async Task<IActionResult> EliminarAlteracao(int id)
    {
        var alteracao = await _context.Alteracoes
            .FindAsync(id);

        if (alteracao == null)
        {
            return NotFound(new
            {
                mensagem = "Alteração não encontrada."
            });
        }

        var idProjeto = alteracao.IdProjeto;
        var idAlteracao = alteracao.IdAlteracao;
        var estado = alteracao.Estado;
        var descricao = alteracao.Descricao;

        _context.Alteracoes.Remove(alteracao);

        await _context.SaveChangesAsync();

        var idUtilizadorAutenticado =
            ObterIdUtilizadorAutenticado();

        await _historicoService.RegistarAsync(
            idProjeto,
            idUtilizadorAutenticado,
            "ELIMINACAO_ALTERACAO",
            "Alteracao",
            idAlteracao,
            $"Alteração #{idAlteracao} eliminada. Estado anterior: \"{estado}\". Descrição: {descricao}"
        );

        return NoContent();
    }
}