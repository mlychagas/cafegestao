namespace CafeGestaoAPI.DTOs.Vendas
{
    public class ItemVendaRespostaDto
    {
        public int LoteCafeId { get; set; }

        public string NomeLote { get; set; } = string.Empty;

        public string AnoAgricolaSafra { get; set; } = string.Empty;

        public bool LoteAtivo { get; set; }

        public decimal SaldoKgLote { get; set; }

        public decimal Quantidade { get; set; }

        public decimal ValorUnitario { get; set; }

        public decimal Subtotal { get; set; }
    }
}
