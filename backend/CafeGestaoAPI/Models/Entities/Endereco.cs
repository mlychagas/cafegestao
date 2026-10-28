using System.ComponentModel.DataAnnotations;


namespace CafeGestaoAPI.Models.Entities
{
    public class Endereco
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(150)]
        public required string Rua { get; set; } = string.Empty;

        [MaxLength(10)]
        public required string Numero { get; set; } = string.Empty;

        [MaxLength(9)]
        public required string Cep { get; set; } = string.Empty;

        [MaxLength(50)]
        public required string Bairro { get; set; } = string.Empty;

        [MaxLength(100)]
        public required string Cidade { get; set; } 

        [MaxLength(2)]
        public required string Uf { get; set; } 

        public required string Pais { get; set; } = "Brasil";

        [MaxLength(100)]
        public string? Complemento { get; set; }

    }
}
