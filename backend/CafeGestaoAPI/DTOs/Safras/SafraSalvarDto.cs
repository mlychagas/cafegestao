using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Safras
{
    public class SafraSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "O ano agrícola é obrigatório.")]
        [RegularExpression(@"^\d{4}(/\d{4})?$", ErrorMessage = "Informe o ano agrícola no formato 2026/2027 ou 2026.")]
        public string AnoAgricola { get; set; } = string.Empty;

        [Required(ErrorMessage = "O status da safra é obrigatório.")]
        [EnumDataType(typeof(StatusSafra), ErrorMessage = "Status inválido.")]
        public StatusSafra? Status { get; set; }

        [Required(ErrorMessage = "A data de início é obrigatória.")]
        public DateOnly? DataInicio { get; set; }

        public DateOnly? DataFechamento { get; set; }

        [Range(0.01, 99999999.99, ErrorMessage = "A produtividade estimada deve ser maior que zero.")]
        public decimal? ProdutividadeEstimada { get; set; }

        [EnumDataType(typeof(UnidadeProdutividade), ErrorMessage = "Unidade de medida inválida.")]
        public UnidadeProdutividade? UnidadeMedida { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var anos = AnoAgricola.Split('/');

            if (anos.Length == 2 && int.TryParse(anos[0], out var inicial) && int.TryParse(anos[1], out var final)
                && final != inicial + 1)
            {
                yield return new ValidationResult(
                    "O segundo ano deve ser o seguinte ao primeiro (ex.: 2026/2027).",
                    new[] { nameof(AnoAgricola) });
            }

            if (Status == StatusSafra.NaoInformado)
            {
                yield return new ValidationResult("Selecione o status da safra.", new[] { nameof(Status) });
            }

            if (DataFechamento.HasValue && DataInicio.HasValue && DataFechamento <= DataInicio)
            {
                yield return new ValidationResult(
                    "A data de fechamento deve ser posterior à data de início.",
                    new[] { nameof(DataFechamento) });
            }

            if (Status == StatusSafra.Encerrada && !DataFechamento.HasValue)
            {
                yield return new ValidationResult(
                    "Informe a data de fechamento para encerrar a safra.",
                    new[] { nameof(DataFechamento) });
            }

            if (UnidadeMedida == UnidadeProdutividade.NaoInformado)
            {
                yield return new ValidationResult("Selecione a unidade de medida.", new[] { nameof(UnidadeMedida) });
            }

            if (ProdutividadeEstimada.HasValue && !UnidadeMedida.HasValue)
            {
                yield return new ValidationResult(
                    "Informe a unidade de medida da produtividade estimada.",
                    new[] { nameof(UnidadeMedida) });
            }

            if (!ProdutividadeEstimada.HasValue && UnidadeMedida.HasValue)
            {
                yield return new ValidationResult(
                    "Informe a produtividade estimada ou remova a unidade de medida.",
                    new[] { nameof(ProdutividadeEstimada) });
            }
        }
    }
}
