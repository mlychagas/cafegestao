namespace CafeGestaoAPI.DTOs.TiposManejo
{
    public class TipoManejoRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public int QuantidadeAtividades { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
