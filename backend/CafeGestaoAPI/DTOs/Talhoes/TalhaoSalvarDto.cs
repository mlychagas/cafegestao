using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Talhoes
{
    public class TalhaoSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "A identificação do talhão é obrigatória.")]
        [MaxLength(50, ErrorMessage = "A identificação deve ter no máximo 50 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "A área do talhão é obrigatória.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A área do talhão deve ser maior que zero.")]
        public decimal? AreaHa { get; set; }

        [Range(0.01, 99.999, ErrorMessage = "O espaçamento entre linhas deve estar entre 0,01 e 99,999 metros.")]
        public decimal? EspacamentoLinha { get; set; }

        [Range(0.01, 99.999, ErrorMessage = "O espaçamento entre plantas deve estar entre 0,01 e 99,999 metros.")]
        public decimal? EspacamentoPlanta { get; set; }

        public DateOnly? DataPlantio { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A quantidade de mudas deve ser maior que zero.")]
        public int? QuantidadeMudas { get; set; }

        [DefaultValue(null)]
        [MaxLength(100, ErrorMessage = "As variedades devem ter no máximo 100 caracteres.")]
        public string? Variedades { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DataPlantio > DateOnly.FromDateTime(DateTime.Today))
            {
                yield return new ValidationResult(
                    "A data de plantio não pode ser no futuro.",
                    new[] { nameof(DataPlantio) });
            }
        }
    }
}