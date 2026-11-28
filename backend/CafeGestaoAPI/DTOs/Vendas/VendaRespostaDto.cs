using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Vendas
{
    public class VendaRespostaDto
    {
        public int Id { get; set; }

        public string? NotaFiscal { get; set; }

        public DateOnly DataVenda { get; set; }

        public StatusVenda Status { get; set; }

        public int ClienteId { get; set; }

        public string NomeCliente { get; set; } = string.Empty;

        public string CpfCnpjCliente { get; set; } = string.Empty;

        public bool ClienteAtivo { get; set; }

        public decimal QuantidadeTotalKg { get; set; }

        public decimal ValorTotal { get; set; }

        public List<ItemVendaRespostaDto> Itens { get; set; } = new();

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
