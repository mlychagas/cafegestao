using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Proprietario : EntidadeBase
    {
        [MaxLength(100)]
        public required string Nome { get; set; }

        public required DateOnly DataNascimento { get; set; }

        [MaxLength(14)]
        public required string Cpf { get; set; }

        [MaxLength(150)]
        public required string Email { get; set; }

        [MaxLength(20)]
        public required string Telefone { get; set; }

        public bool Ativo { get; set; } = true;

        public ICollection<PropriedadeRural> PropriedadesRurais { get; set; } = new List<PropriedadeRural>();

        public required int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

    }
}
