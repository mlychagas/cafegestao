using System.ComponentModel.DataAnnotations;

namespace CafeGestaoAPI.Models.Entities
{
    public class Fornecedor : EntidadeBase
    {
        [MaxLength(150)]
        public required string RazaoSocial { get; set; }

        [MaxLength(20)]
        public required string CpfCnpj { get; set; }

        [MaxLength(16)]
        public required string Telefone { get; set; }

        [MaxLength(16)]
        public string? Celular { get; set; }

        [MaxLength(100)]
        public required string Email { get; set; }

        // chaves estrangeiras
        public int EnderecoId { get; set; }
        public Endereco Endereco { get; set; } = null!;

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        // Collections
        public ICollection<OrdemCompra> OrdensCompra { get; set; } = new List<OrdemCompra>();

        

    }
}
