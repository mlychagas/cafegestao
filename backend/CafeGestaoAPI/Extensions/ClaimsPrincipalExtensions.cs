using System.Security.Claims;
using System.Threading.Tasks;

namespace CafeGestaoAPI.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int? ObterUsuarioId(this ClaimsPrincipal user)
        {
            var id =  user.FindFirst("sub")?.Value;
            return int.TryParse(id, out var usuarioId) ? usuarioId : null;
        }

    }
}
