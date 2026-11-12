using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.MaosObra;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using CafeGestaoAPI.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/atividades-manejo/{atividadeId:int}/mao-obra")]
    [ApiController]
    public class MaosObraController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemAtividadeNaoEncontrada = "Atividade de manejo não encontrada.";

        private const string CampoItens = "itens";

        public MaosObraController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<MaoObraRespostaDto>>> Listar(int atividadeId)
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
        public async Task<ActionResult<List<MaoObraRespostaDto>>> Salvar(int atividadeId, MaoObraSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var atividade = await _context.AtividadesManejo
                .Include(a => a.MaosObra)
                .FirstOrDefaultAsync(a => a.Id == atividadeId && a.Safra.PropriedadeRural.UsuarioId == usuarioId);

            if (atividade is null)
            {
                return NotFound(new { mensagem = MensagemAtividadeNaoEncontrada });
            }

            if (atividade.Status == StatusAtividadeManejo.Cancelada)
            {
                return Conflict(new { mensagem = "A atividade está cancelada. Reabra a atividade para alterar a mão de obra." });
            }

            var erroPessoas = await ValidarPessoas(atividade, dto.Itens, usuarioId);

            if (erroPessoas is not null)
            {
                return Conflict(new { mensagem = erroPessoas, campo = CampoItens });
            }

            AplicarItens(atividade, dto.Itens);

            await _context.SaveChangesAsync();

            return Ok(await ConsultarPorAtividade(atividadeId));
        }

        private async Task<string?> ValidarPessoas(AtividadeManejo atividade, List<MaoObraItemDto> itens, int usuarioId)
        {
            var idsInformados = itens.Select(i => i.PessoaId!.Value).ToList();
            var idsAtuais = atividade.MaosObra.Select(m => m.PessoaId).ToHashSet();

            var pessoas = await _context.Pessoas
                .AsNoTracking()
                .Where(p => idsInformados.Contains(p.Id) && p.UsuarioId == usuarioId)
                .Select(p => new { p.Id, p.Nome, p.Ativo })
                .ToListAsync();

            if (pessoas.Count != idsInformados.Count)
            {
                return "Selecione apenas pessoas cadastradas.";
            }

            var inativaNova = pessoas.FirstOrDefault(p => !p.Ativo && !idsAtuais.Contains(p.Id));

            return inativaNova is null ? null : $"A pessoa \"{inativaNova.Nome}\" está inativa.";
        }

        private void AplicarItens(AtividadeManejo atividade, List<MaoObraItemDto> itens)
        {
            var idsInformados = itens.Select(i => i.PessoaId!.Value).ToHashSet();
            var agora = DateTime.UtcNow;

            foreach (var registro in atividade.MaosObra.Where(m => !idsInformados.Contains(m.PessoaId)).ToList())
            {
                _context.MaosObra.Remove(registro);
            }

            foreach (var item in itens)
            {
                var funcao = item.Funcao.Trim();
                var unidade = item.UnidadeMedida!.Value;
                var quantidade = item.Quantidade!.Value;
                var valorUnitario = item.ValorUnitario!.Value;
                var valorTotal = Math.Round(quantidade * valorUnitario, 2, MidpointRounding.AwayFromZero);

                var registro = atividade.MaosObra.FirstOrDefault(m => m.PessoaId == item.PessoaId);

                if (registro is null)
                {
                    atividade.MaosObra.Add(new MaoObra
                    {
                        PessoaId = item.PessoaId!.Value,
                        Funcao = funcao,
                        UnidadeMedida = unidade,
                        Quantidade = quantidade,
                        ValorUnitario = valorUnitario,
                        ValorTotal = valorTotal,
                        DataCriacao = agora
                    });
                    continue;
                }

                var alterado = registro.Funcao != funcao
                    || registro.UnidadeMedida != unidade
                    || registro.Quantidade != quantidade
                    || registro.ValorUnitario != valorUnitario;

                if (!alterado)
                {
                    continue;
                }

                registro.Funcao = funcao;
                registro.UnidadeMedida = unidade;
                registro.Quantidade = quantidade;
                registro.ValorUnitario = valorUnitario;
                registro.ValorTotal = valorTotal;
                registro.DataAtualizacao = agora;
            }
        }

        private static readonly Expression<Func<MaoObra, MaoObraRespostaDto>> Projecao =
            m => new MaoObraRespostaDto
            {
                PessoaId = m.PessoaId,
                NomePessoa = m.Pessoa.Nome,
                PessoaAtiva = m.Pessoa.Ativo,
                AtividadeManejoId = m.AtividadeManejoId,
                Funcao = m.Funcao,
                UnidadeMedida = m.UnidadeMedida,
                Quantidade = m.Quantidade,
                ValorUnitario = m.ValorUnitario,
                ValorTotal = m.ValorTotal,
                DataCriacao = m.DataCriacao,
                DataAtualizacao = m.DataAtualizacao
            };

        private Task<List<MaoObraRespostaDto>> ConsultarPorAtividade(int atividadeId)
        {
            return _context.MaosObra
                .AsNoTracking()
                .Where(m => m.AtividadeManejoId == atividadeId)
                .OrderBy(m => m.Pessoa.Nome)
                .Select(Projecao)
                .ToListAsync();
        }
    }
}
