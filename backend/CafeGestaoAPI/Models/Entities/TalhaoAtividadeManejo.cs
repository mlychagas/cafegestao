using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(TalhaoId), nameof(AtividadeManejoId))]
    public class TalhaoAtividadeManejo
    {
        public int TalhaoId { get; set; }
        public Talhao Talhao { get; set; } = null!;

        public int AtividadeManejoId { get; set; }
        public AtividadeManejo AtividadeManejo { get; set; } = null!;
    }
}
