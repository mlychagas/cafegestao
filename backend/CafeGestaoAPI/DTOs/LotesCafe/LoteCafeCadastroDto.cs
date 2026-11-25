using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.LotesCafe
{
    public class LoteCafeCadastroDto : LoteCafeSalvarDto
    {
        [Required(ErrorMessage = "Selecione a safra.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione uma safra válida.")]
        public int? SafraId { get; set; }
    }
}
