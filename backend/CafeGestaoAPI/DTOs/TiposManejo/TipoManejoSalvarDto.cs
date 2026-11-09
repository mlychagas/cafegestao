using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.TiposManejo
{
    public class TipoManejoSalvarDto
    {
        [Required(ErrorMessage = "O nome do tipo de manejo é obrigatório.")]
        [MaxLength(50, ErrorMessage = "O nome deve ter no máximo 50 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [DefaultValue(null)]
        [MaxLength(150, ErrorMessage = "A descrição deve ter no máximo 150 caracteres.")]
        public string? Descricao { get; set; }
    }
}
