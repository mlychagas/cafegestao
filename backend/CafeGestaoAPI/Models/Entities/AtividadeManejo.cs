using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class AtividadeManejo : EntidadeBase
    {
        [MaxLength(150)]
        public required string Descricao { get; set; }

        public required DateOnly DataPlanejada { get; set; }

        public DateOnly? DataConclusao { get; set; }

        [Precision(8, 2)]
        public decimal? HorasPrevistas { get; set; }

        [Precision(8, 2)]
        public decimal? HorasTrabalhadas { get; set; }

        [MaxLength(250)]
        public string? Observacao { get; set; }

        public StatusAtividadeManejo Status { get; set; }

        public int TipoManejoId { get; set; }
        public TipoManejo TipoManejo { get; set; } = null!;

        public int SafraId { get; set; }
        public Safra Safra { get; set; } = null!;

        public Colheita? Colheita { get; set; }

        public ICollection<TalhaoAtividadeManejo> Talhoes { get; set; } = new List<TalhaoAtividadeManejo>();
    }
}
