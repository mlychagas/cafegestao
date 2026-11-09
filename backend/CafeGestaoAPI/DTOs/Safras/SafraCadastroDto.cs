using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Safras
{
    public class SafraCadastroDto : SafraSalvarDto
    {
        [Required(ErrorMessage = "A propriedade rural é obrigatória.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione uma propriedade rural válida.")]
        public int? PropriedadeRuralId { get; set; }
    }
}
