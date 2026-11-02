
namespace CafeGestaoAPI.DTOs.Auth
{
    public class LoginRespostaDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiracao { get; set; }
        public UsuarioRespostaDto Usuario { get; set; } = null!;
    }
}
