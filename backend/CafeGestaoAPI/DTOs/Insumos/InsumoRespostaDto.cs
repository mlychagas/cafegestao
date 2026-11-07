using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Insumos
{
    public class InsumoRespostaDto
    {
        public int Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public CategoriaInsumo Categoria { get; set; }

        public UnidadeInsumo UnidadeMedida { get; set; }

        public decimal QuantidadeEstoque { get; set; }

        public bool Ativo { get; set; }

        public bool PossuiMovimentacoes { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
