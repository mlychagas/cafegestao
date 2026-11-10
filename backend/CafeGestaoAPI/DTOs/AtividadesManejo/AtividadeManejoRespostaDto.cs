using CafeGestaoAPI.Models.Enums;

namespace CafeGestaoAPI.DTOs.AtividadesManejo
{
    public class AtividadeManejoRespostaDto
    {
        public int Id { get; set; }

        public string Descricao { get; set; } = string.Empty;

        public int SafraId { get; set; }

        public string AnoAgricolaSafra { get; set; } = string.Empty;

        public StatusSafra StatusSafra { get; set; }

        public int PropriedadeRuralId { get; set; }

        public string NomePropriedade { get; set; } = string.Empty;

        public int TipoManejoId { get; set; }

        public string NomeTipoManejo { get; set; } = string.Empty;

        public StatusAtividadeManejo Status { get; set; }

        public DateOnly DataPlanejada { get; set; }

        public DateOnly? DataConclusao { get; set; }

        public decimal? HorasPrevistas { get; set; }

        public decimal? HorasTrabalhadas { get; set; }

        public string? Observacao { get; set; }

        public List<TalhaoAtividadeDto> Talhoes { get; set; } = new();

        public bool PossuiColheita { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime? DataAtualizacao { get; set; }
    }
}
