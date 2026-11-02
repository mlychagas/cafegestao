using CafeGestaoAPI.Configuracoes;
using CafeGestaoAPI.Models.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace CafeGestaoAPI.Services
{
    public class TokenService : ITokenService
    {
        private readonly JwtConfiguracoes _jwtConfiguracoes;

        public TokenService(IOptions<JwtConfiguracoes> jwtConfiguracoes)
        {
            _jwtConfiguracoes = jwtConfiguracoes.Value;
        }

        public (string Token, DateTime Expiracao) GerarToken(Usuario usuario)
        {
            var expiracao = DateTime.UtcNow.AddHours(_jwtConfiguracoes.ExpiracaoHoras);

            var chaveEmBytes = Convert.FromBase64String(_jwtConfiguracoes.Chave);

            var chaveAssinatura = new SymmetricSecurityKey(chaveEmBytes);

            var credenciais = new SigningCredentials(chaveAssinatura, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                new Claim(JwtRegisteredClaimNames.Name, usuario.Nome),
                new Claim("versao_token", usuario.VersaoToken.ToString())
            };

            var descritor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiracao,
                Issuer = _jwtConfiguracoes.Emissor,
                Audience = _jwtConfiguracoes.Publico,
                SigningCredentials = credenciais
            };

            var token = new JsonWebTokenHandler().CreateToken(descritor);
            return (token, expiracao);
        }
    }
}
