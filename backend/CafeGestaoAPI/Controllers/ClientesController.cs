using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Comum;
using CafeGestaoAPI.DTOs.Clientes;
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
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const string MensagemDocumentoDuplicado = "Já existe um cliente cadastrado com este CPF/CNPJ.";

        private const string MensagemNaoEncontrado = "Cliente não encontrado.";

        private const string CampoCpfCnpj = "cpfCnpj";

        public ClientesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<ClienteRespostaDto>>> Listar(
            [FromQuery] string? pesquisa,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.Clientes
                .AsNoTracking()
                .Where(c => c.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(pesquisa))
            {
                var termo = pesquisa.Trim();
                consulta = consulta.Where(c => c.Nome.Contains(termo) || c.CpfCnpj.Contains(termo));
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(c => c.Ativo == ativo.Value);
            }

            var clientes = await consulta
                .OrderByDescending(c => c.DataCriacao)
                .ThenByDescending(c => c.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(clientes);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ClienteRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var cliente = await ConsultarPorId(id, usuarioId);

            if (cliente is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            return Ok(cliente);
        }

        [HttpPost]
        public async Task<ActionResult<ClienteRespostaDto>> Cadastrar(ClienteSalvarDto dto)
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

            var cliente = new Cliente
            {
                Nome = dto.Nome.Trim(),
                CpfCnpj = documento,
                Telefone = dto.Telefone,
                Celular = TextoOuNulo(dto.Celular),
                Email = NormalizarEmail(dto.Email),
                UsuarioId = usuarioId,
                Endereco = CriarEndereco(dto.Endereco!)
            };

            _context.Clientes.Add(cliente);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhDocumentoDuplicado(ex))
            {
                return ConflitoNoCampo(CampoCpfCnpj, MensagemDocumentoDuplicado);
            }

            var resposta = await ConsultarPorId(cliente.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = cliente.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, ClienteSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var cliente = await _context.Clientes
                .Include(c => c.Endereco)
                .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

            if (cliente is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            var documento = NormalizarDocumento(dto.CpfCnpj);

            var mensagemDuplicado = await VerificarDocumentoDuplicado(documento, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoCpfCnpj, mensagemDuplicado);
            }

            cliente.Nome = dto.Nome.Trim();
            cliente.CpfCnpj = documento;
            cliente.Telefone = dto.Telefone;
            cliente.Celular = TextoOuNulo(dto.Celular);
            cliente.Email = NormalizarEmail(dto.Email);
            AtualizarEndereco(cliente.Endereco, dto.Endereco!);

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

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

            if (cliente is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (cliente.Ativo)
            {
                cliente.Ativo = false;
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

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

            if (cliente is null)
            {
                return NotFound(new { mensagem = MensagemNaoEncontrado });
            }

            if (!cliente.Ativo)
            {
                cliente.Ativo = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private static readonly Expression<Func<Cliente, ClienteRespostaDto>> Projecao =
            c => new ClienteRespostaDto
            {
                Id = c.Id,
                Nome = c.Nome,
                CpfCnpj = c.CpfCnpj,
                Telefone = c.Telefone,
                Celular = c.Celular,
                Email = c.Email,
                Ativo = c.Ativo,
                Endereco = new EnderecoDto
                {
                    Rua = c.Endereco.Rua,
                    Numero = c.Endereco.Numero,
                    Cep = c.Endereco.Cep,
                    Bairro = c.Endereco.Bairro,
                    Cidade = c.Endereco.Cidade,
                    Uf = c.Endereco.Uf,
                    Pais = c.Endereco.Pais,
                    Complemento = c.Endereco.Complemento
                },
                QuantidadeVendas = c.Vendas.Count(),
                DataCriacao = c.DataCriacao,
                DataAtualizacao = c.DataAtualizacao
            };

        private Task<ClienteRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.Clientes
                .AsNoTracking()
                .Where(c => c.Id == id && c.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

        private async Task<string?> VerificarDocumentoDuplicado(string documento, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.Clientes
                .AsNoTracking()
                .Where(c => c.UsuarioId == usuarioId
                         && c.CpfCnpj == documento
                         && (idIgnorado == null || c.Id != idIgnorado))
                .Select(c => new { c.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemDocumentoDuplicado
                : "Já existe um cliente inativo cadastrado com este CPF/CNPJ. Reative-o em vez de cadastrar outro.";
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
