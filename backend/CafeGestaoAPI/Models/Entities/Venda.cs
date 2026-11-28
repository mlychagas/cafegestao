using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class Venda : EntidadeBase
    {
        [MaxLength(55)]
        public string? NotaFiscal { get; set; }

        public required DateOnly DataVenda { get; set; }

        public StatusVenda Status { get; set; }

        [Precision(18, 2)]
        public decimal ValorTotal { get; set; }

        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        public ICollection<ItemVenda> ItensVenda { get; set; } = new List<ItemVenda>();
    }
}
