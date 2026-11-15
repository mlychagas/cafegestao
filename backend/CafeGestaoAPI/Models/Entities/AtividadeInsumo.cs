using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(InsumoId), nameof(AtividadeManejoId))]
    public class AtividadeInsumo
    {
        public int InsumoId { get; set; }
        public Insumo Insumo { get; set; } = null!;

        public int AtividadeManejoId { get; set; }
        public AtividadeManejo AtividadeManejo { get; set; } = null!;

        [Precision(10, 3)]
        public decimal QuantidadeUtilizada { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime? DataAtualizacao { get; set; }
    }
}
