using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class Safra : EntidadeBase
    {
        [MaxLength(20)]
        public required string AnoAgricola { get; set; }

        public StatusSafra Status { get; set; }

        public required DateOnly DataInicio { get; set; }

        public DateOnly? DataFechamento { get; set; }

        [Precision(10, 2)]
        public decimal? ProdutividadeEstimada { get; set; }

        public UnidadeProdutividade? UnidadeMedida { get; set; }

        public int PropriedadeRuralId { get; set; }
        public PropriedadeRural PropriedadeRural { get; set; } = null!;

        public ICollection<AtividadeManejo> AtividadesManejo { get; set; } = new List<AtividadeManejo>();

        public ICollection<Colheita> Colheitas { get; set; } = new List<Colheita>();
    }
}
