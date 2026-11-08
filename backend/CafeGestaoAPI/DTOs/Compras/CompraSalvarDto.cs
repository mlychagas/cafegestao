using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Compras
{
    public class CompraSalvarDto : IValidatableObject
    {
        [Required(ErrorMessage = "O número da nota fiscal é obrigatório.")]
        [MaxLength(55, ErrorMessage = "A nota fiscal deve ter no máximo 55 caracteres.")]
        public string NotaFiscal { get; set; } = string.Empty;

        [Required(ErrorMessage = "A data da compra é obrigatória.")]
        public DateOnly? DataCompra { get; set; }

        [Required(ErrorMessage = "Selecione o fornecedor.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um fornecedor válido.")]
        public int? FornecedorId { get; set; }

        [Required(ErrorMessage = "Informe os itens da compra.")]
        [MinLength(1, ErrorMessage = "A compra deve ter pelo menos um item.")]
        public List<ItemCompraSalvarDto> Itens { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DataCompra > DateOnly.FromDateTime(DateTime.Today))
            {
                yield return new ValidationResult("A data da compra não pode ser no futuro.", new[] { nameof(DataCompra) });
            }

            var insumoRepetido = Itens
                .Where(i => i.InsumoId.HasValue)
                .GroupBy(i => i.InsumoId)
                .Any(g => g.Count() > 1);

            if (insumoRepetido)
            {
                yield return new ValidationResult(
                    "O mesmo insumo foi informado em mais de um item. Junte as quantidades em um único item.",
                    new[] { nameof(Itens) });
            }
        }
    }
}
