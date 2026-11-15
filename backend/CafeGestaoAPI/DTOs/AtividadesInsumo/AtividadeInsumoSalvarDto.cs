using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.AtividadesInsumo
{
    public class AtividadeInsumoSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "Informe a lista de insumos.")]
        public List<AtividadeInsumoItemDto> Itens { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var ids = Itens.Where(i => i.InsumoId.HasValue).Select(i => i.InsumoId!.Value).ToList();

            if (ids.Distinct().Count() != ids.Count)
            {
                yield return new ValidationResult(
                    "O mesmo insumo foi informado mais de uma vez nesta atividade.",
                    new[] { nameof(Itens) });
            }
        }
    }
}
