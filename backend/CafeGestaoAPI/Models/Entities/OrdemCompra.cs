using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class OrdemCompra : EntidadeBase
    {
        [MaxLength(55)]
        public required string NotaFiscal { get; set; }

        public required DateOnly DataCompra { get; set; }

        [Precision(18, 2)]
        public decimal ValorTotal { get; set; }

        // chaves estrangeiras
        public int FornecedorId { get; set; }
        public Fornecedor Fornecedor { get; set; } = null!;

        // coleção
        public ICollection<ItemCompra> ItensCompra { get; set; } = new List<ItemCompra>();

    }
}
