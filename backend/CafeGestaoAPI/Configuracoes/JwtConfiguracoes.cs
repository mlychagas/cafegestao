namespace CafeGestaoAPI.Configuracoes
{
    public class JwtConfiguracoes
    {
        public string Chave { get; set; } = string.Empty;

        public string Emissor { get; set; } = string.Empty;

        public string Publico { get; set; } = string.Empty;

        public int ExpiracaoHoras { get; set; }
    }
}
