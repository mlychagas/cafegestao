using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Vendas
{
    public class ItemVendaSalvarDto
    {
        [Required(ErrorMessage = "Selecione o lote do item.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um lote válido.")]
        public int? LoteCafeId { get; set; }

        [Required(ErrorMessage = "Informe a quantidade vendida (kg).")]
        [Range(0.001, 9999999999.999, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public decimal? Quantidade { get; set; }

        [Required(ErrorMessage = "Informe o valor por quilograma.")]
        [Range(0.01, 99999999.99, ErrorMessage = "O valor por quilograma deve ser maior que zero.")]
        public decimal? ValorUnitario { get; set; }
    }
}
