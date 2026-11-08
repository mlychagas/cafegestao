namespace CafeGestaoAPI.DTOs.Compras
{
    public class CompraRespostaDto
    {
        public int Id { get; set; }

        public string NotaFiscal { get; set; } = string.Empty;

        public DateOnly DataCompra { get; set; }

        public int FornecedorId { get; set; }

        public string NomeFornecedor { get; set; } = string.Empty;

        public string CpfCnpjFornecedor { get; set; } = string.Empty;

        public bool FornecedorAtivo { get; set; }

        public decimal ValorTotal { get; set; }

        public List<ItemCompraRespostaDto> Itens { get; set; } = new();

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
