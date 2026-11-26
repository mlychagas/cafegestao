using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Cliente : EntidadeBase
    {
        [MaxLength(150)]
        public required string Nome { get; set; }

        [MaxLength(20)]
        public required string CpfCnpj { get; set; }

        [MaxLength(16)]
        public required string Telefone { get; set; }

        [MaxLength(16)]
        public string? Celular { get; set; }

        [MaxLength(100)]
        public required string Email { get; set; }

        public bool Ativo { get; set; } = true;

        public int EnderecoId { get; set; }
        public Endereco Endereco { get; set; } = null!;

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
    }
}
