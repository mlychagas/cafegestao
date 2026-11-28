using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Vendas
{
    public class VendaResumoDto
    {
        public int Id { get; set; }

        public string? NotaFiscal { get; set; }

        public DateOnly DataVenda { get; set; }

        public StatusVenda Status { get; set; }

        public int ClienteId { get; set; }

        public string NomeCliente { get; set; } = string.Empty;

        public int QuantidadeItens { get; set; }

        public decimal QuantidadeTotalKg { get; set; }

        public decimal ValorTotal { get; set; }
    }
}
