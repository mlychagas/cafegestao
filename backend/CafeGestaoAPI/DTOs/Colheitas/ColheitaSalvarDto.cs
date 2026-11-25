using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Colheitas
{
    public class ColheitaSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "A data de início é obrigatória.")]
        public DateOnly? DataInicio { get; set; }

        public DateOnly? DataFim { get; set; }

        [Required(ErrorMessage = "Informe a quantidade colhida.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A quantidade colhida deve ser maior que zero.")]
        public decimal? Quantidade { get; set; }

        [Required(ErrorMessage = "Selecione a unidade de medida.")]
        [EnumDataType(typeof(UnidadePeso), ErrorMessage = "Unidade de medida inválida.")]
        public UnidadePeso? UnidadeMedida { get; set; }

        [DefaultValue(null)]
        [MaxLength(50, ErrorMessage = "A forma de colheita deve ter no máximo 50 caracteres.")]
        public string? FormaColheita { get; set; }

        [DefaultValue(null)]
        [MaxLength(250, ErrorMessage = "A observação deve ter no máximo 250 caracteres.")]
        public string? Observacao { get; set; }

        [Required(ErrorMessage = "Selecione pelo menos um talhão.")]
        [MinLength(1, ErrorMessage = "Selecione pelo menos um talhão.")]
        public List<int> TalhaoIds { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);

            if (UnidadeMedida == UnidadePeso.NaoInformado)
            {
                yield return new ValidationResult("Selecione a unidade de medida.", new[] { nameof(UnidadeMedida) });
            }

            if (DataInicio > hoje)
            {
                yield return new ValidationResult("A data de início não pode ser no futuro.", new[] { nameof(DataInicio) });
            }

            if (DataFim > hoje)
            {
                yield return new ValidationResult("A data de fim não pode ser no futuro.", new[] { nameof(DataFim) });
            }

            if (DataFim.HasValue && DataInicio.HasValue && DataFim < DataInicio)
            {
                yield return new ValidationResult(
                    "A data de fim não pode ser anterior à data de início.",
                    new[] { nameof(DataFim) });
            }

            if (TalhaoIds.Distinct().Count() != TalhaoIds.Count)
            {
                yield return new ValidationResult("O mesmo talhão foi informado mais de uma vez.", new[] { nameof(TalhaoIds) });
            }
        }
    }
}
