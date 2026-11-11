namespace CafeGestaoAPI.DTOs.Pessoas
{
    public class PessoaRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string Cpf { get; set; } = string.Empty;

        public string? Telefone { get; set; }

        public DateOnly DataNascimento { get; set; }

        public bool Ativo { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
