namespace CafeGestaoAPI.Models.Entities
{
    public abstract class EntidadeBase
    {
        public int Id { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime? DataAtualizacao { get; set; }
    }
}
