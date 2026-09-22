using GestaoProjetos.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestaoProjetos.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificacoesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificacoesController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notificacoes
        [HttpGet]
        public async Task<IActionResult> GetNotificacoes()
        {
            var idClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var perfil = User.FindFirstValue(
                ClaimTypes.Role) ?? "";

            if (!int.TryParse(
                idClaim,
                out var idUtilizador))
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador."
                });
            }

            var hoje = DateOnly.FromDateTime(
                DateTime.Now);

            var limitePrazo =
                hoje.AddDays(3);

            var notificacoes =
                new List<NotificacaoResponse>();

            /*
             * =====================================================
             * TAREFAS
             * =====================================================
             *
             * Administrador e Gestor:
             * veem as tarefas de toda a plataforma.
             *
             * Colaborador:
             * vê apenas tarefas atribuídas a ele.
             */

            var queryTarefas =
                _context.Tarefas
                    .AsNoTracking()
                    .Include(t =>
                        t.IdProjetoNavigation)
                    .AsQueryable();

            if (perfil == "Colaborador")
            {
                queryTarefas =
                    queryTarefas.Where(
                        t =>
                            t.IdUtilizador ==
                            idUtilizador);
            }

            var tarefas =
                await queryTarefas
                    .Where(t =>
                        t.Estado != "Concluída" &&
                        t.Estado != "Cancelada")
                    .ToListAsync();

            /*
             * =====================================================
             * TAREFAS ATRASADAS
             * =====================================================
             */

            foreach (
                var tarefa in tarefas
                    .Where(t =>
                        t.Data < hoje)
                    .OrderBy(t =>
                        t.Data))
            {
                var diasAtraso =
                    hoje.DayNumber -
                    tarefa.Data.DayNumber;

                var textoDias =
                    diasAtraso == 1
                        ? "1 dia de atraso"
                        : $"{diasAtraso} dias de atraso";

                notificacoes.Add(
                    new NotificacaoResponse
                    {
                        Id =
                            $"tarefa-atrasada-{tarefa.IdTarefa}",

                        Tipo =
                            "TarefaAtrasada",

                        Nivel =
                            "Critico",

                        Titulo =
                            "Tarefa atrasada",

                        Mensagem =
                            tarefa.Titulo,

                        Detalhe =
                            $"{ObterNomeProjeto(tarefa.IdProjetoNavigation)} • {textoDias}",

                        IdProjeto =
                            tarefa.IdProjeto,

                        IdTarefa =
                            tarefa.IdTarefa,

                        DataReferencia =
                            tarefa.Data.ToDateTime(
                                TimeOnly.MinValue),

                        Prioridade =
                            tarefa.Prioridade
                    });
            }

            /*
             * =====================================================
             * TAREFAS COM PRAZO PRÓXIMO
             * Hoje até aos próximos 3 dias.
             * =====================================================
             */

            foreach (
                var tarefa in tarefas
                    .Where(t =>
                        t.Data >= hoje &&
                        t.Data <= limitePrazo)
                    .OrderBy(t =>
                        t.Data))
            {
                var diasRestantes =
                    tarefa.Data.DayNumber -
                    hoje.DayNumber;

                string prazo;

                if (diasRestantes == 0)
                {
                    prazo = "Vence hoje";
                }
                else if (diasRestantes == 1)
                {
                    prazo = "Vence amanhã";
                }
                else
                {
                    prazo =
                        $"Vence em {diasRestantes} dias";
                }

                notificacoes.Add(
                    new NotificacaoResponse
                    {
                        Id =
                            $"tarefa-prazo-{tarefa.IdTarefa}",

                        Tipo =
                            "PrazoProximo",

                        Nivel =
                            diasRestantes == 0
                                ? "Critico"
                                : "Aviso",

                        Titulo =
                            diasRestantes == 0
                                ? "Tarefa vence hoje"
                                : "Prazo próximo",

                        Mensagem =
                            tarefa.Titulo,

                        Detalhe =
                            $"{ObterNomeProjeto(tarefa.IdProjetoNavigation)} • {prazo}",

                        IdProjeto =
                            tarefa.IdProjeto,

                        IdTarefa =
                            tarefa.IdTarefa,

                        DataReferencia =
                            tarefa.Data.ToDateTime(
                                TimeOnly.MinValue),

                        Prioridade =
                            tarefa.Prioridade
                    });
            }

            /*
             * =====================================================
             * TAREFAS URGENTES
             * =====================================================
             *
             * Só adicionamos como "urgente" se a tarefa não estiver
             * já atrasada nem dentro do período de 3 dias.
             *
             * Isso evita mostrar a mesma tarefa duas vezes.
             */

            foreach (
                var tarefa in tarefas
                    .Where(t =>
                        t.Prioridade == "Urgente" &&
                        t.Data > limitePrazo)
                    .OrderBy(t =>
                        t.Data))
            {
                notificacoes.Add(
                    new NotificacaoResponse
                    {
                        Id =
                            $"tarefa-urgente-{tarefa.IdTarefa}",

                        Tipo =
                            "TarefaUrgente",

                        Nivel =
                            "Aviso",

                        Titulo =
                            "Tarefa urgente",

                        Mensagem =
                            tarefa.Titulo,

                        Detalhe =
                            $"{ObterNomeProjeto(tarefa.IdProjetoNavigation)} • Prazo {tarefa.Data:dd/MM/yyyy}",

                        IdProjeto =
                            tarefa.IdProjeto,

                        IdTarefa =
                            tarefa.IdTarefa,

                        DataReferencia =
                            tarefa.Data.ToDateTime(
                                TimeOnly.MinValue),

                        Prioridade =
                            tarefa.Prioridade
                    });
            }

            /*
             * =====================================================
             * ALTERAÇÕES PENDENTES / EM ANÁLISE
             * =====================================================
             *
             * Estas notificações são apresentadas a Administradores
             * e Gestores.
             */

            if (
                perfil == "Administrador" ||
                perfil == "Gestor")
            {
                var alteracoes =
                    await _context.Alteracoes
                        .AsNoTracking()
                        .Include(a =>
                            a.IdProjetoNavigation)
                        .Where(a =>
                            a.Estado == "Pendente" ||
                            a.Estado == "Em análise")
                        .OrderByDescending(a =>
                            a.DataAlteracao)
                        .ToListAsync();

                foreach (
                    var alteracao in alteracoes)
                {
                    var estadoTexto =
                        alteracao.Estado ==
                        "Em análise"
                            ? "Em análise"
                            : "Pendente";

                    notificacoes.Add(
                        new NotificacaoResponse
                        {
                            Id =
                                $"alteracao-{alteracao.IdAlteracao}",

                            Tipo =
                                "Alteracao",

                            Nivel =
                                alteracao.Estado ==
                                "Pendente"
                                    ? "Aviso"
                                    : "Informacao",

                            Titulo =
                                alteracao.Estado ==
                                "Pendente"
                                    ? "Alteração pendente"
                                    : "Alteração em análise",

                            Mensagem =
                                alteracao.Descricao,

                            Detalhe =
                                $"{ObterNomeProjeto(alteracao.IdProjetoNavigation)} • {estadoTexto}",

                            IdProjeto =
                                alteracao.IdProjeto,

                            IdAlteracao =
                                alteracao.IdAlteracao,

                            DataReferencia =
                                alteracao.DataAlteracao
                        });
                }
            }

            /*
             * =====================================================
             * ORDENAÇÃO
             * =====================================================
             *
             * 1 - Crítico
             * 2 - Aviso
             * 3 - Informação
             *
             * Dentro do mesmo nível, a data mais próxima vem antes.
             */

            var resultado =
                notificacoes
                    .OrderBy(n =>
                        ObterOrdemNivel(
                            n.Nivel))
                    .ThenBy(n =>
                        n.DataReferencia)
                    .ToList();

            return Ok(new
            {
                total =
                    resultado.Count,

                notificacoes =
                    resultado
            });
        }

        // GET: api/Notificacoes/contador
        [HttpGet("contador")]
        public async Task<IActionResult> GetContador()
        {
            var idClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            var perfil = User.FindFirstValue(
                ClaimTypes.Role) ?? "";

            if (!int.TryParse(
                idClaim,
                out var idUtilizador))
            {
                return Unauthorized(new
                {
                    mensagem =
                        "Não foi possível identificar o utilizador."
                });
            }

            var hoje =
                DateOnly.FromDateTime(
                    DateTime.Now);

            var limitePrazo =
                hoje.AddDays(3);

            var queryTarefas =
                _context.Tarefas
                    .AsNoTracking()
                    .Where(t =>
                        t.Estado != "Concluída" &&
                        t.Estado != "Cancelada");

            if (perfil == "Colaborador")
            {
                queryTarefas =
                    queryTarefas.Where(
                        t =>
                            t.IdUtilizador ==
                            idUtilizador);
            }

            var totalTarefas =
                await queryTarefas
                    .CountAsync(t =>
                        t.Data <= limitePrazo ||
                        t.Prioridade == "Urgente");

            var totalAlteracoes = 0;

            if (
                perfil == "Administrador" ||
                perfil == "Gestor")
            {
                totalAlteracoes =
                    await _context.Alteracoes
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.Estado == "Pendente" ||
                            a.Estado == "Em análise");
            }

            return Ok(new
            {
                total =
                    totalTarefas +
                    totalAlteracoes
            });
        }

        private static int ObterOrdemNivel(
            string nivel)
        {
            return nivel switch
            {
                "Critico" => 1,
                "Aviso" => 2,
                "Informacao" => 3,
                _ => 4
            };
        }

        private static string ObterNomeProjeto(
            GestaoProjetos.Models.Projeto projeto)
        {
            if (
                !string.IsNullOrWhiteSpace(
                    projeto.Codigo) &&
                !string.IsNullOrWhiteSpace(
                    projeto.Nome))
            {
                return
                    $"{projeto.Codigo} - {projeto.Nome}";
            }

            if (
                !string.IsNullOrWhiteSpace(
                    projeto.Nome))
            {
                return projeto.Nome;
            }

            return
                $"Projeto #{projeto.IdProjeto}";
        }

        private sealed class NotificacaoResponse
        {
            public string Id { get; set; } =
                string.Empty;

            public string Tipo { get; set; } =
                string.Empty;

            public string Nivel { get; set; } =
                string.Empty;

            public string Titulo { get; set; } =
                string.Empty;

            public string Mensagem { get; set; } =
                string.Empty;

            public string Detalhe { get; set; } =
                string.Empty;

            public int? IdProjeto { get; set; }

            public int? IdTarefa { get; set; }

            public int? IdAlteracao { get; set; }

            public DateTime DataReferencia
            {
                get;
                set;
            }

            public string? Prioridade
            {
                get;
                set;
            }
        }
    }
}