using CafeGestaoAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CafeGestaoAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        { }

        public DbSet<Usuario> Usuarios { get; set; }

        public DbSet<Endereco> Enderecos { get; set; }

        public DbSet<PropriedadeRural> PropriedadesRurais { get; set; }

        public DbSet<Talhao> Talhoes { get; set; }

        public DbSet<Safra> Safras { get; set; }

        public DbSet<TipoManejo> TiposManejo { get; set; }

        public DbSet<AtividadeManejo> AtividadesManejo { get; set; }

        public DbSet<TalhaoAtividadeManejo> TalhoesAtividadeManejo { get; set; }

        public DbSet<Colheita> Colheitas { get; set; }

        public DbSet<TalhaoColheita> TalhoesColheita { get; set; }

        public DbSet<Insumo> Insumos { get; set; }

        public DbSet<Fornecedor> Fornecedores { get; set; }

        public DbSet<OrdemCompra> OrdensCompra { get; set; }

        public DbSet<ItemCompra> ItensCompra { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();


            modelBuilder.Entity<PropriedadeRural>(entity => {
                entity.HasOne(p => p.Endereco)
                      .WithOne()
                      .HasForeignKey<PropriedadeRural>(p => p.EnderecoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Usuario)
                       .WithMany(u => u.PropriedadesRurais)
                       .HasForeignKey(p => p.UsuarioId)
                       .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(p => new { p.UsuarioId, p.Nome })
                       .IsUnique();
            });

            modelBuilder.Entity<Fornecedor>(entity => {
                entity.HasIndex(f => new { f.UsuarioId, f.CpfCnpj }).IsUnique();
                entity.HasOne(f => f.Endereco)
                      .WithOne()
                      .HasForeignKey<Fornecedor>( f => f.EnderecoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(f => f.Usuario)
                      .WithMany(u => u.Fornecedores)
                      .HasForeignKey(f => f.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Talhao>(entity => {
                entity.HasOne(t => t.PropriedadeRural)
                      .WithMany(p => p.Talhoes)
                      .HasForeignKey(t => t.PropriedadeRuralId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => new { t.PropriedadeRuralId, t.Nome })
                      .IsUnique();
            });

            modelBuilder.Entity<Safra>(entity => {
                entity.HasOne(s => s.PropriedadeRural)
                      .WithMany(p => p.Safras)
                      .HasForeignKey(s => s.PropriedadeRuralId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(s => new { s.PropriedadeRuralId, s.AnoAgricola })
                      .IsUnique();

                entity.Property(s => s.Status)
                      .HasConversion<string>()
                      .HasMaxLength(20);

                entity.Property(s => s.UnidadeMedida)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            modelBuilder.Entity<TipoManejo>(entity => {
                entity.HasOne(t => t.Usuario)
                      .WithMany()
                      .HasForeignKey(t => t.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => new { t.UsuarioId, t.Nome })
                      .IsUnique();
            });

            modelBuilder.Entity<AtividadeManejo>(entity => {
                entity.HasOne(a => a.Safra)
                      .WithMany(s => s.AtividadesManejo)
                      .HasForeignKey(a => a.SafraId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.TipoManejo)
                      .WithMany(t => t.AtividadesManejo)
                      .HasForeignKey(a => a.TipoManejoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.Status)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            modelBuilder.Entity<TalhaoAtividadeManejo>(entity => {
                entity.HasOne(ta => ta.AtividadeManejo)
                      .WithMany(a => a.Talhoes)
                      .HasForeignKey(ta => ta.AtividadeManejoId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ta => ta.Talhao)
                      .WithMany()
                      .HasForeignKey(ta => ta.TalhaoId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Colheita>(entity => {
                entity.HasOne(c => c.Safra)
                      .WithMany(s => s.Colheitas)
                      .HasForeignKey(c => c.SafraId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.AtividadeManejo)
                      .WithOne(a => a.Colheita)
                      .HasForeignKey<Colheita>(c => c.AtividadeManejoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.UnidadeMedida)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            modelBuilder.Entity<TalhaoColheita>(entity => {
                entity.HasOne(tc => tc.Colheita)
                      .WithMany(c => c.Talhoes)
                      .HasForeignKey(tc => tc.ColheitaId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(tc => tc.Talhao)
                      .WithMany()
                      .HasForeignKey(tc => tc.TalhaoId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Insumo>(entity => {
                entity.HasIndex(i => new { i.UsuarioId, i.Nome }).IsUnique();
                entity.HasOne(i => i.Usuario)
                      .WithMany(u => u.Insumos)
                      .HasForeignKey(i => i.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.Property(i => i.UnidadeMedida)
                       .HasConversion<string>()
                       .HasMaxLength(20);

                entity.Property(i => i.Categoria)
                       .HasConversion<string>()
                       .HasMaxLength(20);

            });

            modelBuilder.Entity<OrdemCompra>(entity => {
                entity.HasOne(o => o.Fornecedor)
                      .WithMany(f => f.OrdensCompra)
                      .HasForeignKey(o => o.FornecedorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ItemCompra>( entity => {
                entity.HasOne(i => i.OrdemCompra)
                      .WithMany(o => o.ItensCompra)
                      .HasForeignKey(i => i.OrdemCompraId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(i => i.Insumo)
                      .WithMany(im => im.ItensCompra)
                      .HasForeignKey(i => i.InsumoId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void AtualizarDatas()
        {
            var dataAgora = DateTime.UtcNow;

            foreach (var entry in  ChangeTracker.Entries<EntidadeBase>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.DataCriacao = dataAgora;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.DataAtualizacao = dataAgora;
                    entry.Property(e => e.DataCriacao).IsModified = false;
                }
                

            }
        }
        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            AtualizarDatas();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            AtualizarDatas();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }


    } ///
}
