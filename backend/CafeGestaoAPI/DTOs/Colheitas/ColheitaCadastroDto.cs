using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.DTOs.Colheitas
{
    public class ColheitaCadastroDto : ColheitaSalvarDto
    {
        [Required(ErrorMessage = "Selecione a atividade de manejo.")]
        [Range(1, int.MaxValue, ErrorMessage = "Selecione uma atividade de manejo válida.")]
        public int? AtividadeManejoId { get; set; }
    }
}
