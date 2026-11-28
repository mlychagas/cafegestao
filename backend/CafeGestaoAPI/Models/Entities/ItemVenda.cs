using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(VendaId), nameof(LoteCafeId))]
    public class ItemVenda
    {
        public int VendaId { get; set; }
        public Venda Venda { get; set; } = null!;

        public int LoteCafeId { get; set; }
        public LoteCafe LoteCafe { get; set; } = null!;

        [Precision(13, 3)]
        public required decimal Quantidade { get; set; }

        [Precision(18, 2)]
        public decimal ValorUnitario { get; set; }
    }
}
