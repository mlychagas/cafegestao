using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Compras
{
    public class ItemCompraSalvarDto
    {
        [Required(ErrorMessage = "Selecione o insumo do item.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um insumo válido.")]
        public int? InsumoId { get; set; }

        [Required(ErrorMessage = "Informe a quantidade do item.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A quantidade deve ser maior que zero.")]
        public decimal? Quantidade { get; set; }

        [Required(ErrorMessage = "Informe o valor unitário do item.")]
        [Range(0, 99999999.99, ErrorMessage = "O valor unitário não pode ser negativo.")]
        public decimal? ValorUnitario { get; set; }
    }
}
