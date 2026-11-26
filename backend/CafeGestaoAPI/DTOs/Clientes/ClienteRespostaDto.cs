using CafeGestaoAPI.DTOs.Comum;

namespace CafeGestaoAPI.DTOs.Clientes
{
    public class ClienteRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string CpfCnpj { get; set; } = string.Empty;

        public string Telefone { get; set; } = string.Empty;

        public string? Celular { get; set; }

        public string Email { get; set; } = string.Empty;

        public bool Ativo { get; set; }

        public EnderecoDto Endereco { get; set; } = new();

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
