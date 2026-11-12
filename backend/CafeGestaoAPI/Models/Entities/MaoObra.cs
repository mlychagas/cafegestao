using System.ComponentModel.DataAnnotations;
using CafeGestaoAPI.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(PessoaId), nameof(AtividadeManejoId))]
    public class MaoObra
    {
        public int PessoaId { get; set; }
        public Pessoa Pessoa { get; set; } = null!;

        public int AtividadeManejoId { get; set; }
        public AtividadeManejo AtividadeManejo { get; set; } = null!;

        [MaxLength(50)]
        public string Funcao { get; set; } = string.Empty;

        public UnidadeMaoObra UnidadeMedida { get; set; }

        [Precision(10, 3)]
        public decimal Quantidade { get; set; }

        [Precision(10, 2)]
        public decimal ValorUnitario { get; set; }

        [Precision(12, 2)]
        public decimal ValorTotal { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime? DataAtualizacao { get; set; }
    }
}
