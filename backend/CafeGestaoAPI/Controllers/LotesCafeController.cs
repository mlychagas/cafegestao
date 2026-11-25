using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.LotesCafe;
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
    [Route("api/lotes-cafe")]
    [ApiController]
    public class LotesCafeController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNaoEncontrado = "Lote de café não encontrado.";

        private const string MensagemNomeDuplicado = "Já existe um lote com este nome.";

        private const string CampoNome = "nome";

        private const string CampoSafra = "safraId";

        private const string CampoQuantidade = "quantidade";

        private const string CampoDataArmazenamento = "dataArmazenamento";

        public LotesCafeController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<LoteCafeRespostaDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] int? safraId,
            [FromQuery] FormaProcessamento? formaProcessamento,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.LotesCafe
                .AsNoTracking()
                .Where(l => l.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(l => l.Nome.Contains(termo));
            }

            if (safraId.HasValue)
            {
                consulta = consulta.Where(l => l.SafraId == safraId.Value);
            }

            if (formaProcessamento.HasValue)
            {
                consulta = consulta.Where(l => l.FormaProcessamento == formaProcessamento.Value);
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(l => l.Ativo == ativo.Value);
            }

            var lotes = await consulta
                .OrderByDescending(l => l.DataArmazenamento)
                .ThenByDescending(l => l.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(lotes);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<LoteCafeRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var lote = await ConsultarPorId(id, usuarioId);

            if (lote is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            return Ok(lote);
        }

        [HttpPost]
        public async Task<ActionResult<LoteCafeRespostaDto>> Cadastrar(LoteCafeCadastroDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var safraExiste = await _context.Safras
                .AnyAsync(s => s.Id == dto.SafraId && s.PropriedadeRural.UsuarioId == usuarioId);

            if (!safraExiste)
            {
                return ConflitoNoCampo(CampoSafra, "Safra não encontrada.");
            }

            var nome = dto.Nome.Trim();

            var mensagemDuplicado = await VerificarNomeDuplicado(nome, usuarioId, idIgnorado: null);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoNome, mensagemDuplicado);
            }

            var erro = await ValidarSafra(dto.SafraId!.Value, dto, loteIgnorado: null);

            if (erro is not null)
            {
                return erro;
            }

            var lote = new LoteCafe
            {
                Nome = nome,
                Quantidade = dto.Quantidade!.Value,
                DataArmazenamento = dto.DataArmazenamento!.Value,
                SafraId = dto.SafraId.Value,
                UsuarioId = usuarioId
            };

            CopiarDados(lote, dto);

            _context.LotesCafe.Add(lote);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var resposta = await ConsultarPorId(lote.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = lote.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, LoteCafeSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var lote = await _context.LotesCafe.FirstOrDefaultAsync(l => l.Id == id && l.UsuarioId == usuarioId);

            if (lote is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var nome = dto.Nome.Trim();

            var mensagemDuplicado = await VerificarNomeDuplicado(nome, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoNome, mensagemDuplicado);
            }

            var erro = await ValidarSafra(lote.SafraId, dto, loteIgnorado: id);

            if (erro is not null)
            {
                return erro;
            }

            lote.Nome = nome;
            lote.Quantidade = dto.Quantidade!.Value;
            lote.DataArmazenamento = dto.DataArmazenamento!.Value;
            CopiarDados(lote, dto);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            return NoContent();
        }

        [HttpPatch("{id:int}/inativar")]
        public Task<IActionResult> Inativar(int id) => AlterarSituacao(id, ativo: false);

        [HttpPatch("{id:int}/reativar")]
        public Task<IActionResult> Reativar(int id) => AlterarSituacao(id, ativo: true);

        private async Task<IActionResult> AlterarSituacao(int id, bool ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var lote = await _context.LotesCafe.FirstOrDefaultAsync(l => l.Id == id && l.UsuarioId == usuarioId);

            if (lote is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (lote.Ativo != ativo)
            {
                lote.Ativo = ativo;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private async Task<ConflictObjectResult?> ValidarSafra(int safraId, LoteCafeSalvarDto dto, int? loteIgnorado)
        {
            var colheitas = await _context.Colheitas
                .AsNoTracking()
                .Where(c => c.SafraId == safraId)
                .Select(c => new { c.Quantidade, c.UnidadeMedida, c.DataInicio })
                .ToListAsync();

            if (colheitas.Count == 0)
            {
                return ConflitoNoCampo(CampoSafra, "Registre as colheitas desta safra antes de formar lotes.");
            }

            var primeiraColheita = colheitas.Min(c => c.DataInicio);

            if (dto.DataArmazenamento < primeiraColheita)
            {
                return ConflitoNoCampo(
                    CampoDataArmazenamento,
                    "A data de armazenamento não pode ser anterior à primeira colheita da safra.");
            }

            var totalColhidoKg = colheitas.Sum(c => ConversaoPeso.ParaQuilogramas(c.Quantidade, c.UnidadeMedida));

            var outrosLotes = await _context.LotesCafe
                .AsNoTracking()
                .Where(l => l.SafraId == safraId && (loteIgnorado == null || l.Id != loteIgnorado))
                .Select(l => new { l.Quantidade, l.UnidadeMedida })
                .ToListAsync();

            var outrosLotesKg = outrosLotes.Sum(l => ConversaoPeso.ParaQuilogramas(l.Quantidade, l.UnidadeMedida));
            var loteKg = ConversaoPeso.ParaQuilogramas(dto.Quantidade!.Value, dto.UnidadeMedida!.Value);

            if (outrosLotesKg + loteKg >= totalColhidoKg)
            {
                var disponivel = Math.Max(totalColhidoKg - outrosLotesKg, 0);

                return ConflitoNoCampo(
                    CampoQuantidade,
                    $"O peso dos lotes da safra deve ser menor que o total colhido ({ConversaoPeso.FormatarQuilogramas(totalColhidoKg)}). " +
                    $"Outros lotes já somam {ConversaoPeso.FormatarQuilogramas(outrosLotesKg)}; " +
                    $"este lote deve ter menos de {ConversaoPeso.FormatarQuilogramas(disponivel)}.");
            }

            return null;
        }

        private static void CopiarDados(LoteCafe lote, LoteCafeSalvarDto dto)
        {
            lote.UnidadeMedida = dto.UnidadeMedida!.Value;
            lote.FormaProcessamento = dto.FormaProcessamento!.Value;
            lote.Umidade = dto.Umidade;
            lote.Observacao = string.IsNullOrWhiteSpace(dto.Observacao) ? null : dto.Observacao.Trim();
        }

        private async Task<string?> VerificarNomeDuplicado(string nome, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.LotesCafe
                .AsNoTracking()
                .Where(l => l.UsuarioId == usuarioId && l.Nome == nome && (idIgnorado == null || l.Id != idIgnorado))
                .Select(l => new { l.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemNomeDuplicado
                : "Já existe um lote inativo com este nome. Reative-o ou escolha outro nome.";
        }

        private static readonly Expression<Func<LoteCafe, LoteCafeRespostaDto>> Projecao =
            l => new LoteCafeRespostaDto
            {
                Id = l.Id,
                Nome = l.Nome,
                Quantidade = l.Quantidade,
                UnidadeMedida = l.UnidadeMedida,
                DataArmazenamento = l.DataArmazenamento,
                FormaProcessamento = l.FormaProcessamento,
                Umidade = l.Umidade,
                Observacao = l.Observacao,
                Ativo = l.Ativo,
                SafraId = l.SafraId,
                AnoAgricolaSafra = l.Safra.AnoAgricola,
                StatusSafra = l.Safra.Status,
                PropriedadeRuralId = l.Safra.PropriedadeRuralId,
                NomePropriedade = l.Safra.PropriedadeRural.Nome,
                TotalColhidoSafraKg = l.Safra.Colheitas.Sum(c =>
                    c.UnidadeMedida == UnidadePeso.Tonelada ? c.Quantidade * ConversaoPeso.QuilogramasPorTonelada : c.Quantidade),
                TotalLotesSafraKg = l.Safra.Lotes.Sum(o =>
                    o.UnidadeMedida == UnidadePeso.Tonelada ? o.Quantidade * ConversaoPeso.QuilogramasPorTonelada : o.Quantidade),
                DataCriacao = l.DataCriacao,
                DataAtualizacao = l.DataAtualizacao
            };

        private Task<LoteCafeRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.LotesCafe
                .AsNoTracking()
                .Where(l => l.Id == id && l.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private static bool EhDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });
    }
}
