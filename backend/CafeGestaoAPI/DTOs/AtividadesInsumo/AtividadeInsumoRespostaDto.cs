using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.AtividadesInsumo
{
    public class AtividadeInsumoRespostaDto
    {
        public int InsumoId { get; set; }

        public string NomeInsumo { get; set; } = string.Empty;

        public bool InsumoAtivo { get; set; }

        public UnidadeInsumo UnidadeMedida { get; set; }

        public decimal QuantidadeEstoque { get; set; }

        public int AtividadeManejoId { get; set; }

        public decimal QuantidadeUtilizada { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
