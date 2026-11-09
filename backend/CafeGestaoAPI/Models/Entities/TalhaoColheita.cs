using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Models.Entities
{
    [PrimaryKey(nameof(TalhaoId), nameof(ColheitaId))]
    public class TalhaoColheita
    {
        public int TalhaoId { get; set; }
        public Talhao Talhao { get; set; } = null!;

        public int ColheitaId { get; set; }
        public Colheita Colheita { get; set; } = null!;
    }
}
