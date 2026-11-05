using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Talhoes
{
    public class TalhaoCadastroDto : TalhaoSalvarDto
    {
        [Required(ErrorMessage = "A propriedade rural é obrigatória.")]
        [Range(1, int.MaxValue, ErrorMessage = "Informe uma propriedade rural válida.")]
        public int? PropriedadeRuralId { get; set; }
    }
}