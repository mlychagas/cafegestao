using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.MaosObra
{
    public class MaoObraItemDto : IValidatableObject
    {
        [Required(ErrorMessage = "Selecione a pessoa.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione uma pessoa válida.")]
        public int? PessoaId { get; set; }

        [Required(ErrorMessage = "Informe a função.")]
        [MaxLength(50, ErrorMessage = "A função deve ter no máximo 50 caracteres.")]
        public string Funcao { get; set; } = string.Empty;

        [Required(ErrorMessage = "Selecione a unidade de medida.")]
        [EnumDataType(typeof(UnidadeMaoObra), ErrorMessage = "Unidade de medida inválida.")]
        public UnidadeMaoObra? UnidadeMedida { get; set; }

        [Required(ErrorMessage = "Informe a quantidade.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public decimal? Quantidade { get; set; }

        [Required(ErrorMessage = "Informe o valor unitário.")]
        [Range(0, 99999999.99, ErrorMessage = "O valor unitário não pode ser negativo.")]
        public decimal? ValorUnitario { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (UnidadeMedida == UnidadeMaoObra.NaoInformado)
            {
                yield return new ValidationResult("Selecione a unidade de medida.", new[] { nameof(UnidadeMedida) });
            }
        }
    }
}
