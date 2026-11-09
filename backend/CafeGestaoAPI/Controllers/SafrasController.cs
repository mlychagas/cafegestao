using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Safras;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SafrasController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemAnoDuplicado = "Já existe uma safra deste ano agrícola nesta propriedade.";

        private const string MensagemNaoEncontrada = "Safra não encontrada.";

        private const string CampoAnoAgricola = "anoAgricola";

        public SafrasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<SafraRespostaDto>>> Listar(
            [FromQuery] int? propriedadeId,
            [FromQuery] string? anoAgricola,
            [FromQuery] StatusSafra? status)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Safras
                .AsNoTracking()
                .Where(s => s.PropriedadeRural.UsuarioId == usuarioId);

            if (propriedadeId.HasValue)
            {
                consulta = consulta.Where(s => s.PropriedadeRuralId == propriedadeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(anoAgricola))
            {
                var termo = anoAgricola.Trim();
                consulta = consulta.Where(s => s.AnoAgricola.Contains(termo));
            }

            if (status.HasValue)
            {
                consulta = consulta.Where(s => s.Status == status.Value);
            }

            var safras = await consulta
                .OrderByDescending(s => s.DataInicio)
                .ThenByDescending(s => s.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(safras);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<SafraRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var safra = await ConsultarPorId(id, usuarioId);

            if (safra is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(safra);
        }

        [HttpPost]
        public async Task<ActionResult<SafraRespostaDto>> Cadastrar(SafraCadastroDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var propriedade = await _context.PropriedadesRurais
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == dto.PropriedadeRuralId && p.UsuarioId == usuarioId);

            if (propriedade is null)
            {
                return NotFound(new { mensagem = "Propriedade não encontrada." });
            }

            if (!propriedade.Ativo)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível cadastrar safras em uma propriedade inativa. Reative a propriedade primeiro."
                });
            }

            var anoAgricola = dto.AnoAgricola.Trim();

            if (await AnoDuplicado(propriedade.Id, anoAgricola, idIgnorado: null))
            {
                return ConflitoNoCampo(CampoAnoAgricola, MensagemAnoDuplicado);
            }

            var safra = new Safra
            {
                AnoAgricola = anoAgricola,
                Status = dto.Status!.Value,
                DataInicio = dto.DataInicio!.Value,
                DataFechamento = dto.DataFechamento,
                ProdutividadeEstimada = dto.ProdutividadeEstimada,
                UnidadeMedida = dto.UnidadeMedida,
                PropriedadeRuralId = propriedade.Id
            };

            _context.Safras.Add(safra);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoAnoAgricola, MensagemAnoDuplicado);
            }

            var resposta = await ConsultarPorId(safra.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = safra.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, SafraSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var safra = await _context.Safras
                .FirstOrDefaultAsync(s => s.Id == id && s.PropriedadeRural.UsuarioId == usuarioId);

            if (safra is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            var anoAgricola = dto.AnoAgricola.Trim();

            if (await AnoDuplicado(safra.PropriedadeRuralId, anoAgricola, idIgnorado: id))
            {
                return ConflitoNoCampo(CampoAnoAgricola, MensagemAnoDuplicado);
            }

            safra.AnoAgricola = anoAgricola;
            safra.Status = dto.Status!.Value;
            safra.DataInicio = dto.DataInicio!.Value;
            safra.DataFechamento = dto.DataFechamento;
            safra.ProdutividadeEstimada = dto.ProdutividadeEstimada;
            safra.UnidadeMedida = dto.UnidadeMedida;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoAnoAgricola, MensagemAnoDuplicado);
            }

            return NoContent();
        }

        private static readonly Expression<Func<Safra, SafraRespostaDto>> Projecao =
            s => new SafraRespostaDto
            {
                Id = s.Id,
                PropriedadeRuralId = s.PropriedadeRuralId,
                NomePropriedade = s.PropriedadeRural.Nome,
                AnoAgricola = s.AnoAgricola,
                Status = s.Status,
                DataInicio = s.DataInicio,
                DataFechamento = s.DataFechamento,
                ProdutividadeEstimada = s.ProdutividadeEstimada,
                UnidadeMedida = s.UnidadeMedida,
                QuantidadeAtividades = s.AtividadesManejo.Count(),
                QuantidadeColheitas = s.Colheitas.Count(),
                DataCriacao = s.DataCriacao,
                DataAtualizacao = s.DataAtualizacao
            };

        private Task<SafraRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Safras
                .AsNoTracking()
                .Where(s => s.Id == id && s.PropriedadeRural.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private Task<bool> AnoDuplicado(int propriedadeId, string anoAgricola, int? idIgnorado)
        {
            return _context.Safras
                .AsNoTracking()
                .AnyAsync(s => s.PropriedadeRuralId == propriedadeId
                            && s.AnoAgricola == anoAgricola
                            && (idIgnorado == null || s.Id != idIgnorado));
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };
    }
}
