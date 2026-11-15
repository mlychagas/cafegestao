using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.AtividadesInsumo
{
    public class AtividadeInsumoItemDto
    {
        [Required(ErrorMessage = "Selecione o insumo.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione um insumo válido.")]
        public int? InsumoId { get; set; }

        [Required(ErrorMessage = "Informe a quantidade utilizada.")]
        [Range(0.001, 9999999.999, ErrorMessage = "A quantidade utilizada deve ser maior que zero.")]
        public decimal? QuantidadeUtilizada { get; set; }
    }
}
