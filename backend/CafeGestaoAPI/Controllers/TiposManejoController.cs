using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.TiposManejo;
using CafeGestaoAPI.Extensions;
using CafeGestaoAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace CafeGestaoAPI.Controllers
{
    [Authorize]
    [Route("api/tipos-manejo")]
    [ApiController]
    public class TiposManejoController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemNomeDuplicado = "Já existe um tipo de manejo com este nome.";

        private const string MensagemNaoEncontrado = "Tipo de manejo não encontrado.";

        private const string CampoNome = "nome";

        public TiposManejoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<TipoManejoRespostaDto>>> Listar([FromQuery] string? nome)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.TiposManejo
                .AsNoTracking()
                .Where(t => t.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(nome))
            {
                var termo = nome.Trim();
                consulta = consulta.Where(t => t.Nome.Contains(termo));
            }

            var tipos = await consulta
                .OrderBy(t => t.Nome)
                .Select(Projecao)
                .ToListAsync();

            return Ok(tipos);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TipoManejoRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var tipo = await ConsultarPorId(id, usuarioId);

            if (tipo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            return Ok(tipo);
        }

        [HttpPost]
        public async Task<ActionResult<TipoManejoRespostaDto>> Cadastrar(TipoManejoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var nome = dto.Nome.Trim();

            if (await NomeDuplicado(nome, usuarioId, idIgnorado: null))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var tipo = new TipoManejo
            {
                Nome = nome,
                Descricao = TextoOuNulo(dto.Descricao),
                UsuarioId = usuarioId
            };

            _context.TiposManejo.Add(tipo);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhNomeDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var resposta = await ConsultarPorId(tipo.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = tipo.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, TipoManejoSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var tipo = await _context.TiposManejo
                .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == usuarioId);

            if (tipo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var nome = dto.Nome.Trim();

            if (await NomeDuplicado(nome, usuarioId, idIgnorado: id))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            tipo.Nome = nome;
            tipo.Descricao = TextoOuNulo(dto.Descricao);

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

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Excluir(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var tipo = await _context.TiposManejo
                .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == usuarioId);

            if (tipo is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var emUso = await _context.AtividadesManejo.AnyAsync(a => a.TipoManejoId == id);

            if (emUso)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível excluir este tipo de manejo porque ele está vinculado a atividades de manejo."
                });
            }

            _context.TiposManejo.Remove(tipo);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.RowIsReferenced2 })
            {
                return Conflict(new
                {
                    mensagem = "Não é possível excluir este tipo de manejo porque ele está vinculado a atividades de manejo."
                });
            }

            return NoContent();
        }

        private static readonly Expression<Func<TipoManejo, TipoManejoRespostaDto>> Projecao =
            t => new TipoManejoRespostaDto
            {
                Id = t.Id,
                Nome = t.Nome,
                Descricao = t.Descricao,
                QuantidadeAtividades = t.AtividadesManejo.Count(),
                DataCriacao = t.DataCriacao,
                DataAtualizacao = t.DataAtualizacao
            };

        private Task<TipoManejoRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.TiposManejo
                .AsNoTracking()
                .Where(t => t.Id == id && t.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private Task<bool> NomeDuplicado(string nome, int usuarioId, int? idIgnorado)
        {
            return _context.TiposManejo
                .AsNoTracking()
                .AnyAsync(t => t.UsuarioId == usuarioId
                            && t.Nome == nome
                            && (idIgnorado == null || t.Id != idIgnorado));
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhNomeDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    }
}
