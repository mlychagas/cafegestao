using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.AtividadesManejo
{
    public class AtividadeManejoSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "A descrição da atividade é obrigatória.")]
        [MaxLength(150, ErrorMessage = "A descrição deve ter no máximo 150 caracteres.")]
        public string Descricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "Selecione o tipo de manejo.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um tipo de manejo válido.")]
        public int? TipoManejoId { get; set; }

        [Required(ErrorMessage = "Selecione pelo menos um talhão.")]
        [MinLength(1, ErrorMessage = "Selecione pelo menos um talhão.")]
        public List<int> TalhaoIds { get; set; } = new();

        [Required(ErrorMessage = "O status da atividade é obrigatório.")]
        [EnumDataType(typeof(StatusAtividadeManejo), ErrorMessage = "Status inválido.")]
        public StatusAtividadeManejo? Status { get; set; }

        [Required(ErrorMessage = "A data planejada é obrigatória.")]
        public DateOnly? DataPlanejada { get; set; }

        public DateOnly? DataConclusao { get; set; }

        [Range(0.01, 99999.99, ErrorMessage = "As horas previstas devem ser maiores que zero.")]
        public decimal? HorasPrevistas { get; set; }

        [Range(0.01, 99999.99, ErrorMessage = "As horas trabalhadas devem ser maiores que zero.")]
        public decimal? HorasTrabalhadas { get; set; }

        [DefaultValue(null)]
        [MaxLength(250, ErrorMessage = "A observação deve ter no máximo 250 caracteres.")]
        public string? Observacao { get; set; }

        public virtual IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var hoje = DateOnly.FromDateTime(DateTime.Today);

            if (Status is StatusAtividadeManejo.NaoInformado or StatusAtividadeManejo.Cancelada)
            {
                yield return new ValidationResult(
                    "Selecione o status entre Agendada, Em andamento ou Concluída.",
                    new[] { nameof(Status) });
            }

            if (Status == StatusAtividadeManejo.Concluida && !DataConclusao.HasValue)
            {
                yield return new ValidationResult(
                    "Informe a data de conclusão para concluir a atividade.",
                    new[] { nameof(DataConclusao) });
            }

            if (DataConclusao > hoje)
            {
                yield return new ValidationResult(
                    "A data de conclusão não pode ser no futuro.",
                    new[] { nameof(DataConclusao) });
            }

            if (TalhaoIds.Distinct().Count() != TalhaoIds.Count)
            {
                yield return new ValidationResult("O mesmo talhão foi informado mais de uma vez.", new[] { nameof(TalhaoIds) });
            }
        }
    }
}
