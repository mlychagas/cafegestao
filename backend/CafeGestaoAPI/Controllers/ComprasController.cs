using System.Globalization;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Compras;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ComprasController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly CultureInfo PtBr = new("pt-BR");

        private const string MensagemNaoEncontrada = "Compra não encontrada.";

        private const string CampoFornecedor = "fornecedorId";

        private const string CampoNotaFiscal = "notaFiscal";

        public ComprasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<CompraResumoDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] int? fornecedorId,
            [FromQuery] DateOnly? dataInicio,
            [FromQuery] DateOnly? dataFim)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.OrdensCompra
                .AsNoTracking()
                .Where(o => o.Fornecedor.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(o => o.NotaFiscal.Contains(termo) || o.Fornecedor.RazaoSocial.Contains(termo));
            }

            if (fornecedorId.HasValue)
            {
                consulta = consulta.Where(o => o.FornecedorId == fornecedorId.Value);
            }

            if (dataInicio.HasValue)
            {
                consulta = consulta.Where(o => o.DataCompra >= dataInicio.Value);
            }

            if (dataFim.HasValue)
            {
                consulta = consulta.Where(o => o.DataCompra <= dataFim.Value);
            }

            var compras = await consulta
                .OrderByDescending(o => o.DataCompra)
                .ThenByDescending(o => o.Id)
                .Select(o => new CompraResumoDto
                {
                    Id = o.Id,
                    NotaFiscal = o.NotaFiscal,
                    DataCompra = o.DataCompra,
                    FornecedorId = o.FornecedorId,
                    NomeFornecedor = o.Fornecedor.RazaoSocial,
                    QuantidadeItens = o.ItensCompra.Count(),
                    ValorTotal = o.ValorTotal
                })
                .ToListAsync();

            return Ok(compras);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CompraRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var compra = await ConsultarPorId(id, usuarioId);

            if (compra is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(compra);
        }

        [HttpPost]
        public async Task<ActionResult<CompraRespostaDto>> Cadastrar(CompraSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var fornecedor = await _context.Fornecedores
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == dto.FornecedorId && f.UsuarioId == usuarioId);

            if (fornecedor is null)
            {
                return ConflitoNoCampo(CampoFornecedor, "Fornecedor não encontrado.");
            }

            if (!fornecedor.Ativo)
            {
                return ConflitoNoCampo(CampoFornecedor, "O fornecedor está inativo. Reative-o para registrar novas compras.");
            }

            var notaFiscal = dto.NotaFiscal.Trim();

            if (await NotaFiscalDuplicada(notaFiscal, fornecedor.Id, idIgnorado: null))
            {
                return ConflitoNoCampo(CampoNotaFiscal, "Já existe uma compra deste fornecedor com esta nota fiscal.");
            }

            var compra = new OrdemCompra
            {
                NotaFiscal = notaFiscal,
                DataCompra = dto.DataCompra!.Value,
                FornecedorId = fornecedor.Id
            };

            var erroItens = await AplicarItens(compra, dto.Itens, usuarioId);

            if (erroItens is not null)
            {
                return Conflict(new { mensagem = erroItens });
            }

            _context.OrdensCompra.Add(compra);
            await _context.SaveChangesAsync();

            var resposta = await ConsultarPorId(compra.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = compra.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, CompraSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var compra = await _context.OrdensCompra
                .Include(o => o.ItensCompra)
                .FirstOrDefaultAsync(o => o.Id == id && o.Fornecedor.UsuarioId == usuarioId);

            if (compra is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (dto.FornecedorId != compra.FornecedorId)
            {
                var novoFornecedor = await _context.Fornecedores
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == dto.FornecedorId && f.UsuarioId == usuarioId);

                if (novoFornecedor is null)
                {
                    return ConflitoNoCampo(CampoFornecedor, "Fornecedor não encontrado.");
                }

                if (!novoFornecedor.Ativo)
                {
                    return ConflitoNoCampo(CampoFornecedor, "O fornecedor selecionado está inativo.");
                }
            }

            var notaFiscal = dto.NotaFiscal.Trim();

            if (await NotaFiscalDuplicada(notaFiscal, dto.FornecedorId!.Value, idIgnorado: id))
            {
                return ConflitoNoCampo(CampoNotaFiscal, "Já existe uma compra deste fornecedor com esta nota fiscal.");
            }

            var erroItens = await AplicarItens(compra, dto.Itens, usuarioId);

            if (erroItens is not null)
            {
                return Conflict(new { mensagem = erroItens });
            }

            compra.NotaFiscal = notaFiscal;
            compra.DataCompra = dto.DataCompra!.Value;
            compra.FornecedorId = dto.FornecedorId.Value;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<string?> AplicarItens(OrdemCompra compra, List<ItemCompraSalvarDto> itensNovos, int usuarioId)
        {
            var itensAntigos = compra.ItensCompra.ToDictionary(i => i.InsumoId);
            var novosPorInsumo = itensNovos.ToDictionary(i => i.InsumoId!.Value);

            var idsEnvolvidos = itensAntigos.Keys.Union(novosPorInsumo.Keys).ToList();

            var insumos = await _context.Insumos
                .Where(i => i.UsuarioId == usuarioId && idsEnvolvidos.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id);

            foreach (var insumoId in novosPorInsumo.Keys)
            {
                if (!insumos.TryGetValue(insumoId, out var insumo))
                {
                    return "Um dos insumos informados não foi encontrado.";
                }

                if (!insumo.Ativo && !itensAntigos.ContainsKey(insumoId))
                {
                    return $"O insumo \"{insumo.Nome}\" está inativo. Reative-o para incluí-lo na compra.";
                }
            }

            foreach (var insumoId in idsEnvolvidos)
            {
                var insumo = insumos[insumoId];
                var quantidadeAntiga = itensAntigos.TryGetValue(insumoId, out var antigo) ? antigo.Quantidade : 0;
                var quantidadeNova = novosPorInsumo.TryGetValue(insumoId, out var novo) ? novo.Quantidade!.Value : 0;

                var estoqueResultante = insumo.QuantidadeEstoque + quantidadeNova - quantidadeAntiga;

                if (estoqueResultante < 0)
                {
                    return $"Não é possível reduzir o item \"{insumo.Nome}\": o estoque ficaria negativo " +
                           $"(estoque atual: {insumo.QuantidadeEstoque.ToString("N3", PtBr)}).";
                }

                insumo.QuantidadeEstoque = estoqueResultante;
            }

            foreach (var (insumoId, antigo) in itensAntigos)
            {
                if (!novosPorInsumo.ContainsKey(insumoId))
                {
                    _context.ItensCompra.Remove(antigo);
                }
            }

            foreach (var (insumoId, novo) in novosPorInsumo)
            {
                if (itensAntigos.TryGetValue(insumoId, out var existente))
                {
                    existente.Quantidade = novo.Quantidade!.Value;
                    existente.ValorUnitario = novo.ValorUnitario!.Value;
                }
                else
                {
                    compra.ItensCompra.Add(new ItemCompra
                    {
                        InsumoId = insumoId,
                        Quantidade = novo.Quantidade!.Value,
                        ValorUnitario = novo.ValorUnitario!.Value
                    });
                }
            }

            compra.ValorTotal = itensNovos.Sum(i => CalcularSubtotal(i.Quantidade!.Value, i.ValorUnitario!.Value));

            return null;
        }

        private static decimal CalcularSubtotal(decimal quantidade, decimal valorUnitario) =>
            Math.Round(quantidade * valorUnitario, 2, MidpointRounding.AwayFromZero);

        private Task<bool> NotaFiscalDuplicada(string notaFiscal, int fornecedorId, int? idIgnorado)
        {
            return _context.OrdensCompra
                .AsNoTracking()
                .AnyAsync(o => o.FornecedorId == fornecedorId
                            && o.NotaFiscal == notaFiscal
                            && (idIgnorado == null || o.Id != idIgnorado));
        }

        private Task<CompraRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.OrdensCompra
                .AsNoTracking()
                .Where(o => o.Id == id && o.Fornecedor.UsuarioId == usuarioId)
                .Select(o => new CompraRespostaDto
                {
                    Id = o.Id,
                    NotaFiscal = o.NotaFiscal,
                    DataCompra = o.DataCompra,
                    FornecedorId = o.FornecedorId,
                    NomeFornecedor = o.Fornecedor.RazaoSocial,
                    CpfCnpjFornecedor = o.Fornecedor.CpfCnpj,
                    FornecedorAtivo = o.Fornecedor.Ativo,
                    ValorTotal = o.ValorTotal,
                    Itens = o.ItensCompra
                        .OrderBy(i => i.Insumo.Nome)
                        .Select(i => new ItemCompraRespostaDto
                        {
                            InsumoId = i.InsumoId,
                            NomeInsumo = i.Insumo.Nome,
                            UnidadeMedida = i.Insumo.UnidadeMedida,
                            InsumoAtivo = i.Insumo.Ativo,
                            Quantidade = i.Quantidade,
                            ValorUnitario = i.ValorUnitario,
                            Subtotal = Math.Round(i.Quantidade * i.ValorUnitario, 2)
                        })
                        .ToList(),
                    DataCriacao = o.DataCriacao,
                    DataAtualizacao = o.DataAtualizacao
                })
                .FirstOrDefaultAsync();
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });
    }
}
