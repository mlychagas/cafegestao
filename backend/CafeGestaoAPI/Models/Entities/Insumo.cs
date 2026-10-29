using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    public class Insumo : EntidadeBase
    {
        [MaxLength(100)]
        public required string Nome { get; set; }

        [MaxLength(150)]
        public string? Descricao { get; set; }

        [Precision(10,3)]
        public required decimal QuantidadeEstoque { get; set; }

        public UnidadeInsumo UnidadeMedida { get; set; }

        public CategoriaInsumo Categoria { get; set; }

        // chaves estrangeiras
        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        // coleção
        public ICollection<ItemCompra> ItensCompra { get; set; } = new List<ItemCompra>();
    }
}
