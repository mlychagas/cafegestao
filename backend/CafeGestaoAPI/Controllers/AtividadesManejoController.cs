using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.AtividadesManejo;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/atividades-manejo")]
    [ApiController]
    public class AtividadesManejoController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNaoEncontrada = "Atividade de manejo não encontrada.";

        private const string CampoTipoManejo = "tipoManejoId";

        private const string CampoSafra = "safraId";

        private const string CampoTalhoes = "talhaoIds";

        public AtividadesManejoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<AtividadeManejoRespostaDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] int? safraId,
            [FromQuery] int? tipoManejoId,
            [FromQuery] StatusAtividadeManejo? status,
            [FromQuery] DateOnly? dataInicio,
            [FromQuery] DateOnly? dataFim)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.AtividadesManejo
                .AsNoTracking()
                .Where(a => a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(a => a.Descricao.Contains(termo));
            }

            if (safraId.HasValue)
            {
                consulta = consulta.Where(a => a.SafraId == safraId.Value);
            }

            if (tipoManejoId.HasValue)
            {
                consulta = consulta.Where(a => a.TipoManejoId == tipoManejoId.Value);
            }

            if (status.HasValue)
            {
                consulta = consulta.Where(a => a.Status == status.Value);
            }

            if (dataInicio.HasValue)
            {
                consulta = consulta.Where(a => a.DataPlanejada >= dataInicio.Value);
            }

            if (dataFim.HasValue)
            {
                consulta = consulta.Where(a => a.DataPlanejada <= dataFim.Value);
            }

            var atividades = await consulta
                .OrderByDescending(a => a.DataPlanejada)
                .ThenByDescending(a => a.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(atividades);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AtividadeManejoRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await ConsultarPorId(id, usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(atividade);
        }

        [HttpPost]
        public async Task<ActionResult<AtividadeManejoRespostaDto>> Cadastrar(AtividadeManejoCadastroDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var safra = await _context.Safras
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == dto.SafraId && s.PropriedadeRural.UsuarioId == usuarioId);

            if (safra is null)
            {
                return ConflitoNoCampo(CampoSafra, "Safra não encontrada.");
            }

            if (safra.Status == StatusSafra.Encerrada)
            {
                return ConflitoNoCampo(CampoSafra, "Não é possível registrar atividades em uma safra encerrada.");
            }

            if (!await TipoManejoDoUsuario(dto.TipoManejoId!.Value, usuarioId))
            {
                return ConflitoNoCampo(CampoTipoManejo, "Tipo de manejo não encontrado.");
            }

            var atividade = new AtividadeManejo
            {
                Descricao = dto.Descricao.Trim(),
                DataPlanejada = dto.DataPlanejada!.Value,
                SafraId = safra.Id
            };

            var erroTalhoes = await AplicarTalhoes(atividade, dto.TalhaoIds, safra.PropriedadeRuralId);

            if (erroTalhoes is not null)
            {
                return ConflitoNoCampo(CampoTalhoes, erroTalhoes);
            }

            CopiarDados(atividade, dto);

            _context.AtividadesManejo.Add(atividade);
            await _context.SaveChangesAsync();

            var resposta = await ConsultarPorId(atividade.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = atividade.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, AtividadeManejoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await _context.AtividadesManejo
                .Include(a => a.Talhoes)
                .Include(a => a.Safra)
                .FirstOrDefaultAsync(a => a.Id == id && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (atividade.Status == StatusAtividadeManejo.Cancelada)
            {
                return Conflict(new { mensagem = "Esta atividade está cancelada. Reabra a atividade para editá-la." });
            }

            if (!await TipoManejoDoUsuario(dto.TipoManejoId!.Value, usuarioId))
            {
                return ConflitoNoCampo(CampoTipoManejo, "Tipo de manejo não encontrado.");
            }

            var erroTalhoes = await AplicarTalhoes(atividade, dto.TalhaoIds, atividade.Safra.PropriedadeRuralId);

            if (erroTalhoes is not null)
            {
                return ConflitoNoCampo(CampoTalhoes, erroTalhoes);
            }

            atividade.Descricao = dto.Descricao.Trim();
            atividade.DataPlanejada = dto.DataPlanejada!.Value;
            CopiarDados(atividade, dto);

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

            var atividade = await _context.AtividadesManejo
                .FirstOrDefaultAsync(a => a.Id == id && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (atividade.Status == StatusAtividadeManejo.Cancelada)
            {
                return NoContent();
            }

            if (atividade.Status == StatusAtividadeManejo.Concluida)
            {
                return Conflict(new { mensagem = "Não é possível cancelar uma atividade já concluída." });
            }

            var possuiColheita = await _context.Colheitas.AnyAsync(c => c.AtividadeManejoId == id);

            if (possuiColheita)
            {
                return Conflict(new { mensagem = "Não é possível cancelar a atividade porque ela possui uma colheita registrada." });
            }

            atividade.Status = StatusAtividadeManejo.Cancelada;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id:int}/reabrir")]
        public async Task<IActionResult> Reabrir(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await _context.AtividadesManejo
                .Include(a => a.Safra)
                .FirstOrDefaultAsync(a => a.Id == id && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (atividade.Status != StatusAtividadeManejo.Cancelada)
            {
                return NoContent();
            }

            if (atividade.Safra.Status == StatusSafra.Encerrada)
            {
                return Conflict(new { mensagem = "Não é possível reabrir a atividade porque a safra está encerrada." });
            }

            atividade.Status = StatusAtividadeManejo.Agendada;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<string?> AplicarTalhoes(AtividadeManejo atividade, List<int> talhaoIds, int propriedadeId)
        {
            var idsAtuais = atividade.Talhoes.Select(t => t.TalhaoId).ToHashSet();

            var talhoes = await _context.Talhoes
                .AsNoTracking()
                .Where(t => talhaoIds.Contains(t.Id))
                .Select(t => new { t.Id, t.Nome, t.Ativo, t.PropriedadeRuralId })
                .ToListAsync();

            if (talhoes.Count != talhaoIds.Count || talhoes.Any(t => t.PropriedadeRuralId != propriedadeId))
            {
                return "Selecione apenas talhões da propriedade da safra.";
            }

            var inativoNovo = talhoes.FirstOrDefault(t => !t.Ativo && !idsAtuais.Contains(t.Id));

            if (inativoNovo is not null)
            {
                return $"O talhão \"{inativoNovo.Nome}\" está inativo.";
            }

            foreach (var vinculo in atividade.Talhoes.Where(v => !talhaoIds.Contains(v.TalhaoId)).ToList())
            {
                atividade.Talhoes.Remove(vinculo);
            }

            foreach (var talhaoId in talhaoIds.Where(tid => !idsAtuais.Contains(tid)))
            {
                atividade.Talhoes.Add(new TalhaoAtividadeManejo { TalhaoId = talhaoId });
            }

            return null;
        }

        private static void CopiarDados(AtividadeManejo atividade, AtividadeManejoSalvarDto dto)
        {
            atividade.TipoManejoId = dto.TipoManejoId!.Value;
            atividade.Status = dto.Status!.Value;
            atividade.DataConclusao = dto.DataConclusao;
            atividade.HorasPrevistas = dto.HorasPrevistas;
            atividade.HorasTrabalhadas = dto.HorasTrabalhadas;
            atividade.Observacao = string.IsNullOrWhiteSpace(dto.Observacao) ? null : dto.Observacao.Trim();
        }

        private Task<bool> TipoManejoDoUsuario(int tipoManejoId, int usuarioId)
        {
            return _context.TiposManejo.AnyAsync(t => t.Id == tipoManejoId && t.UsuarioId == usuarioId);
        }

        private static readonly Expression<Func<AtividadeManejo, AtividadeManejoRespostaDto>> Projecao =
            a => new AtividadeManejoRespostaDto
            {
                Id = a.Id,
                Descricao = a.Descricao,
                SafraId = a.SafraId,
                AnoAgricolaSafra = a.Safra.AnoAgricola,
                StatusSafra = a.Safra.Status,
                PropriedadeRuralId = a.Safra.PropriedadeRuralId,
                NomePropriedade = a.Safra.PropriedadeRural.Nome,
                TipoManejoId = a.TipoManejoId,
                NomeTipoManejo = a.TipoManejo.Nome,
                Status = a.Status,
                DataPlanejada = a.DataPlanejada,
                DataConclusao = a.DataConclusao,
                HorasPrevistas = a.HorasPrevistas,
                HorasTrabalhadas = a.HorasTrabalhadas,
                Observacao = a.Observacao,
                Talhoes = a.Talhoes
                    .OrderBy(t => t.Talhao.Nome)
                    .Select(t => new TalhaoAtividadeDto
                    {
                        Id = t.TalhaoId,
                        Nome = t.Talhao.Nome,
                        AreaHa = t.Talhao.AreaHa,
                        Ativo = t.Talhao.Ativo
                    })
                    .ToList(),
                PossuiColheita = a.Colheita != null,
                DataCriacao = a.DataCriacao,
                DataAtualizacao = a.DataAtualizacao
            };

        private Task<AtividadeManejoRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.AtividadesManejo
                .AsNoTracking()
                .Where(a => a.Id == id && a.Safra.PropriedadeRural.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });
    }
}
