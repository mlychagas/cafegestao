using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Usuario : EntidadeBase
    {
        [MaxLength(100)]
        public required string Nome { get; set; } 

        public required DateOnly DataNascimento { get; set; }

        [MaxLength(150)]
        public required string Email { get; set; }

        [MaxLength(255)]
        public required string SenhaHash { get; set; } 

        public int TentativasLogin { get; set; } = 0;

        public DateTime? BloqueadoAte { get; set; }

        public DateTime? UltimoLogin { get; set; }

        public bool Ativo { get; set; } = true;

        // coleções
        public ICollection<PropriedadeRural> PropriedadesRurais { get; set; } = new List<PropriedadeRural>();

        public ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();

        public ICollection<Proprietario> Proprietarios { get; set; } = new List<Proprietario>();

        public ICollection<Fornecedor> Fornecedores { get; set; } = new List<Fornecedor>();
    }
}
