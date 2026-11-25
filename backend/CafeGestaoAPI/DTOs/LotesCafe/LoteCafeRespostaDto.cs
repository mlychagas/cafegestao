using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.LotesCafe
{
    public class LoteCafeRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public decimal Quantidade { get; set; }

        public UnidadePeso UnidadeMedida { get; set; }

        public DateOnly DataArmazenamento { get; set; }

        public FormaProcessamento FormaProcessamento { get; set; }

        public decimal? Umidade { get; set; }

        public string? Observacao { get; set; }

        public bool Ativo { get; set; }

        public int SafraId { get; set; }

        public string AnoAgricolaSafra { get; set; } = string.Empty;

        public StatusSafra StatusSafra { get; set; }

        public int PropriedadeRuralId { get; set; }

        public string NomePropriedade { get; set; } = string.Empty;

        public decimal TotalColhidoSafraKg { get; set; }

        public decimal TotalLotesSafraKg { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
