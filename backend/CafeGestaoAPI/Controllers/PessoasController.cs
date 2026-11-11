using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Pessoas;
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
    public class PessoasController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemCpfDuplicado = "Já existe uma pessoa cadastrada com este CPF.";

        private const string MensagemNaoEncontrada = "Pessoa não encontrada.";

        private const string CampoCpf = "cpf";

        public PessoasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<PessoaRespostaDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Pessoas
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(p => p.Nome.Contains(termo) || p.Cpf.Contains(termo));
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(p => p.Ativo == ativo.Value);
            }

            var pessoas = await consulta
                .OrderBy(p => p.Nome)
                .Select(Projecao)
                .ToListAsync();

            return Ok(pessoas);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PessoaRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var pessoa = await ConsultarPorId(id, usuarioId);

            if (pessoa is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            return Ok(pessoa);
        }

        [HttpPost]
        public async Task<ActionResult<PessoaRespostaDto>> Cadastrar(PessoaSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var cpf = dto.Cpf.Trim();

            var mensagemDuplicado = await VerificarCpfDuplicado(cpf, usuarioId, idIgnorado: null);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoCpf, mensagemDuplicado);
            }

            var pessoa = new Pessoa
            {
                Nome = dto.Nome.Trim(),
                Cpf = cpf,
                Telefone = TextoOuNulo(dto.Telefone),
                DataNascimento = dto.DataNascimento!.Value,
                UsuarioId = usuarioId
            };

            _context.Pessoas.Add(pessoa);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoCpf, MensagemCpfDuplicado);
            }

            var resposta = await ConsultarPorId(pessoa.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = pessoa.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, PessoaSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var pessoa = await _context.Pessoas
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (pessoa is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            var cpf = dto.Cpf.Trim();

            var mensagemDuplicado = await VerificarCpfDuplicado(cpf, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoCpf, mensagemDuplicado);
            }

            pessoa.Nome = dto.Nome.Trim();
            pessoa.Cpf = cpf;
            pessoa.Telefone = TextoOuNulo(dto.Telefone);
            pessoa.DataNascimento = dto.DataNascimento!.Value;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDuplicado(ex))
            {
                return ConflitoNoCampo(CampoCpf, MensagemCpfDuplicado);
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

            var pessoa = await _context.Pessoas
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (pessoa is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrada });
            }

            if (pessoa.Ativo != ativo)
            {
                pessoa.Ativo = ativo;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private static readonly Expression<Func<Pessoa, PessoaRespostaDto>> Projecao =
            p => new PessoaRespostaDto
            {
                Id = p.Id,
                Nome = p.Nome,
                Cpf = p.Cpf,
                Telefone = p.Telefone,
                DataNascimento = p.DataNascimento,
                Ativo = p.Ativo,
                DataCriacao = p.DataCriacao,
                DataAtualizacao = p.DataAtualizacao
            };

        private Task<PessoaRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Pessoas
                .AsNoTracking()
                .Where(p => p.Id == id && p.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private async Task<string?> VerificarCpfDuplicado(string cpf, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.Pessoas
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId
                         && p.Cpf == cpf
                         && (idIgnorado == null || p.Id != idIgnorado))
                .Select(p => new { p.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemCpfDuplicado
                : "Já existe uma pessoa inativa com este CPF. Reative-a em vez de cadastrar outra.";
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    }
}
