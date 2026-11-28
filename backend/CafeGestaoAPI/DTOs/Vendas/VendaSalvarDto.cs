using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Vendas
{
    public class VendaSalvarDto : IValidatableObject
    {
        [DefaultValue(null)]
        [MaxLength(55, ErrorMessage = "A nota fiscal deve ter no máximo 55 caracteres.")]
        public string? NotaFiscal { get; set; }

        [Required(ErrorMessage = "A data da venda é obrigatória.")]
        public DateOnly? DataVenda { get; set; }

        [Required(ErrorMessage = "Selecione o cliente.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um cliente válido.")]
        public int? ClienteId { get; set; }

        [Required(ErrorMessage = "Informe o status do pagamento.")]
        [EnumDataType(typeof(StatusVenda), ErrorMessage = "Status do pagamento inválido.")]
        public StatusVenda? Status { get; set; }

        [Required(ErrorMessage = "Informe os itens da venda.")]
        [MinLength(1, ErrorMessage = "A venda deve ter pelo menos um item.")]
        public List<ItemVendaSalvarDto> Itens { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DataVenda > DateOnly.FromDateTime(DateTime.Today))
            {
                yield return new ValidationResult("A data da venda não pode ser no futuro.", new[] { nameof(DataVenda) });
            }

            if (Status == StatusVenda.NaoInformado)
            {
                yield return new ValidationResult("Informe o status do pagamento.", new[] { nameof(Status) });
            }

            if (Status == StatusVenda.Cancelada)
            {
                yield return new ValidationResult(
                    "Para cancelar uma venda, use a opção Cancelar venda.",
                    new[] { nameof(Status) });
            }

            var loteRepetido = Itens
                .Where(i => i.LoteCafeId.HasValue)
                .GroupBy(i => i.LoteCafeId)
                .Any(g => g.Count() > 1);

            if (loteRepetido)
            {
                yield return new ValidationResult(
                    "O mesmo lote foi informado em mais de um item. Junte as quantidades em um único item.",
                    new[] { nameof(Itens) });
            }
        }
    }
}
