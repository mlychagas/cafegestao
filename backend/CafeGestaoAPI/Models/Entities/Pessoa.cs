using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Pessoa : EntidadeBase
    {
        [MaxLength(100)]
        public required string Nome { get; set; }

        [MaxLength(14)]
        public required string Cpf { get; set; }

        [MaxLength(15)]
        public string? Telefone { get; set; }

        public required DateOnly DataNascimento { get; set; }

        public bool Ativo { get; set; } = true;

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
    }
}
