namespace CafeGestaoAPI.DTOs.AtividadesManejo
{
    public class TalhaoAtividadeDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public decimal AreaHa { get; set; }

        public bool Ativo { get; set; }
    }
}
