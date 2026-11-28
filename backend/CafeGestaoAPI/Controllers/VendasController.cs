using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Vendas;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class VendasController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNaoEncontrada = "Venda não encontrada.";

        private const string MensagemNotaDuplicada = "Já existe uma venda com esta nota fiscal.";

        private const string MensagemVendaCancelada = "Esta venda está cancelada e não pode mais ser alterada.";

        private const string CampoCliente = "clienteId";

        private const string CampoNotaFiscal = "notaFiscal";

        private const string CampoDataVenda = "dataVenda";

        private const string CampoItens = "itens";

        public VendasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<VendaResumoDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] int? clienteId,
            [FromQuery] StatusVenda? status,
            [FromQuery] DateOnly? dataInicio,
            [FromQuery] DateOnly? dataFim)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Vendas
                .AsNoTracking()
                .Where(v => v.Cliente.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(v => (v.NotaFiscal != null && v.NotaFiscal.Contains(termo)) || v.Cliente.Nome.Contains(termo));
            }

            if (clienteId.HasValue)
            {
                consulta = consulta.Where(v => v.ClienteId == clienteId.Value);
            }

            if (status.HasValue)
            {
                consulta = consulta.Where(v => v.Status == status.Value);
            }

            if (dataInicio.HasValue)
            {
                consulta = consulta.Where(v => v.DataVenda >= dataInicio.Value);
            }

            if (dataFim.HasValue)
            {
                consulta = consulta.Where(v => v.DataVenda <= dataFim.Value);
            }

            var vendas = await consulta
                .OrderByDescending(v => v.DataVenda)
                .ThenByDescending(v => v.Id)
                .Select(v => new VendaResumoDto
                {
                    Id = v.Id,
                    NotaFiscal = v.NotaFiscal,
                    DataVenda = v.DataVenda,
                    Status = v.Status,
                    ClienteId = v.ClienteId,
                    NomeCliente = v.Cliente.Nome,
                    QuantidadeItens = v.ItensVenda.Count(),
                    QuantidadeTotalKg = v.ItensVenda.Sum(i => i.Quantidade),
                    ValorTotal = v.ValorTotal
                })
                .ToListAsync();

            return Ok(vendas);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<VendaRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var venda = await ConsultarPorId(id, usuarioId);

            if (venda is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(venda);
        }

        [HttpPost]
        public async Task<ActionResult<VendaRespostaDto>> Cadastrar(VendaSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var cliente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.ClienteId && c.UsuarioId == usuarioId);

            if (cliente is null)
            {
                return ConflitoNoCampo(CampoCliente, "Cliente não encontrado.");
            }

            if (!cliente.Ativo)
            {
                return ConflitoNoCampo(CampoCliente, "O cliente está inativo. Reative-o para registrar novas vendas.");
            }

            var notaFiscal = TextoOuNulo(dto.NotaFiscal);

            if (await NotaFiscalDuplicada(notaFiscal, usuarioId, idIgnorado: null))
            {
                return ConflitoNoCampo(CampoNotaFiscal, MensagemNotaDuplicada);
            }

            var venda = new Venda
            {
                NotaFiscal = notaFiscal,
                DataVenda = dto.DataVenda!.Value,
                Status = dto.Status!.Value,
                ClienteId = cliente.Id
            };

            var erroItens = await AplicarItens(venda, dto, usuarioId);

            if (erroItens is not null)
            {
                return erroItens;
            }

            _context.Vendas.Add(venda);
            await _context.SaveChangesAsync();

            var resposta = await ConsultarPorId(venda.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = venda.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, VendaSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var venda = await _context.Vendas
                .Include(v => v.ItensVenda)
                .FirstOrDefaultAsync(v => v.Id == id && v.Cliente.UsuarioId == usuarioId);

            if (venda is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (venda.Status == StatusVenda.Cancelada)
            {
                return Conflict(new { mensagem = MensagemVendaCancelada });
            }

            if (dto.ClienteId != venda.ClienteId)
            {
                var novoCliente = await _context.Clientes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == dto.ClienteId && c.UsuarioId == usuarioId);

                if (novoCliente is null)
                {
                    return ConflitoNoCampo(CampoCliente, "Cliente não encontrado.");
                }

                if (!novoCliente.Ativo)
                {
                    return ConflitoNoCampo(CampoCliente, "O cliente selecionado está inativo.");
                }
            }

            var notaFiscal = TextoOuNulo(dto.NotaFiscal);

            if (await NotaFiscalDuplicada(notaFiscal, usuarioId, idIgnorado: id))
            {
                return ConflitoNoCampo(CampoNotaFiscal, MensagemNotaDuplicada);
            }

            var erroItens = await AplicarItens(venda, dto, usuarioId);

            if (erroItens is not null)
            {
                return erroItens;
            }

            venda.NotaFiscal = notaFiscal;
            venda.DataVenda = dto.DataVenda!.Value;
            venda.Status = dto.Status!.Value;
            venda.ClienteId = dto.ClienteId!.Value;
            _context.Entry(venda).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id:int}/cancelar")]
        public async Task<IActionResult> Cancelar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var venda = await _context.Vendas
                .Include(v => v.ItensVenda)
                    .ThenInclude(i => i.LoteCafe)
                .FirstOrDefaultAsync(v => v.Id == id && v.Cliente.UsuarioId == usuarioId);

            if (venda is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (venda.Status == StatusVenda.Cancelada)
            {
                return Conflict(new { mensagem = "Esta venda já está cancelada." });
            }

            foreach (var item in venda.ItensVenda)
            {
                item.LoteCafe.SaldoKg += item.Quantidade;
            }

            venda.Status = StatusVenda.Cancelada;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<ConflictObjectResult?> AplicarItens(Venda venda, VendaSalvarDto dto, int usuarioId)
        {
            var itensAntigos = venda.ItensVenda.ToDictionary(i => i.LoteCafeId);
            var novosPorLote = dto.Itens.ToDictionary(i => i.LoteCafeId!.Value);

            var idsEnvolvidos = itensAntigos.Keys.Union(novosPorLote.Keys).ToList();

            var lotes = await _context.LotesCafe
                .Where(l => l.UsuarioId == usuarioId && idsEnvolvidos.Contains(l.Id))
                .ToDictionaryAsync(l => l.Id);

            foreach (var loteId in novosPorLote.Keys)
            {
                if (!lotes.TryGetValue(loteId, out var lote))
                {
                    return ConflitoNoCampo(CampoItens, "Um dos lotes informados não foi encontrado.");
                }

                if (!lote.Ativo && !itensAntigos.ContainsKey(loteId))
                {
                    return ConflitoNoCampo(CampoItens, $"O lote \"{lote.Nome}\" está inativo. Reative-o para incluí-lo na venda.");
                }

                if (dto.DataVenda < lote.DataArmazenamento)
                {
                    return ConflitoNoCampo(
                        CampoDataVenda,
                        $"A data da venda não pode ser anterior ao armazenamento do lote \"{lote.Nome}\" ({lote.DataArmazenamento:dd/MM/yyyy}).");
                }
            }

            foreach (var loteId in idsEnvolvidos)
            {
                var lote = lotes[loteId];
                var quantidadeAntiga = itensAntigos.TryGetValue(loteId, out var antigo) ? antigo.Quantidade : 0;
                var quantidadeNova = novosPorLote.TryGetValue(loteId, out var novo) ? novo.Quantidade!.Value : 0;

                var saldoResultante = lote.SaldoKg + quantidadeAntiga - quantidadeNova;

                if (saldoResultante < 0)
                {
                    var disponivel = lote.SaldoKg + quantidadeAntiga;

                    return ConflitoNoCampo(
                        CampoItens,
                        $"O lote \"{lote.Nome}\" tem apenas {ConversaoPeso.FormatarQuilogramas(disponivel)} disponíveis para esta venda.");
                }

                lote.SaldoKg = saldoResultante;
            }

            foreach (var (loteId, antigo) in itensAntigos)
            {
                if (!novosPorLote.ContainsKey(loteId))
                {
                    _context.ItensVenda.Remove(antigo);
                }
            }

            foreach (var (loteId, novo) in novosPorLote)
            {
                if (itensAntigos.TryGetValue(loteId, out var existente))
                {
                    existente.Quantidade = novo.Quantidade!.Value;
                    existente.ValorUnitario = novo.ValorUnitario!.Value;
                }
                else
                {
                    venda.ItensVenda.Add(new ItemVenda
                    {
                        LoteCafeId = loteId,
                        Quantidade = novo.Quantidade!.Value,
                        ValorUnitario = novo.ValorUnitario!.Value
                    });
                }
            }

            venda.ValorTotal = dto.Itens.Sum(i => CalcularSubtotal(i.Quantidade!.Value, i.ValorUnitario!.Value));

            return null;
        }

        private static decimal CalcularSubtotal(decimal quantidade, decimal valorUnitario) =>
            Math.Round(quantidade * valorUnitario, 2, MidpointRounding.AwayFromZero);

        private Task<bool> NotaFiscalDuplicada(string? notaFiscal, int usuarioId, int? idIgnorado)
        {
            if (notaFiscal is null)
            {
                return Task.FromResult(false);
            }

            return _context.Vendas
                .AsNoTracking()
                .AnyAsync(v => v.Cliente.UsuarioId == usuarioId
                            && v.NotaFiscal == notaFiscal
                            && (idIgnorado == null || v.Id != idIgnorado));
        }

        private Task<VendaRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Vendas
                .AsNoTracking()
                .Where(v => v.Id == id && v.Cliente.UsuarioId == usuarioId)
                .Select(v => new VendaRespostaDto
                {
                    Id = v.Id,
                    NotaFiscal = v.NotaFiscal,
                    DataVenda = v.DataVenda,
                    Status = v.Status,
                    ClienteId = v.ClienteId,
                    NomeCliente = v.Cliente.Nome,
                    CpfCnpjCliente = v.Cliente.CpfCnpj,
                    ClienteAtivo = v.Cliente.Ativo,
                    QuantidadeTotalKg = v.ItensVenda.Sum(i => i.Quantidade),
                    ValorTotal = v.ValorTotal,
                    Itens = v.ItensVenda
                        .OrderBy(i => i.LoteCafe.Nome)
                        .Select(i => new ItemVendaRespostaDto
                        {
                            LoteCafeId = i.LoteCafeId,
                            NomeLote = i.LoteCafe.Nome,
                            AnoAgricolaSafra = i.LoteCafe.Safra.AnoAgricola,
                            LoteAtivo = i.LoteCafe.Ativo,
                            SaldoKgLote = i.LoteCafe.SaldoKg,
                            Quantidade = i.Quantidade,
                            ValorUnitario = i.ValorUnitario,
                            Subtotal = Math.Round(i.Quantidade * i.ValorUnitario, 2)
                        })
                        .ToList(),
                    DataCriacao = v.DataCriacao,
                    DataAtualizacao = v.DataAtualizacao
                })
                .FirstOrDefaultAsync();
        }

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });
    }
}
