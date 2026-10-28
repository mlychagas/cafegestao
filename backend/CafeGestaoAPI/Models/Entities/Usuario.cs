using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Usuario
    {
        public Guid Id { get; set; }

        [MaxLength(100)]
        public required string Nome { get; set; } = string.Empty;

        public required DateOnly DataNascimento { get; set; }

        [MaxLength(150)]
        public required string Email { get; set; } = string.Empty;

        [MaxLength(255)]
        public required string SenhaHash { get; set; } = string.Empty;

        public Boolean Ativo { get; set; } = true;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    }
}
