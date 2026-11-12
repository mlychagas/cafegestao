using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.MaosObra
{
    public class MaoObraSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "Informe a lista de mão de obra.")]
        public List<MaoObraItemDto> Itens { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var ids = Itens.Where(i => i.PessoaId.HasValue).Select(i => i.PessoaId!.Value).ToList();

            if (ids.Distinct().Count() != ids.Count)
            {
                yield return new ValidationResult(
                    "A mesma pessoa foi informada mais de uma vez nesta atividade.",
                    new[] { nameof(Itens) });
            }
        }
    }
}
