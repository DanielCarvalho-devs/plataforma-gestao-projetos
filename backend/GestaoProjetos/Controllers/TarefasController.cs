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
    public class TarefasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly HistoricoService _historicoService;

        private static readonly string[] EstadosPermitidos =
        {
            "Pendente",
            "Em execução",
            "Concluída",
            "Cancelada"
        };

        private static readonly string[] PrioridadesPermitidas =
        {
            "Baixa",
            "Normal",
            "Alta",
            "Urgente"
        };

        public TarefasController(
            ApplicationDbContext context,
            HistoricoService historicoService)
        {
            _context = context;
            _historicoService = historicoService;
        }

        // ============================================================
        // UTILIZADOR AUTENTICADO
        // ============================================================

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

        // ============================================================
        // GET: api/Tarefas
        // Qualquer utilizador autenticado
        // ============================================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TarefaDto>>> GetTarefas()
        {
            var tarefas = await _context.Tarefas
                .AsNoTracking()
                .OrderByDescending(t => t.Data)
                .ThenBy(t => t.Titulo)
                .Select(t => new TarefaDto
                {
                    IdTarefa = t.IdTarefa,
                    IdProjeto = t.IdProjeto,
                    IdUtilizador = t.IdUtilizador,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    Data = t.Data,
                    Horas = t.Horas,
                    Estado = t.Estado,
                    Prioridade = t.Prioridade,
                    DataCriacao = t.DataCriacao,

                    NomeProjeto = t.IdProjetoNavigation.Nome,

                    NomeUtilizador = t.IdUtilizadorNavigation != null
                        ? t.IdUtilizadorNavigation.Nome
                        : null
                })
                .ToListAsync();

            return Ok(tarefas);
        }

        // ============================================================
        // GET: api/Tarefas/5
        // ============================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<TarefaDto>> GetTarefa(int id)
        {
            var tarefa = await _context.Tarefas
                .AsNoTracking()
                .Where(t => t.IdTarefa == id)
                .Select(t => new TarefaDto
                {
                    IdTarefa = t.IdTarefa,
                    IdProjeto = t.IdProjeto,
                    IdUtilizador = t.IdUtilizador,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    Data = t.Data,
                    Horas = t.Horas,
                    Estado = t.Estado,
                    Prioridade = t.Prioridade,
                    DataCriacao = t.DataCriacao,

                    NomeProjeto = t.IdProjetoNavigation.Nome,

                    NomeUtilizador = t.IdUtilizadorNavigation != null
                        ? t.IdUtilizadorNavigation.Nome
                        : null
                })
                .FirstOrDefaultAsync();

            if (tarefa == null)
            {
                return NotFound(new
                {
                    mensagem = "Tarefa não encontrada."
                });
            }

            return Ok(tarefa);
        }

        // ============================================================
        // GET: api/Tarefas/projeto/1
        // ============================================================
        [HttpGet("projeto/{idProjeto}")]
        public async Task<ActionResult<IEnumerable<TarefaDto>>> GetTarefasPorProjeto(
            int idProjeto)
        {
            var projetoExiste = await _context.Projetos
                .AnyAsync(p =>
                    p.IdProjeto == idProjeto &&
                    p.Ativo);

            if (!projetoExiste)
            {
                return NotFound(new
                {
                    mensagem = "Projeto não encontrado."
                });
            }

            var tarefas = await _context.Tarefas
                .AsNoTracking()
                .Where(t => t.IdProjeto == idProjeto)
                .OrderByDescending(t => t.Data)
                .ThenBy(t => t.Titulo)
                .Select(t => new TarefaDto
                {
                    IdTarefa = t.IdTarefa,
                    IdProjeto = t.IdProjeto,
                    IdUtilizador = t.IdUtilizador,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    Data = t.Data,
                    Horas = t.Horas,
                    Estado = t.Estado,
                    Prioridade = t.Prioridade,
                    DataCriacao = t.DataCriacao,

                    NomeProjeto = t.IdProjetoNavigation.Nome,

                    NomeUtilizador = t.IdUtilizadorNavigation != null
                        ? t.IdUtilizadorNavigation.Nome
                        : null
                })
                .ToListAsync();

            return Ok(tarefas);
        }

        // ============================================================
        // POST: api/Tarefas
        // Administrador, Gestor e Colaborador
        // ============================================================
        [HttpPost]
        [Authorize(Roles = "Administrador,Gestor,Colaborador")]
        public async Task<ActionResult> CriarTarefa(
            TarefaRequestDto request)
        {
            var projetoExiste = await _context.Projetos
                .AnyAsync(p =>
                    p.IdProjeto == request.IdProjeto &&
                    p.Ativo);

            if (!projetoExiste)
            {
                return BadRequest(new
                {
                    mensagem = "O projeto informado não existe ou está inativo."
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
                        mensagem = "O utilizador informado não existe ou está inativo."
                    });
                }
            }

            if (string.IsNullOrWhiteSpace(request.Titulo))
            {
                return BadRequest(new
                {
                    mensagem = "O título da tarefa é obrigatório."
                });
            }

            if (!EstadosPermitidos.Contains(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem = "Estado da tarefa inválido."
                });
            }

            if (!PrioridadesPermitidas.Contains(request.Prioridade))
            {
                return BadRequest(new
                {
                    mensagem = "Prioridade da tarefa inválida."
                });
            }

            if (request.Horas.HasValue &&
                request.Horas.Value < 0)
            {
                return BadRequest(new
                {
                    mensagem = "O número de horas não pode ser negativo."
                });
            }

            var tarefa = new Tarefa
            {
                IdProjeto = request.IdProjeto,
                IdUtilizador = request.IdUtilizador,
                Titulo = request.Titulo.Trim(),

                Descricao =
                    string.IsNullOrWhiteSpace(request.Descricao)
                        ? null
                        : request.Descricao.Trim(),

                Data = request.Data,
                Horas = request.Horas,
                Estado = request.Estado,
                Prioridade = request.Prioridade,
                DataCriacao = DateTime.Now
            };

            _context.Tarefas.Add(tarefa);

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                tarefa.IdProjeto,
                idUtilizadorAutenticado,
                "CRIACAO_TAREFA",
                "Tarefa",
                tarefa.IdTarefa,
                $"Tarefa \"{tarefa.Titulo}\" criada com estado \"{tarefa.Estado}\" e prioridade \"{tarefa.Prioridade}\"."
            );

            return CreatedAtAction(
                nameof(GetTarefa),
                new { id = tarefa.IdTarefa },
                new
                {
                    tarefa.IdTarefa,
                    mensagem = "Tarefa criada com sucesso."
                }
            );
        }

        // ============================================================
        // PUT: api/Tarefas/5
        // Administrador, Gestor e Colaborador
        // ============================================================
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Gestor,Colaborador")]
        public async Task<IActionResult> AtualizarTarefa(
            int id,
            TarefaRequestDto request)
        {
            var tarefa = await _context.Tarefas
                .FirstOrDefaultAsync(t =>
                    t.IdTarefa == id);

            if (tarefa == null)
            {
                return NotFound(new
                {
                    mensagem = "Tarefa não encontrada."
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
                    mensagem = "O projeto informado não existe ou está inativo."
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
                        mensagem = "O utilizador informado não existe ou está inativo."
                    });
                }
            }

            if (string.IsNullOrWhiteSpace(request.Titulo))
            {
                return BadRequest(new
                {
                    mensagem = "O título da tarefa é obrigatório."
                });
            }

            if (!EstadosPermitidos.Contains(request.Estado))
            {
                return BadRequest(new
                {
                    mensagem = "Estado da tarefa inválido."
                });
            }

            if (!PrioridadesPermitidas.Contains(request.Prioridade))
            {
                return BadRequest(new
                {
                    mensagem = "Prioridade da tarefa inválida."
                });
            }

            if (request.Horas.HasValue &&
                request.Horas.Value < 0)
            {
                return BadRequest(new
                {
                    mensagem = "O número de horas não pode ser negativo."
                });
            }

            var projetoAnterior = tarefa.IdProjeto;
            var tituloAnterior = tarefa.Titulo;
            var estadoAnterior = tarefa.Estado;
            var prioridadeAnterior = tarefa.Prioridade;
            var utilizadorAnterior = tarefa.IdUtilizador;
            var horasAnterior = tarefa.Horas;

            tarefa.IdProjeto = request.IdProjeto;
            tarefa.IdUtilizador = request.IdUtilizador;
            tarefa.Titulo = request.Titulo.Trim();

            tarefa.Descricao =
                string.IsNullOrWhiteSpace(request.Descricao)
                    ? null
                    : request.Descricao.Trim();

            tarefa.Data = request.Data;
            tarefa.Horas = request.Horas;
            tarefa.Estado = request.Estado;
            tarefa.Prioridade = request.Prioridade;

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            var descricao =
                $"Tarefa #{tarefa.IdTarefa} \"{tarefa.Titulo}\" atualizada.";

            if (tituloAnterior != tarefa.Titulo)
            {
                descricao +=
                    $" Título alterado de \"{tituloAnterior}\" para \"{tarefa.Titulo}\".";
            }

            if (estadoAnterior != tarefa.Estado)
            {
                descricao +=
                    $" Estado alterado de \"{estadoAnterior}\" para \"{tarefa.Estado}\".";
            }

            if (prioridadeAnterior != tarefa.Prioridade)
            {
                descricao +=
                    $" Prioridade alterada de \"{prioridadeAnterior}\" para \"{tarefa.Prioridade}\".";
            }

            if (projetoAnterior != tarefa.IdProjeto)
            {
                descricao +=
                    $" Projeto alterado de #{projetoAnterior} para #{tarefa.IdProjeto}.";
            }

            if (utilizadorAnterior != tarefa.IdUtilizador)
            {
                descricao +=
                    $" Responsável da tarefa alterado.";
            }

            if (horasAnterior != tarefa.Horas)
            {
                descricao +=
                    $" Horas alteradas de {horasAnterior?.ToString() ?? "não definidas"} para {tarefa.Horas?.ToString() ?? "não definidas"}.";
            }

            await _historicoService.RegistarAsync(
                tarefa.IdProjeto,
                idUtilizadorAutenticado,
                "ATUALIZACAO_TAREFA",
                "Tarefa",
                tarefa.IdTarefa,
                descricao
            );

            return NoContent();
        }

        // ============================================================
        // DELETE: api/Tarefas/5
        // Apenas Administrador ou Gestor
        // ============================================================
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> EliminarTarefa(int id)
        {
            var tarefa = await _context.Tarefas
                .FindAsync(id);

            if (tarefa == null)
            {
                return NotFound(new
                {
                    mensagem = "Tarefa não encontrada."
                });
            }

            // Guardamos os dados antes da eliminação física
            var idProjeto = tarefa.IdProjeto;
            var idTarefa = tarefa.IdTarefa;
            var titulo = tarefa.Titulo;
            var estado = tarefa.Estado;

            _context.Tarefas.Remove(tarefa);

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                idProjeto,
                idUtilizadorAutenticado,
                "ELIMINACAO_TAREFA",
                "Tarefa",
                idTarefa,
                $"Tarefa #{idTarefa} \"{titulo}\" eliminada. Estado anterior: \"{estado}\"."
            );

            return NoContent();
        }
    }
}