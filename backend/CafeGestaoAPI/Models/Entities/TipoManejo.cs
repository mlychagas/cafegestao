using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class TipoManejo : EntidadeBase
    {
        [MaxLength(50)]
        public required string Nome { get; set; }

        [MaxLength(150)]
        public string? Descricao { get; set; }

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public ICollection<AtividadeManejo> AtividadesManejo { get; set; } = new List<AtividadeManejo>();
    }
}
