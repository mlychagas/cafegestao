namespace CafeGestaoAPI.DTOs.Compras
{
    public class CompraResumoDto
    {
        public int Id { get; set; }

        public string NotaFiscal { get; set; } = string.Empty;

        public DateOnly DataCompra { get; set; }

        public int FornecedorId { get; set; }

        public string NomeFornecedor { get; set; } = string.Empty;

        public int QuantidadeItens { get; set; }

        public decimal ValorTotal { get; set; }
    }
}
