using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class PropriedadeRural : EntidadeBase
    {
        [MaxLength(50)]
        public required string Nome { get; set; }

        public required decimal AreaTotalHa { get; set; }

        public required decimal AreaCultivadoHa  { get; set; }

        public bool Ativo { get; set; } = true;

        // chaves estrangeiras

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public int ProprietarioId { get; set; }
        public Proprietario Proprietario { get; set; } = null!;

        public int EnderecoId { get; set; }
        public Endereco Endereco { get; set; } = null!;
    }
}
