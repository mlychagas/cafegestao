using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class PropriedadeRural : EntidadeBase
    {
        [MaxLength(50)]
        public required string Nome { get; set; }

        [Precision(10,3)]
        public required decimal AreaTotalHa { get; set; }

        [Precision(10,3)]
        public required decimal AreaCultivadaHa  { get; set; }

        public bool Ativo { get; set; } = true;

        // chaves estrangeiras

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public int ProprietarioId { get; set; }
        public Proprietario Proprietario { get; set; } = null!;

        public int EnderecoId { get; set; }
        public Endereco Endereco { get; set; } = null!;

        // Collections
        public ICollection<Talhao> Talhoes { get; set; } = new List<Talhao>();
    }
}
