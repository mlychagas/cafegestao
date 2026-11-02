using CafeGestaoAPI.Models.Entities;

namespace CafeGestaoAPI.Services
{
    public interface ITokenService
    {
        (string Token, DateTime Expiracao) GerarToken(Usuario usuario);
    }
}
