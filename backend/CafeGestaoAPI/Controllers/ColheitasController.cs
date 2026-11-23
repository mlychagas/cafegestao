using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Colheitas;
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
    public class ColheitasController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNaoEncontrada = "Colheita não encontrada.";

        private const string MensagemAtividadeComColheita = "Esta atividade já possui uma colheita registrada.";

        private const string CampoAtividade = "atividadeManejoId";

        private const string CampoTalhoes = "talhaoIds";

        public ColheitasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<ColheitaRespostaDto>>> Listar(
            [FromQuery] int? safraId,
            [FromQuery] int? propriedadeId,
            [FromQuery] DateOnly? dataInicio,
            [FromQuery] DateOnly? dataFim)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Colheitas
                .AsNoTracking()
                .Where(c => c.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (safraId.HasValue)
            {
                consulta = consulta.Where(c => c.SafraId == safraId.Value);
            }

            if (propriedadeId.HasValue)
            {
                consulta = consulta.Where(c => c.Safra.PropriedadeRuralId == propriedadeId.Value);
            }

            if (dataInicio.HasValue)
            {
                consulta = consulta.Where(c => c.DataInicio >= dataInicio.Value);
            }

            if (dataFim.HasValue)
            {
                consulta = consulta.Where(c => c.DataInicio <= dataFim.Value);
            }

            var colheitas = await consulta
                .OrderByDescending(c => c.DataInicio)
                .ThenByDescending(c => c.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(colheitas);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ColheitaRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var colheita = await ConsultarPorId(id, usuarioId);

            if (colheita is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(colheita);
        }

        [HttpPost]
        public async Task<ActionResult<ColheitaRespostaDto>> Cadastrar(ColheitaCadastroDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await _context.AtividadesManejo
                .AsNoTracking()
                .Where(a => a.Id == dto.AtividadeManejoId && a.Safra.PropriedadeRural.UsuarioId == usuarioId)
                .Select(a => new
                {
                    a.Id,
                    a.Status,
                    a.SafraId,
                    StatusSafra = a.Safra.Status,
                    PossuiColheita = a.Colheita != null,
                    TalhaoIds = a.Talhoes.Select(t => t.TalhaoId).ToList()
                })
                .FirstOrDefaultAsync();

            if (atividade is null)
            {
                return ConflitoNoCampo(CampoAtividade, "Atividade de manejo não encontrada.");
            }

            if (atividade.Status is not (StatusAtividadeManejo.EmAndamento or StatusAtividadeManejo.Concluida))
            {
                return ConflitoNoCampo(
                    CampoAtividade,
                    "A colheita só pode ser registrada em atividades em andamento ou concluídas.");
            }

            if (atividade.StatusSafra == StatusSafra.Encerrada)
            {
                return ConflitoNoCampo(CampoAtividade, "Não é possível registrar colheitas em uma safra encerrada.");
            }

            if (atividade.PossuiColheita)
            {
                return ConflitoNoCampo(CampoAtividade, MensagemAtividadeComColheita);
            }

            if (dto.TalhaoIds.Any(id => !atividade.TalhaoIds.Contains(id)))
            {
                return ConflitoNoCampo(CampoTalhoes, "Selecione apenas talhões trabalhados nesta atividade.");
            }

            var colheita = new Colheita
            {
                DataInicio = dto.DataInicio!.Value,
                Quantidade = dto.Quantidade!.Value,
                SafraId = atividade.SafraId,
                AtividadeManejoId = atividade.Id
            };

            CopiarDados(colheita, dto);

            foreach (var talhaoId in dto.TalhaoIds)
            {
                colheita.Talhoes.Add(new TalhaoColheita { TalhaoId = talhaoId });
            }

            _context.Colheitas.Add(colheita);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry })
            {
                return ConflitoNoCampo(CampoAtividade, MensagemAtividadeComColheita);
            }

            var resposta = await ConsultarPorId(colheita.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = colheita.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, ColheitaSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var colheita = await _context.Colheitas
                .Include(c => c.Talhoes)
                .FirstOrDefaultAsync(c => c.Id == id && c.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (colheita is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            var talhoesAtividade = await _context.TalhoesAtividadeManejo
                .Where(ta => ta.AtividadeManejoId == colheita.AtividadeManejoId)
                .Select(ta => ta.TalhaoId)
                .ToListAsync();

            if (dto.TalhaoIds.Any(talhaoId => !talhoesAtividade.Contains(talhaoId)))
            {
                return ConflitoNoCampo(CampoTalhoes, "Selecione apenas talhões trabalhados nesta atividade.");
            }

            foreach (var vinculo in colheita.Talhoes.Where(t => !dto.TalhaoIds.Contains(t.TalhaoId)).ToList())
            {
                colheita.Talhoes.Remove(vinculo);
            }

            foreach (var talhaoId in dto.TalhaoIds.Where(t => colheita.Talhoes.All(v => v.TalhaoId != t)))
            {
                colheita.Talhoes.Add(new TalhaoColheita { TalhaoId = talhaoId });
            }

            colheita.DataInicio = dto.DataInicio!.Value;
            colheita.Quantidade = dto.Quantidade!.Value;
            CopiarDados(colheita, dto);

            _context.Entry(colheita).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static void CopiarDados(Colheita colheita, ColheitaSalvarDto dto)
        {
            colheita.DataFim = dto.DataFim;
            colheita.UnidadeMedida = dto.UnidadeMedida!.Value;
            colheita.FormaColheita = string.IsNullOrWhiteSpace(dto.FormaColheita) ? null : dto.FormaColheita.Trim();
            colheita.Observacao = string.IsNullOrWhiteSpace(dto.Observacao) ? null : dto.Observacao.Trim();
        }

        private static readonly Expression<Func<Colheita, ColheitaRespostaDto>> Projecao =
            c => new ColheitaRespostaDto
            {
                Id = c.Id,
                DataInicio = c.DataInicio,
                DataFim = c.DataFim,
                Quantidade = c.Quantidade,
                UnidadeMedida = c.UnidadeMedida,
                FormaColheita = c.FormaColheita,
                Observacao = c.Observacao,
                SafraId = c.SafraId,
                AnoAgricolaSafra = c.Safra.AnoAgricola,
                StatusSafra = c.Safra.Status,
                PropriedadeRuralId = c.Safra.PropriedadeRuralId,
                NomePropriedade = c.Safra.PropriedadeRural.Nome,
                AtividadeManejoId = c.AtividadeManejoId,
                DescricaoAtividade = c.AtividadeManejo.Descricao,
                StatusAtividade = c.AtividadeManejo.Status,
                Talhoes = c.Talhoes
                    .OrderBy(t => t.Talhao.Nome)
                    .Select(t => new TalhaoColheitaDto
                    {
                        Id = t.TalhaoId,
                        Nome = t.Talhao.Nome,
                        AreaHa = t.Talhao.AreaHa,
                        Ativo = t.Talhao.Ativo
                    })
                    .ToList(),
                DataCriacao = c.DataCriacao,
                DataAtualizacao = c.DataAtualizacao
            };

        private Task<ColheitaRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Colheitas
                .AsNoTracking()
                .Where(c => c.Id == id && c.Safra.PropriedadeRural.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });
    }
}
