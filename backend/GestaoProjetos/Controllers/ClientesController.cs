using GestaoProjetos.Data;
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
    public class ClientesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly HistoricoService _historicoService;

        public ClientesController(
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
        // GET: api/Clientes
        // Retorna ativos e inativos
        // =====================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            var clientes = await _context.Clientes
                .AsNoTracking()
                .OrderByDescending(c => c.Ativo)
                .ThenBy(c => c.Nome)
                .ToListAsync();

            return Ok(clientes);
        }

        // =====================================================
        // GET: api/Clientes/5
        // =====================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.IdCliente == id);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensagem = "Cliente não encontrado."
                });
            }

            return Ok(cliente);
        }

        // =====================================================
        // POST: api/Clientes
        // Administrador ou Gestor
        // =====================================================

        [HttpPost]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<ActionResult<Cliente>> CriarCliente(
            Cliente cliente)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(cliente.Nome))
            {
                return BadRequest(new
                {
                    mensagem = "O nome do cliente é obrigatório."
                });
            }

            cliente.IdCliente = 0;

            cliente.Nome = cliente.Nome.Trim();

            cliente.Empresa =
                string.IsNullOrWhiteSpace(cliente.Empresa)
                    ? null
                    : cliente.Empresa.Trim();

            cliente.Telefone =
                string.IsNullOrWhiteSpace(cliente.Telefone)
                    ? null
                    : cliente.Telefone.Trim();

            cliente.Email =
                string.IsNullOrWhiteSpace(cliente.Email)
                    ? null
                    : cliente.Email.Trim();

            cliente.Morada =
                string.IsNullOrWhiteSpace(cliente.Morada)
                    ? null
                    : cliente.Morada.Trim();

            cliente.Observacoes =
                string.IsNullOrWhiteSpace(cliente.Observacoes)
                    ? null
                    : cliente.Observacoes.Trim();

            cliente.Ativo = true;
            cliente.DataCriacao = DateTime.Now;

            _context.Clientes.Add(cliente);

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "CRIACAO_CLIENTE",
                "Cliente",
                cliente.IdCliente,
                $"Cliente #{cliente.IdCliente} \"{cliente.Nome}\" criado."
            );

            return CreatedAtAction(
                nameof(GetCliente),
                new { id = cliente.IdCliente },
                cliente
            );
        }

        // =====================================================
        // PUT: api/Clientes/5
        // Administrador ou Gestor
        // =====================================================

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> AtualizarCliente(
            int id,
            Cliente cliente)
        {
            if (id != cliente.IdCliente)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O ID informado na URL é diferente do ID do cliente."
                });
            }

            if (string.IsNullOrWhiteSpace(cliente.Nome))
            {
                return BadRequest(new
                {
                    mensagem = "O nome do cliente é obrigatório."
                });
            }

            var clienteExistente = await _context.Clientes
                .FirstOrDefaultAsync(c =>
                    c.IdCliente == id &&
                    c.Ativo);

            if (clienteExistente == null)
            {
                return NotFound(new
                {
                    mensagem =
                        "Cliente não encontrado ou encontra-se inativo."
                });
            }

            var nomeAnterior =
                clienteExistente.Nome;

            var empresaAnterior =
                clienteExistente.Empresa;

            var telefoneAnterior =
                clienteExistente.Telefone;

            var emailAnterior =
                clienteExistente.Email;

            var moradaAnterior =
                clienteExistente.Morada;

            clienteExistente.Nome =
                cliente.Nome.Trim();

            clienteExistente.Empresa =
                string.IsNullOrWhiteSpace(cliente.Empresa)
                    ? null
                    : cliente.Empresa.Trim();

            clienteExistente.Telefone =
                string.IsNullOrWhiteSpace(cliente.Telefone)
                    ? null
                    : cliente.Telefone.Trim();

            clienteExistente.Email =
                string.IsNullOrWhiteSpace(cliente.Email)
                    ? null
                    : cliente.Email.Trim();

            clienteExistente.Morada =
                string.IsNullOrWhiteSpace(cliente.Morada)
                    ? null
                    : cliente.Morada.Trim();

            clienteExistente.Observacoes =
                string.IsNullOrWhiteSpace(cliente.Observacoes)
                    ? null
                    : cliente.Observacoes.Trim();

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            var descricao =
                $"Cliente #{clienteExistente.IdCliente} atualizado.";

            if (nomeAnterior != clienteExistente.Nome)
            {
                descricao +=
                    $" Nome alterado de \"{nomeAnterior}\" para \"{clienteExistente.Nome}\".";
            }

            if (empresaAnterior != clienteExistente.Empresa)
            {
                descricao +=
                    $" Empresa alterada de \"{empresaAnterior ?? "não definida"}\" para \"{clienteExistente.Empresa ?? "não definida"}\".";
            }

            if (telefoneAnterior != clienteExistente.Telefone)
            {
                descricao += " Telefone alterado.";
            }

            if (emailAnterior != clienteExistente.Email)
            {
                descricao += " Email alterado.";
            }

            if (moradaAnterior != clienteExistente.Morada)
            {
                descricao += " Morada alterada.";
            }

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "ATUALIZACAO_CLIENTE",
                "Cliente",
                clienteExistente.IdCliente,
                descricao
            );

            return NoContent();
        }

        // =====================================================
        // DELETE: api/Clientes/5
        // Administrador ou Gestor
        // DESATIVAÇÃO LÓGICA
        // =====================================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> DesativarCliente(int id)
        {
            var cliente = await _context.Clientes
                .FindAsync(id);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensagem = "Cliente não encontrado."
                });
            }

            if (!cliente.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O cliente já se encontra inativo."
                });
            }

            cliente.Ativo = false;

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "DESATIVACAO_CLIENTE",
                "Cliente",
                cliente.IdCliente,
                $"Cliente #{cliente.IdCliente} \"{cliente.Nome}\" desativado."
            );

            return NoContent();
        }

        // =====================================================
        // PUT: api/Clientes/5/reativar
        // Administrador ou Gestor
        // =====================================================

        [HttpPut("{id}/reativar")]
        [Authorize(Roles = "Administrador,Gestor")]
        public async Task<IActionResult> ReativarCliente(int id)
        {
            var cliente = await _context.Clientes
                .FindAsync(id);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensagem = "Cliente não encontrado."
                });
            }

            if (cliente.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "O cliente já se encontra ativo."
                });
            }

            cliente.Ativo = true;

            await _context.SaveChangesAsync();

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "REATIVACAO_CLIENTE",
                "Cliente",
                cliente.IdCliente,
                $"Cliente #{cliente.IdCliente} \"{cliente.Nome}\" reativado."
            );

            return NoContent();
        }

        // =====================================================
        // DELETE: api/Clientes/5/permanente
        // SOMENTE ADMINISTRADOR
        // Exclusão física definitiva
        // =====================================================

        [HttpDelete("{id}/permanente")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ExcluirClientePermanente(int id)
        {
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c =>
                    c.IdCliente == id);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensagem = "Cliente não encontrado."
                });
            }

            // Por segurança, primeiro deve estar inativo.
            if (cliente.Ativo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Para excluir definitivamente um cliente, desative-o primeiro."
                });
            }

            // Não permitir exclusão se existirem projetos associados.
            var possuiProjetos = await _context.Projetos
                .AnyAsync(p =>
                    p.IdCliente == id);

            if (possuiProjetos)
            {
                return Conflict(new
                {
                    mensagem =
                        "Não é possível excluir definitivamente este cliente porque existem projetos associados."
                });
            }

            var idUtilizadorAutenticado =
                ObterIdUtilizadorAutenticado();

            var idCliente =
                cliente.IdCliente;

            var nomeCliente =
                cliente.Nome;

            // Registar antes da exclusão física.
            await _historicoService.RegistarAsync(
                null,
                idUtilizadorAutenticado,
                "EXCLUSAO_PERMANENTE_CLIENTE",
                "Cliente",
                idCliente,
                $"Cliente #{idCliente} \"{nomeCliente}\" excluído permanentemente."
            );

            _context.Clientes.Remove(cliente);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}