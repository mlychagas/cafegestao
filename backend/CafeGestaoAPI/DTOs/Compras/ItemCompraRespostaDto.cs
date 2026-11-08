using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Compras
{
    public class ItemCompraRespostaDto
    {
        public int InsumoId { get; set; }

        public string NomeInsumo { get; set; } = string.Empty;

        public UnidadeInsumo UnidadeMedida { get; set; }

        public bool InsumoAtivo { get; set; }

        public decimal Quantidade { get; set; }

        public decimal ValorUnitario { get; set; }

        public decimal Subtotal { get; set; }
    }
}
