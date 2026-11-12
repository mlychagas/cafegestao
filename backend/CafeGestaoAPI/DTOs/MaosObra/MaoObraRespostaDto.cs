using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.MaosObra
{
    public class MaoObraRespostaDto
    {
        public int PessoaId { get; set; }

        public string NomePessoa { get; set; } = string.Empty;

        public bool PessoaAtiva { get; set; }

        public int AtividadeManejoId { get; set; }

        public string Funcao { get; set; } = string.Empty;

        public UnidadeMaoObra UnidadeMedida { get; set; }

        public decimal Quantidade { get; set; }

        public decimal ValorUnitario { get; set; }

        public decimal ValorTotal { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
