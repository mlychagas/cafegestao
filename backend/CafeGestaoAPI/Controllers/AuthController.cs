using CafeGestaoAPI.Data;
using CafeGestaoAPI.DTOs.Auth;
using CafeGestaoAPI.Models.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;

        public AuthController(AppDbContext context, IPasswordHasher<Usuario> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
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
    }
}
