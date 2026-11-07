using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Insumos
{
    public class InsumoSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "O nome do insumo é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [DefaultValue(null)]
        [MaxLength(150, ErrorMessage = "A descrição deve ter no máximo 150 caracteres.")]
        public string? Descricao { get; set; }

        [Required(ErrorMessage = "A categoria é obrigatória.")]
        [EnumDataType(typeof(CategoriaInsumo), ErrorMessage = "Categoria inválida.")]
        public CategoriaInsumo? Categoria { get; set; }

        [Required(ErrorMessage = "A unidade de medida é obrigatória.")]
        [EnumDataType(typeof(UnidadeInsumo), ErrorMessage = "Unidade de medida inválida.")]
        public UnidadeInsumo? UnidadeMedida { get; set; }

        [Required(ErrorMessage = "A quantidade em estoque é obrigatória (use 0 se não houver).")]
        [Range(0, 9999999.999, ErrorMessage = "A quantidade em estoque não pode ser negativa.")]
        public decimal? QuantidadeEstoque { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Categoria == CategoriaInsumo.NaoInformado)
            {
                yield return new ValidationResult("Selecione a categoria do insumo.", new[] { nameof(Categoria) });
            }

            if (UnidadeMedida == UnidadeInsumo.NaoInformado)
            {
                yield return new ValidationResult("Selecione a unidade de medida.", new[] { nameof(UnidadeMedida) });
            }
        }
    }
}
