namespace CafeGestaoAPI.DTOs.Talhoes
{
    public class TalhaoRespostaDto
    {
        public int Id { get; set; }

        public int PropriedadeRuralId { get; set; }

        public string NomePropriedade { get; set; } = string.Empty;

        public string Nome { get; set; } = string.Empty;

        public decimal AreaHa { get; set; }

        public decimal? EspacamentoLinha { get; set; }

        public decimal? EspacamentoPlanta { get; set; }

        public DateOnly? DataPlantio { get; set; }

        public int? QuantidadeMudas { get; set; }

        public string? Variedades { get; set; }

        public bool Ativo { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}