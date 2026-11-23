using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.Colheitas
{
    public class ColheitaRespostaDto
    {
        public int Id { get; set; }

        public DateOnly DataInicio { get; set; }

        public DateOnly? DataFim { get; set; }

        public decimal Quantidade { get; set; }

        public UnidadeColheita UnidadeMedida { get; set; }

        public string? FormaColheita { get; set; }

        public string? Observacao { get; set; }

        public int SafraId { get; set; }

        public string AnoAgricolaSafra { get; set; } = string.Empty;

        public StatusSafra StatusSafra { get; set; }

        public int PropriedadeRuralId { get; set; }

        public string NomePropriedade { get; set; } = string.Empty;

        public int AtividadeManejoId { get; set; }

        public string DescricaoAtividade { get; set; } = string.Empty;

        public StatusAtividadeManejo StatusAtividade { get; set; }

        public List<TalhaoColheitaDto> Talhoes { get; set; } = new();

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
