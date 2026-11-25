using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.LotesCafe
{
    public class LoteCafeSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "O nome do lote é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Informe o peso armazenado no lote.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public decimal? Quantidade { get; set; }

        [Required(ErrorMessage = "Selecione a unidade de medida.")]
        [EnumDataType(typeof(UnidadePeso), ErrorMessage = "Unidade de medida inválida.")]
        public UnidadePeso? UnidadeMedida { get; set; }

        [Required(ErrorMessage = "A data de armazenamento é obrigatória.")]
        public DateOnly? DataArmazenamento { get; set; }

        [Required(ErrorMessage = "Selecione a forma de processamento.")]
        [EnumDataType(typeof(global::CafeGestaoAPI.Models.Enums.FormaProcessamento), ErrorMessage = "Forma de processamento inválida.")]
        public global::CafeGestaoAPI.Models.Enums.FormaProcessamento? FormaProcessamento { get; set; }

        [Range(0.01, 100, ErrorMessage = "A umidade deve ser maior que 0 e no máximo 100%.")]
        public decimal? Umidade { get; set; }

        [DefaultValue(null)]
        [MaxLength(250, ErrorMessage = "A observação deve ter no máximo 250 caracteres.")]
        public string? Observacao { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (UnidadeMedida == UnidadePeso.NaoInformado)
            {
                yield return new ValidationResult("Selecione a unidade de medida.", new[] { nameof(UnidadeMedida) });
            }

            if (FormaProcessamento == global::CafeGestaoAPI.Models.Enums.FormaProcessamento.NaoInformado)
            {
                yield return new ValidationResult("Selecione a forma de processamento.", new[] { nameof(FormaProcessamento) });
            }

            if (DataArmazenamento > DateOnly.FromDateTime(DateTime.Today))
            {
                yield return new ValidationResult(
                    "A data de armazenamento não pode ser no futuro.",
                    new[] { nameof(DataArmazenamento) });
            }
        }
    }
}
