using GestaoProjetos.Data;
using GestaoProjetos.Models;

namespace GestaoProjetos.Services
{
    public class HistoricoService
    {
        private readonly ApplicationDbContext _context;

        public HistoricoService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task RegistarAsync(
            int? idProjeto,
            int? idUtilizador,
            string acao,
            string? entidade = null,
            int? idRegisto = null,
            string? descricao = null)
        {
            if (string.IsNullOrWhiteSpace(acao))
            {
                throw new ArgumentException(
                    "A ação do histórico é obrigatória.",
                    nameof(acao));
            }

            var historico = new Historico
            {
                IdProjeto = idProjeto,
                IdUtilizador = idUtilizador,

                Acao = acao.Trim(),

                Entidade =
                    string.IsNullOrWhiteSpace(entidade)
                        ? null
                        : entidade.Trim(),

                IdRegisto = idRegisto,

                Descricao =
                    string.IsNullOrWhiteSpace(descricao)
                        ? null
                        : descricao.Trim(),

                DataAcao = DateTime.Now
            };

            _context.Historicos.Add(historico);

            await _context.SaveChangesAsync();
        }
    }
}