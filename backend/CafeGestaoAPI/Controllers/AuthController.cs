using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Auth;
using CafeGestaoAPI.Models.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeGestaoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using CafeGestaoAPI.Extensions;

namespace CafeGestaoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthController(AppDbContext context, IPasswordHasher<Usuario> passwordHasher, ITokenService tokenService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        [HttpPost("cadastro")]
        public async Task<ActionResult<UsuarioRespostaDto>> Cadastrar(CadastroUsuarioDto dto)
        {

            var emailNormalizado = dto.Email.Trim().ToLower();
            if (await _context.Usuarios.AnyAsync(u => u.Email == emailNormalizado))
            {
                return Conflict(new { mensagem = "Este e-mail já está cadastrado." });
            }

            var usuario = new Usuario
            {
                Nome = dto.Nome,
                Email = emailNormalizado,
                DataNascimento = dto.DataNascimento!.Value,
                SenhaHash = string.Empty
            };

            usuario.SenhaHash = _passwordHasher.HashPassword(usuario, dto.Senha);
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            var resposta = new UsuarioRespostaDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email
            };

            return StatusCode(StatusCodes.Status201Created, resposta);

        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginRespostaDto>> Login(LoginDto dto)
        {
            var emailNormalizado = dto.Email.Trim().ToLower();

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailNormalizado);

            if (usuario == null)
            {
                return Unauthorized(new { mensagem = "Credenciais inválidas." });
            }

            

            if (usuario.BloqueadoAte > DateTime.UtcNow)
            {
                return Unauthorized(new { mensagem = "Conta bloqueada temporariamente. Tente novamente mais tarde." });
            }

            var resultado = _passwordHasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dto.Senha);


            if (resultado == PasswordVerificationResult.Failed)
            {
                usuario.TentativasLogin++;
                if (usuario.TentativasLogin >= 4)
                {
                    usuario.BloqueadoAte = DateTime.UtcNow.AddMinutes(15);
                    usuario.TentativasLogin = 0;
                    await _context.SaveChangesAsync();
                    return Unauthorized(new { mensagem = "Conta bloqueada temporariamente devido a múltiplas tentativas de login falhadas. Tente novamente em 15 minutos." });
                }
                else
                {
                    await _context.SaveChangesAsync();
                    return Unauthorized(new { mensagem = "Credenciais inválidas." });
                }
            }
            if (usuario.Ativo == false)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Usuário inativo." });
            }
            if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
            {
                usuario.SenhaHash = _passwordHasher.HashPassword(usuario, dto.Senha);
                await _context.SaveChangesAsync();
            }
            if (resultado == PasswordVerificationResult.Success)
            {
                usuario.TentativasLogin = 0;
                usuario.BloqueadoAte = null;
                usuario.UltimoLogin = DateTime.UtcNow;
                await _context.SaveChangesAsync();

            }

            var (token, expiracao) = _tokenService.GerarToken(usuario);

            var resposta = new LoginRespostaDto
            {
                Token = token,
                Expiracao = expiracao,
                Usuario = new UsuarioRespostaDto
                {
                    Id = usuario.Id,
                    Nome = usuario.Nome,
                    Email = usuario.Email
                }
            };

            return Ok(resposta);

        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UsuarioRespostaDto>> ObterUsuarioLogado()
        {
            var usuarioId = User.ObterUsuarioId();

            if (usuarioId is null)
            {
                return Unauthorized(new { mensagem = "Usuário não autenticado." });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId.Value);
            if (usuario is null)
            {
                return Unauthorized(new { mensagem = "Usuário não autenticado." });
            }

            return Ok(new UsuarioRespostaDto
            {
                Id = usuario.Id,
                Nome = usuario.Nome,
                Email = usuario.Email
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var id = User.ObterUsuarioId();
            if (id is null)
            {
                return Unauthorized(new { mensagem = "Usuário não autenticado." });
            }

            var usuario = await _context.Usuarios.FindAsync(id.Value);
            if (usuario is null)
            {
                return Unauthorized(new { mensagem = "Usuário não autenticado." });
            }
            usuario.VersaoToken++;
            await _context.SaveChangesAsync();
            return NoContent();

        }
    }
}
