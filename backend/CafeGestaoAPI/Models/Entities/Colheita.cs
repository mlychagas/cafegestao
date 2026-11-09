using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class Colheita : EntidadeBase
    {
        public required DateOnly DataInicio { get; set; }

        public DateOnly? DataFim { get; set; }

        [Precision(10, 3)]
        public required decimal Quantidade { get; set; }

        public UnidadeColheita UnidadeMedida { get; set; }

        [MaxLength(50)]
        public string? FormaColheita { get; set; }

        [MaxLength(250)]
        public string? Observacao { get; set; }

        public int SafraId { get; set; }
        public Safra Safra { get; set; } = null!;

        public int AtividadeManejoId { get; set; }
        public AtividadeManejo AtividadeManejo { get; set; } = null!;

        public ICollection<TalhaoColheita> Talhoes { get; set; } = new List<TalhaoColheita>();
    }
}
