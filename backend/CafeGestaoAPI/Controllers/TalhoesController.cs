using System.Globalization;
using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Talhoes;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TalhoesController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly CultureInfo PtBr = new("pt-BR");

        private const string MensagemNomeDuplicado = "Já existe um talhão com esta identificação nesta propriedade.";

        private const string MensagemTalhaoNaoEncontrado = "Talhão não encontrado.";

        private const string MensagemPropriedadeNaoEncontrada = "Propriedade não encontrada.";

        private const string CampoNome = "nome";

        private const string CampoArea = "areaHa";

        public TalhoesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<TalhaoRespostaDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<List<TalhaoRespostaDto>>> Listar(
            [FromQuery] int? propriedadeId,
            [FromQuery] string? nome,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Talhoes
                .AsNoTracking()
                .Where(t => t.PropriedadeRural.UsuarioId == usuarioId);

            if (propriedadeId.HasValue)
            {
                consulta = consulta.Where(t => t.PropriedadeRuralId == propriedadeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(nome))
            {
                var termo = nome.Trim();
                consulta = consulta.Where(t => t.Nome.Contains(termo));
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(t => t.Ativo == ativo.Value);
            }

            var talhoes = await consulta
                .OrderByDescending(t => t.DataCriacao)
                .ThenByDescending(t => t.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(talhoes);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(TalhaoRespostaDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TalhaoRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var talhao = await ConsultarPorId(id, usuarioId);

            if (talhao is null)
            {
                return NotFound(new { mensagem = MensagemTalhaoNaoEncontrado });
            }

            return Ok(talhao);
        }

        [HttpPost]
        [ProducesResponseType(typeof(TalhaoRespostaDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<TalhaoRespostaDto>> Cadastrar(TalhaoCadastroDto dto)
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
                return NotFound(new { mensagem = MensagemPropriedadeNaoEncontrada });
            }

            if (!propriedade.Ativo)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível cadastrar talhões em uma propriedade inativa. Reative a propriedade primeiro."
                });
            }

            var nome = dto.Nome.Trim();

            if (await NomeDuplicado(propriedade.Id, nome, idIgnorado: null))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var mensagemArea = await VerificarAreaDisponivel(propriedade, dto.AreaHa!.Value, idIgnorado: null);

            if (mensagemArea is not null)
            {
                return ConflitoNoCampo(CampoArea, mensagemArea);
            }

            var talhao = new Talhao
            {
                Nome = nome,
                AreaHa = dto.AreaHa.Value,
                EspacamentoLinha = dto.EspacamentoLinha,
                EspacamentoPlanta = dto.EspacamentoPlanta,
                DataPlantio = dto.DataPlantio,
                QuantidadeMudas = dto.QuantidadeMudas,
                Variedades = TextoOuNulo(dto.Variedades),
                PropriedadeRuralId = propriedade.Id
            };

            _context.Talhoes.Add(talhao);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhNomeDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var resposta = await ConsultarPorId(talhao.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = talhao.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Atualizar(int id, TalhaoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var talhao = await _context.Talhoes
                .Include(t => t.PropriedadeRural)
                .FirstOrDefaultAsync(t => t.Id == id && t.PropriedadeRural.UsuarioId == usuarioId);

            if (talhao is null)
            {
                return NotFound(new { mensagem = MensagemTalhaoNaoEncontrado });
            }

            var nome = dto.Nome.Trim();

            if (await NomeDuplicado(talhao.PropriedadeRuralId, nome, idIgnorado: id))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            if (talhao.Ativo)
            {
                var mensagemArea = await VerificarAreaDisponivel(talhao.PropriedadeRural, dto.AreaHa!.Value, idIgnorado: id);

                if (mensagemArea is not null)
                {
                    return ConflitoNoCampo(CampoArea, mensagemArea);
                }
            }

            talhao.Nome = nome;
            talhao.AreaHa = dto.AreaHa!.Value;
            talhao.EspacamentoLinha = dto.EspacamentoLinha;
            talhao.EspacamentoPlanta = dto.EspacamentoPlanta;
            talhao.DataPlantio = dto.DataPlantio;
            talhao.QuantidadeMudas = dto.QuantidadeMudas;
            talhao.Variedades = TextoOuNulo(dto.Variedades);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhNomeDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            return NoContent();
        }

        [HttpPatch("{id:int}/inativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Inativar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var talhao = await _context.Talhoes
                .FirstOrDefaultAsync(t => t.Id == id && t.PropriedadeRural.UsuarioId == usuarioId);

            if (talhao is null)
            {
                return NotFound(new { mensagem = MensagemTalhaoNaoEncontrado });
            }

            if (talhao.Ativo)
            {
                talhao.Ativo = false;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpPatch("{id:int}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Reativar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var talhao = await _context.Talhoes
                .Include(t => t.PropriedadeRural)
                .FirstOrDefaultAsync(t => t.Id == id && t.PropriedadeRural.UsuarioId == usuarioId);

            if (talhao is null)
            {
                return NotFound(new { mensagem = MensagemTalhaoNaoEncontrado });
            }

            if (talhao.Ativo)
            {
                return NoContent();
            }

            if (!talhao.PropriedadeRural.Ativo)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível reativar o talhão porque a propriedade está inativa. Reative a propriedade primeiro."
                });
            }

            var mensagemArea = await VerificarAreaDisponivel(talhao.PropriedadeRural, talhao.AreaHa, idIgnorado: id);

            if (mensagemArea is not null)
            {
                return Conflict(new { mensagem = $"Não é possível reativar o talhão. {mensagemArea}" });
            }

            talhao.Ativo = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static readonly Expression<Func<Talhao, TalhaoRespostaDto>> Projecao =
            t => new TalhaoRespostaDto
            {
                Id = t.Id,
                PropriedadeRuralId = t.PropriedadeRuralId,
                NomePropriedade = t.PropriedadeRural.Nome,
                Nome = t.Nome,
                AreaHa = t.AreaHa,
                EspacamentoLinha = t.EspacamentoLinha,
                EspacamentoPlanta = t.EspacamentoPlanta,
                DataPlantio = t.DataPlantio,
                QuantidadeMudas = t.QuantidadeMudas,
                Variedades = t.Variedades,
                Ativo = t.Ativo,
                DataCriacao = t.DataCriacao,
                DataAtualizacao = t.DataAtualizacao
            };

        private Task<TalhaoRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Talhoes
                .AsNoTracking()
                .Where(t => t.Id == id && t.PropriedadeRural.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private Task<bool> NomeDuplicado(int propriedadeId, string nome, int? idIgnorado)
        {
            return _context.Talhoes
                .AsNoTracking()
                .AnyAsync(t => t.PropriedadeRuralId == propriedadeId
                            && t.Nome == nome
                            && (idIgnorado == null || t.Id != idIgnorado));
        }

        private async Task<string?> VerificarAreaDisponivel(PropriedadeRural propriedade, decimal areaHa, int? idIgnorado)
        {
            var areaOutrosTalhoes = await _context.Talhoes
                .Where(t => t.PropriedadeRuralId == propriedade.Id
                         && t.Ativo
                         && (idIgnorado == null || t.Id != idIgnorado))
                .SumAsync(t => t.AreaHa);

            var areaDisponivel = Math.Max(propriedade.AreaCultivadaHa - areaOutrosTalhoes, 0);

            if (areaHa <= areaDisponivel)
            {
                return null;
            }

            return $"A soma das áreas dos talhões ativos não pode ultrapassar a área cultivada da propriedade " +
                   $"({propriedade.AreaCultivadaHa.ToString("N3", PtBr)} ha). " +
                   $"Área disponível: {areaDisponivel.ToString("N3", PtBr)} ha.";
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhNomeDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    }
}