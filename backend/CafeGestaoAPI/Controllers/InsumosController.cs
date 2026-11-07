using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Insumos;
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
    public class InsumosController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNomeDuplicado = "Já existe um insumo cadastrado com este nome.";

        private const string MensagemNaoEncontrado = "Insumo não encontrado.";

        private const string CampoNome = "nome";

        private const string CampoEstoque = "quantidadeEstoque";

        private const string CampoUnidade = "unidadeMedida";

        public InsumosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<InsumoRespostaDto>>> Listar(
            [FromQuery] string? nome,
            [FromQuery] CategoriaInsumo? categoria,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Insumos
                .AsNoTracking()
                .Where(i => i.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(nome))
            {
                var termo = nome.Trim();
                consulta = consulta.Where(i => i.Nome.Contains(termo));
            }

            if (categoria.HasValue)
            {
                consulta = consulta.Where(i => i.Categoria == categoria.Value);
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(i => i.Ativo == ativo.Value);
            }

            var insumos = await consulta
                .OrderByDescending(i => i.DataCriacao)
                .ThenByDescending(i => i.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(insumos);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<InsumoRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var insumo = await ConsultarPorId(id, usuarioId);

            if (insumo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            return Ok(insumo);
        }

        [HttpPost]
        public async Task<ActionResult<InsumoRespostaDto>> Cadastrar(InsumoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var nome = dto.Nome.Trim();

            var mensagemDuplicado = await VerificarNomeDuplicado(nome, usuarioId, idIgnorado: null);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoNome, mensagemDuplicado);
            }

            var insumo = new Insumo
            {
                Nome = nome,
                Descricao = TextoOuNulo(dto.Descricao),
                Categoria = dto.Categoria!.Value,
                UnidadeMedida = dto.UnidadeMedida!.Value,
                QuantidadeEstoque = dto.QuantidadeEstoque!.Value,
                UsuarioId = usuarioId
            };

            _context.Insumos.Add(insumo);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhNomeDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var resposta = await ConsultarPorId(insumo.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = insumo.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, InsumoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var insumo = await _context.Insumos
                .FirstOrDefaultAsync(i => i.Id == id && i.UsuarioId == usuarioId);

            if (insumo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var nome = dto.Nome.Trim();

            var mensagemDuplicado = await VerificarNomeDuplicado(nome, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoNome, mensagemDuplicado);
            }

            var alterouEstoque = dto.QuantidadeEstoque!.Value != insumo.QuantidadeEstoque;
            var alterouUnidade = dto.UnidadeMedida!.Value != insumo.UnidadeMedida;

            if (alterouEstoque || alterouUnidade)
            {
                var possuiMovimentacoes = await _context.ItensCompra.AnyAsync(ic => ic.InsumoId == id);

                if (possuiMovimentacoes && alterouEstoque)
                {
                    return ConflitoNoCampo(
                        CampoEstoque,
                        "A quantidade em estoque não pode ser alterada manualmente porque o insumo possui compras registradas. " +
                        "O estoque é atualizado pelas compras.");
                }

                if (possuiMovimentacoes && alterouUnidade)
                {
                    return ConflitoNoCampo(
                        CampoUnidade,
                        "A unidade de medida não pode ser alterada porque o insumo possui compras registradas.");
                }
            }

            insumo.Nome = nome;
            insumo.Descricao = TextoOuNulo(dto.Descricao);
            insumo.Categoria = dto.Categoria!.Value;
            insumo.UnidadeMedida = dto.UnidadeMedida.Value;
            insumo.QuantidadeEstoque = dto.QuantidadeEstoque.Value;

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
        public async Task<IActionResult> Inativar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var insumo = await _context.Insumos
                .FirstOrDefaultAsync(i => i.Id == id && i.UsuarioId == usuarioId);

            if (insumo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (insumo.Ativo)
            {
                insumo.Ativo = false;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpPatch("{id:int}/reativar")]
        public async Task<IActionResult> Reativar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var insumo = await _context.Insumos
                .FirstOrDefaultAsync(i => i.Id == id && i.UsuarioId == usuarioId);

            if (insumo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (!insumo.Ativo)
            {
                insumo.Ativo = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private static readonly Expression<Func<Insumo, InsumoRespostaDto>> Projecao =
            i => new InsumoRespostaDto
            {
                Id = i.Id,
                Nome = i.Nome,
                Descricao = i.Descricao,
                Categoria = i.Categoria,
                UnidadeMedida = i.UnidadeMedida,
                QuantidadeEstoque = i.QuantidadeEstoque,
                Ativo = i.Ativo,
                PossuiMovimentacoes = i.ItensCompra.Any(),
                DataCriacao = i.DataCriacao,
                DataAtualizacao = i.DataAtualizacao
            };

        private Task<InsumoRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Insumos
                .AsNoTracking()
                .Where(i => i.Id == id && i.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private async Task<string?> VerificarNomeDuplicado(string nome, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.Insumos
                .AsNoTracking()
                .Where(i => i.UsuarioId == usuarioId
                         && i.Nome == nome
                         && (idIgnorado == null || i.Id != idIgnorado))
                .Select(i => new { i.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemNomeDuplicado
                : "Já existe um insumo inativo cadastrado com este nome. Reative-o em vez de cadastrar outro.";
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhNomeDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    }
}
