using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Safras
{
    public class SafraRespostaDto
    {
        public int Id { get; set; }

        public int PropriedadeRuralId { get; set; }

        public string NomePropriedade { get; set; } = string.Empty;

        public string AnoAgricola { get; set; } = string.Empty;

        public StatusSafra Status { get; set; }

        public DateOnly DataInicio { get; set; }

        public DateOnly? DataFechamento { get; set; }

        public decimal? ProdutividadeEstimada { get; set; }

        public UnidadeProdutividade? UnidadeMedida { get; set; }

        public int QuantidadeAtividades { get; set; }

        public int QuantidadeColheitas { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
