using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Comum;
using CafeGestaoAPI.DTOs.Fornecedores;
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
    public class FornecedoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemDocumentoDuplicado = "Já existe um fornecedor cadastrado com este CPF/CNPJ.";

        private const string MensagemNaoEncontrado = "Fornecedor não encontrado.";

        private const string CampoCpfCnpj = "cpfCnpj";

        public FornecedoresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<FornecedorRespostaDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Fornecedores
                .AsNoTracking()
                .Where(f => f.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(f => f.RazaoSocial.Contains(termo) || f.CpfCnpj.Contains(termo));
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(f => f.Ativo == ativo.Value);
            }

            var fornecedores = await consulta
                .OrderByDescending(f => f.DataCriacao)
                .ThenByDescending(f => f.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(fornecedores);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<FornecedorRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var fornecedor = await ConsultarPorId(id, usuarioId);

            if (fornecedor is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            return Ok(fornecedor);
        }

        [HttpPost]
        public async Task<ActionResult<FornecedorRespostaDto>> Cadastrar(FornecedorSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var documento = NormalizarDocumento(dto.CpfCnpj);

            var mensagemDuplicado = await VerificarDocumentoDuplicado(documento, usuarioId, idIgnorado: null);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoCpfCnpj, mensagemDuplicado);
            }

            var fornecedor = new Fornecedor
            {
                RazaoSocial = dto.RazaoSocial.Trim(),
                CpfCnpj = documento,
                Telefone = dto.Telefone,
                Celular = TextoOuNulo(dto.Celular),
                Email = NormalizarEmail(dto.Email),
                UsuarioId = usuarioId,
                Endereco = CriarEndereco(dto.Endereco!)
            };

            _context.Fornecedores.Add(fornecedor);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDocumentoDuplicado(ex))
            {
                return ConflitoNoCampo(CampoCpfCnpj, MensagemDocumentoDuplicado);
            }

            var resposta = await ConsultarPorId(fornecedor.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = fornecedor.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, FornecedorSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var fornecedor = await _context.Fornecedores
                .Include(f => f.Endereco)
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId == usuarioId);

            if (fornecedor is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var documento = NormalizarDocumento(dto.CpfCnpj);

            var mensagemDuplicado = await VerificarDocumentoDuplicado(documento, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoCpfCnpj, mensagemDuplicado);
            }

            fornecedor.RazaoSocial = dto.RazaoSocial.Trim();
            fornecedor.CpfCnpj = documento;
            fornecedor.Telefone = dto.Telefone;
            fornecedor.Celular = TextoOuNulo(dto.Celular);
            fornecedor.Email = NormalizarEmail(dto.Email);
            AtualizarEndereco(fornecedor.Endereco, dto.Endereco!);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDocumentoDuplicado(ex))
            {
                return ConflitoNoCampo(CampoCpfCnpj, MensagemDocumentoDuplicado);
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

            var fornecedor = await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId == usuarioId);

            if (fornecedor is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (fornecedor.Ativo)
            {
                fornecedor.Ativo = false;
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

            var fornecedor = await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId == usuarioId);

            if (fornecedor is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (!fornecedor.Ativo)
            {
                fornecedor.Ativo = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private static readonly Expression<Func<Fornecedor, FornecedorRespostaDto>> Projecao =
            f => new FornecedorRespostaDto
            {
                Id = f.Id,
                RazaoSocial = f.RazaoSocial,
                CpfCnpj = f.CpfCnpj,
                Telefone = f.Telefone,
                Celular = f.Celular,
                Email = f.Email,
                Ativo = f.Ativo,
                Endereco = new EnderecoDto
                {
                    Rua = f.Endereco.Rua,
                    Numero = f.Endereco.Numero,
                    Cep = f.Endereco.Cep,
                    Bairro = f.Endereco.Bairro,
                    Cidade = f.Endereco.Cidade,
                    Uf = f.Endereco.Uf,
                    Pais = f.Endereco.Pais,
                    Complemento = f.Endereco.Complemento
                },
                QuantidadeCompras = f.OrdensCompra.Count(),
                DataCriacao = f.DataCriacao,
                DataAtualizacao = f.DataAtualizacao
            };

        private Task<FornecedorRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Fornecedores
                .AsNoTracking()
                .Where(f => f.Id == id && f.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private async Task<string?> VerificarDocumentoDuplicado(string documento, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.Fornecedores
                .AsNoTracking()
                .Where(f => f.UsuarioId == usuarioId
                         && f.CpfCnpj == documento
                         && (idIgnorado == null || f.Id != idIgnorado))
                .Select(f => new { f.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemDocumentoDuplicado
                : "Já existe um fornecedor inativo cadastrado com este CPF/CNPJ. Reative-o em vez de cadastrar outro.";
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhDocumentoDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private static string NormalizarDocumento(string documento) =>
            documento.Trim().ToUpperInvariant();

        private static string NormalizarEmail(string email) =>
            email.Trim().ToLowerInvariant();

        private static Endereco CriarEndereco(EnderecoDto dto) => new()
        {
            Rua = dto.Rua.Trim(),
            Numero = dto.Numero.Trim(),
            Cep = dto.Cep,
            Bairro = dto.Bairro.Trim(),
            Cidade = dto.Cidade.Trim(),
            Uf = dto.Uf,
            Pais = TextoOuNulo(dto.Pais) ?? "Brasil",
            Complemento = TextoOuNulo(dto.Complemento)
        };

        private static void AtualizarEndereco(Endereco endereco, EnderecoDto dto)
        {
            endereco.Rua = dto.Rua.Trim();
            endereco.Numero = dto.Numero.Trim();
            endereco.Cep = dto.Cep;
            endereco.Bairro = dto.Bairro.Trim();
            endereco.Cidade = dto.Cidade.Trim();
            endereco.Uf = dto.Uf;
            endereco.Pais = TextoOuNulo(dto.Pais) ?? "Brasil";
            endereco.Complemento = TextoOuNulo(dto.Complemento);
        }

        private static string? TextoOuNulo(string? texto) =>
            string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    }
}
