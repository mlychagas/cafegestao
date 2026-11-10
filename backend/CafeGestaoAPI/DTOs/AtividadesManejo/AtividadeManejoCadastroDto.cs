using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.AtividadesManejo
{
    public class AtividadeManejoCadastroDto : AtividadeManejoSalvarDto
    {
        [Required(ErrorMessage = "Selecione a safra.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione uma safra válida.")]
        public int? SafraId { get; set; }

        public override IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            foreach (var resultado in base.Validate(validationContext))
            {
                yield return resultado;
            }

            if (Status == StatusAtividadeManejo.Agendada && DataPlanejada < DateOnly.FromDateTime(DateTime.Today))
            {
                yield return new ValidationResult(
                    "A data planejada de uma atividade agendada não pode ser anterior à data atual.",
                    new[] { nameof(DataPlanejada) });
            }
        }
    }
}
