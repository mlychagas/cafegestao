using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class LoteCafe : EntidadeBase
    {
        [MaxLength(100)]
        public required string Nome { get; set; }

        [Precision(10, 3)]
        public required decimal Quantidade { get; set; }

        public UnidadePeso UnidadeMedida { get; set; }

        [Precision(13, 3)]
        public decimal SaldoKg { get; set; }

        public required DateOnly DataArmazenamento { get; set; }

        public FormaProcessamento FormaProcessamento { get; set; }

        [Precision(5, 2)]
        public decimal? Umidade { get; set; }

        [MaxLength(250)]
        public string? Observacao { get; set; }

        public bool Ativo { get; set; } = true;

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public int SafraId { get; set; }
        public Safra Safra { get; set; } = null!;

        public ICollection<ItemVenda> ItensVenda { get; set; } = new List<ItemVenda>();
    }
}
