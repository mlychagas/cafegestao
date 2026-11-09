using System.Globalization;
using System.Linq.Expressions;
using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Comum;
using CafeGestaoAPI.DTOs.Propriedades;
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
    public class PropriedadesController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly CultureInfo PtBr = new("pt-BR");

        private const string MensagemNomeDuplicado = "Já existe uma propriedade rural cadastrada com este nome.";

        private const string CampoNome = "nome";

        private const string CampoAreaCultivada = "areaCultivadaHa";

        public PropriedadesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<PropriedadeRespostaDto>>> Listar(
            [FromQuery] string? nome,
            [FromQuery] bool? ativo)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var consulta = _context.PropriedadesRurais
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId);

            if (!string.IsNullOrWhiteSpace(nome))
            {
                var termo = nome.Trim();
                consulta = consulta.Where(p => p.Nome.Contains(termo));
            }

            if (ativo.HasValue)
            {
                consulta = consulta.Where(p => p.Ativo == ativo.Value);
            }

            var propriedades = await consulta
                .OrderByDescending(p => p.DataCriacao)
                .ThenByDescending(p => p.Id)
                .Select(Projecao)
                .ToListAsync();

            return Ok(propriedades);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PropriedadeRespostaDto>> Obter(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var propriedade = await ConsultarPorId(id, usuarioId);

            if (propriedade is null)
            {
                return NotFound(new { mensagem = "Propriedade não encontrada." });
            }

            return Ok(propriedade);
        }

        [HttpPost]
        public async Task<ActionResult<PropriedadeRespostaDto>> Cadastrar(PropriedadeSalvarDto dto)
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

            var propriedade = new PropriedadeRural
            {
                Nome = nome,
                AreaTotalHa = dto.AreaTotalHa!.Value,
                AreaCultivadaHa = dto.AreaCultivadaHa!.Value,
                NomeProprietario = TextoOuNulo(dto.NomeProprietario),
                CpfProprietario = TextoOuNulo(dto.CpfProprietario),
                UsuarioId = usuarioId,
                Endereco = CriarEndereco(dto.Endereco!)
            };

            _context.PropriedadesRurais.Add(propriedade);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (EhNomeDuplicado(ex))
            {
                return ConflitoNoCampo(CampoNome, MensagemNomeDuplicado);
            }

            var resposta = await ConsultarPorId(propriedade.Id, usuarioId);

            return CreatedAtAction(nameof(Obter), new { id = propriedade.Id }, resposta);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, PropriedadeSalvarDto dto)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var propriedade = await _context.PropriedadesRurais
                .Include(p => p.Endereco)
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (propriedade is null)
            {
                return NotFound(new { mensagem = "Propriedade não encontrada." });
            }

            var nome = dto.Nome.Trim();

            var mensagemDuplicado = await VerificarNomeDuplicado(nome, usuarioId, idIgnorado: id);

            if (mensagemDuplicado is not null)
            {
                return ConflitoNoCampo(CampoNome, mensagemDuplicado);
            }

            var areaTalhoesAtivos = await _context.Talhoes
                .Where(t => t.PropriedadeRuralId == id && t.Ativo)
                .SumAsync(t => t.AreaHa);

            if (dto.AreaCultivadaHa < areaTalhoesAtivos)
            {
                return ConflitoNoCampo(
                    CampoAreaCultivada,
                    $"A área cultivada não pode ser menor que a soma das áreas dos talhões ativos " +
                    $"({areaTalhoesAtivos.ToString("N3", PtBr)} ha).");
            }

            propriedade.Nome = nome;
            propriedade.AreaTotalHa = dto.AreaTotalHa!.Value;
            propriedade.AreaCultivadaHa = dto.AreaCultivadaHa!.Value;
            propriedade.NomeProprietario = TextoOuNulo(dto.NomeProprietario);
            propriedade.CpfProprietario = TextoOuNulo(dto.CpfProprietario);
            AtualizarEndereco(propriedade.Endereco, dto.Endereco!);

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

            var propriedade = await _context.PropriedadesRurais
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (propriedade is null)
            {
                return NotFound(new { mensagem = "Propriedade não encontrada." });
            }

            if (!propriedade.Ativo)
            {
                return NoContent();
            }

            var possuiTalhoesAtivos = await _context.Talhoes
                .AnyAsync(t => t.PropriedadeRuralId == id && t.Ativo);

            if (possuiTalhoesAtivos)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível inativar a propriedade porque ela possui talhões ativos. " +
                               "Inative os talhões primeiro."
                });
            }

            var possuiSafrasAtivas = await _context.Safras
                .AnyAsync(s => s.PropriedadeRuralId == id && s.Status != StatusSafra.Encerrada);

            if (possuiSafrasAtivas)
            {
                return Conflict(new
                {
                    mensagem = "Não é possível inativar a propriedade porque ela possui safras planejadas ou em andamento. " +
                               "Encerre as safras primeiro."
                });
            }

            propriedade.Ativo = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id:int}/reativar")]
        public async Task<IActionResult> Reativar(int id)
        {
            if (User.ObterUsuarioId() is not int usuarioId)
            {
                return Unauthorized();
            }

            var propriedade = await _context.PropriedadesRurais
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId);

            if (propriedade is null)
            {
                return NotFound(new { mensagem = "Propriedade não encontrada." });
            }

            if (!propriedade.Ativo)
            {
                propriedade.Ativo = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        private static readonly Expression<Func<PropriedadeRural, PropriedadeRespostaDto>> Projecao =
            p => new PropriedadeRespostaDto
            {
                Id = p.Id,
                Nome = p.Nome,
                AreaTotalHa = p.AreaTotalHa,
                AreaCultivadaHa = p.AreaCultivadaHa,
                NomeProprietario = p.NomeProprietario,
                CpfProprietario = p.CpfProprietario,
                Ativo = p.Ativo,
                Endereco = new EnderecoDto
                {
                    Rua = p.Endereco.Rua,
                    Numero = p.Endereco.Numero,
                    Cep = p.Endereco.Cep,
                    Bairro = p.Endereco.Bairro,
                    Cidade = p.Endereco.Cidade,
                    Uf = p.Endereco.Uf,
                    Pais = p.Endereco.Pais,
                    Complemento = p.Endereco.Complemento
                },
                QuantidadeTalhoes = p.Talhoes.Count(t => t.Ativo),
                AreaTalhoesHa = p.Talhoes.Where(t => t.Ativo).Sum(t => t.AreaHa),
                DataCriacao = p.DataCriacao,
                DataAtualizacao = p.DataAtualizacao
            };

        private async Task<string?> VerificarNomeDuplicado(string nome, int usuarioId, int? idIgnorado)
        {
            var existente = await _context.PropriedadesRurais
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId
                         && p.Nome == nome
                         && (idIgnorado == null || p.Id != idIgnorado))
                .Select(p => new { p.Ativo })
                .FirstOrDefaultAsync();

            if (existente is null)
            {
                return null;
            }

            return existente.Ativo
                ? MensagemNomeDuplicado
                : "Já existe uma propriedade rural inativa cadastrada com este nome. Reative-a em vez de cadastrar outra.";
        }

        private ConflictObjectResult ConflitoNoCampo(string campo, string mensagem) =>
            Conflict(new { mensagem, campo });

        private static bool EhNomeDuplicado(DbUpdateException ex) =>
            ex.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

        private Task<PropriedadeRespostaDto?> ConsultarPorId(int id, int usuarioId)
        {
            return _context.PropriedadesRurais
                .AsNoTracking()
                .Where(p => p.Id == id && p.UsuarioId == usuarioId)
                .Select(Projecao)
                .FirstOrDefaultAsync();
        }

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