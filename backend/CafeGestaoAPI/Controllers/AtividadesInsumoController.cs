using System.Globalization;
using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.AtividadesInsumo;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/atividades-manejo/{atividadeId:int}/insumos")]
    [ApiController]
    public class AtividadesInsumoController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly CultureInfo PtBr = new("pt-BR");

        private const string MensagemAtividadeNaoEncontrada = "Atividade de manejo não encontrada.";

        private const string CampoItens = "itens";

        public AtividadesInsumoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<AtividadeInsumoRespostaDto>>> Listar(int atividadeId)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var existe = await _context.AtividadesManejo
                .AnyAsync(a => a.Id == atividadeId && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (!existe)
            {
                return NotFound(new { mensagem = MensagemAtividadeNaoEncontrada });
            }

            return Ok(await ConsultarPorAtividade(atividadeId));
        }

        [HttpPut]
        public async Task<ActionResult<List<AtividadeInsumoRespostaDto>>> Salvar(int atividadeId, AtividadeInsumoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await _context.AtividadesManejo
                .Include(a => a.Insumos)
                .FirstOrDefaultAsync(a => a.Id == atividadeId && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemAtividadeNaoEncontrada });
            }

            if (atividade.Status != StatusAtividadeManejo.Concluida)
            {
                return Conflict(new
                {
                    mensagem = "Os insumos utilizados só podem ser registrados em atividades concluídas. Conclua a atividade primeiro."
                });
            }

            var erro = await AplicarItens(atividade, dto.Itens, usuarioId);

            if (erro is not null)
            {
                return Conflict(new { mensagem = erro, campo = CampoItens });
            }

            await _context.SaveChangesAsync();

            return Ok(await ConsultarPorAtividade(atividadeId));
        }

        private async Task<string?> AplicarItens(AtividadeManejo atividade, List<AtividadeInsumoItemDto> itensNovos, int usuarioId)
        {
            var antigos = atividade.Insumos.ToDictionary(i => i.InsumoId);
            var novos = itensNovos.ToDictionary(i => i.InsumoId!.Value, i => i.QuantidadeUtilizada!.Value);

            var idsEnvolvidos = antigos.Keys.Union(novos.Keys).ToList();

            var insumos = await _context.Insumos
                .Where(i => i.UsuarioId == usuarioId && idsEnvolvidos.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id);

            foreach (var insumoId in novos.Keys)
            {
                if (!insumos.TryGetValue(insumoId, out var insumo))
                {
                    return "Um dos insumos informados não foi encontrado.";
                }

                if (!insumo.Ativo && !antigos.ContainsKey(insumoId))
                {
                    return $"O insumo \"{insumo.Nome}\" está inativo. Reative-o para registrá-lo na atividade.";
                }
            }

            foreach (var insumoId in idsEnvolvidos)
            {
                var insumo = insumos[insumoId];
                var quantidadeAntiga = antigos.TryGetValue(insumoId, out var antigo) ? antigo.QuantidadeUtilizada : 0;
                var quantidadeNova = novos.TryGetValue(insumoId, out var nova) ? nova : 0;

                var estoqueResultante = insumo.QuantidadeEstoque + quantidadeAntiga - quantidadeNova;

                if (estoqueResultante < 0)
                {
                    var disponivel = insumo.QuantidadeEstoque + quantidadeAntiga;
                    return $"Estoque insuficiente de \"{insumo.Nome}\": disponível {disponivel.ToString("N3", PtBr)}, " +
                           $"informado {quantidadeNova.ToString("N3", PtBr)}.";
                }

                insumo.QuantidadeEstoque = estoqueResultante;
            }

            var agora = DateTime.UtcNow;

            foreach (var (insumoId, antigo) in antigos)
            {
                if (!novos.ContainsKey(insumoId))
                {
                    _context.AtividadesInsumo.Remove(antigo);
                }
            }

            foreach (var (insumoId, quantidade) in novos)
            {
                if (antigos.TryGetValue(insumoId, out var antigo))
                {
                    if (antigo.QuantidadeUtilizada != quantidade)
                    {
                        antigo.QuantidadeUtilizada = quantidade;
                        antigo.DataAtualizacao = agora;
                    }

                    continue;
                }

                atividade.Insumos.Add(new AtividadeInsumo
                {
                    InsumoId = insumoId,
                    QuantidadeUtilizada = quantidade,
                    DataCriacao = agora
                });
            }

            return null;
        }

        private static readonly Expression<Func<AtividadeInsumo, AtividadeInsumoRespostaDto>> Projecao =
            ai => new AtividadeInsumoRespostaDto
            {
                InsumoId = ai.InsumoId,
                NomeInsumo = ai.Insumo.Nome,
                InsumoAtivo = ai.Insumo.Ativo,
                UnidadeMedida = ai.Insumo.UnidadeMedida,
                QuantidadeEstoque = ai.Insumo.QuantidadeEstoque,
                AtividadeManejoId = ai.AtividadeManejoId,
                QuantidadeUtilizada = ai.QuantidadeUtilizada,
                DataCriacao = ai.DataCriacao,
                DataAtualizacao = ai.DataAtualizacao
            };

        private Task<List<AtividadeInsumoRespostaDto>> ConsultarPorAtividade(int atividadeId)
        {
            return _context.AtividadesInsumo
                .AsNoTracking()
                .Where(ai => ai.AtividadeManejoId == atividadeId)
                .OrderBy(ai => ai.Insumo.Nome)
                .Select(Projecao)
                .ToListAsync();
        }
    }
}
