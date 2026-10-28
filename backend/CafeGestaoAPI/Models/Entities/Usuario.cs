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

        public bool Ativo { get; set; } = true;

        public ICollection<PropriedadeRural> PropriedadesRurais { get; set; } = new List<PropriedadeRural>();

    }
}
