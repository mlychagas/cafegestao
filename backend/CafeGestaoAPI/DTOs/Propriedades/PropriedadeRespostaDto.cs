using CafeGestaoAPI.DTOs.Comum;
namespace CafeGestaoAPI.DTOs.Propriedades
{
    public class PropriedadeRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public decimal AreaTotalHa { get; set; }

        public decimal AreaCultivadaHa { get; set; }

        public string? NomeProprietario { get; set; }

        public string? CpfProprietario { get; set; }

        public bool Ativo { get; set; }

        public EnderecoDto Endereco { get; set; } = new();

        public int QuantidadeTalhoes { get; set; }

        public decimal AreaTalhoesHa { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }

    }
}
