using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Talhao : EntidadeBase
    {
        [MaxLength(50)]
        public required string Nome { get; set; }

        [Precision(10, 3)]
        public required decimal AreaHa { get; set; }

        [Precision(10, 3)]
        public decimal? EspacamentoLinha { get; set; }
        
        [Precision(10, 3)]
        public decimal? EspacamentoPlanta { get; set; }

        public DateOnly? DataPlantio { get; set; }

        public int? QuantidadeMudas { get; set; }

        [MaxLength(100)]
        public string? Variedades { get; set; }

        public bool Ativo { get; set; } = true;

        // chaves estrangeiras
        public int PropriedadeRuralId { get; set; }
        public PropriedadeRural PropriedadeRural { get; set; } = null!;





    }
}
