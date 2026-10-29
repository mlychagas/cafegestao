using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(OrdemCompraId), nameof(InsumoId))]
    public class ItemCompra
    {
        public int OrdemCompraId { get; set; }
        public OrdemCompra OrdemCompra { get; set; } = null!;

        public int InsumoId { get; set; }
        public Insumo Insumo { get; set; } = null!;

        [Precision(10,3)]
        public required decimal Quantidade { get; set; }

        [Precision(18, 2)]
        public decimal ValorUnitario { get; set; }
    }
}
