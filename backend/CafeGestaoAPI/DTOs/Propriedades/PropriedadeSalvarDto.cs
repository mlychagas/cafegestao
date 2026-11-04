using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.DTOs.Comum;

namespace CafeGestaoAPI.DTOs.Propriedades
{
    public class PropriedadeSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "O nome da propriedade é obrigatório.")]
        [MaxLength(50, ErrorMessage = "O nome deve ter no máximo 50 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "A área total é obrigatória.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A área total deve ser maior que zero.")]
        public decimal? AreaTotalHa { get; set; }

        [Required(ErrorMessage = "A área cultivada é obrigatória.")]
        [Range(0, 9999999.999, ErrorMessage = "A área cultivada não pode ser negativa.")]
        public decimal? AreaCultivadaHa { get; set; }

        [MaxLength(100, ErrorMessage = "O nome do proprietário deve ter no máximo 100 caracteres.")]
        public string? NomeProprietario { get; set; }

        [RegularExpression(@"^\d{3}\.\d{3}\.\d{3}-\d{2}$", ErrorMessage = "Informe o CPF no formato 000.000.000-00.")]
        public string? CpfProprietario { get; set; }

        [Required(ErrorMessage = "O endereço é obrigatório.")]
        public EnderecoDto? Endereco { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if(AreaCultivadaHa > AreaTotalHa)
            {
                yield return new ValidationResult("A área cultivada não pode ser maior que a área total.", 
                    new[] { nameof(AreaCultivadaHa) });
            }
        }
    }
}
