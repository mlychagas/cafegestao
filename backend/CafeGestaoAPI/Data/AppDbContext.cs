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

        public DbSet<Proprietario> Proprietarios { get; set; }

        public DbSet<PropriedadeRural> PropriedadesRurais { get; set; }

        public DbSet<Talhao> Talhoes { get; set; }

        public DbSet<Insumo> Insumos { get; set; }

        public DbSet<Fornecedor> Fornecedores { get; set; }

        public DbSet<OrdemCompra> OrdensCompra { get; set; }

        public DbSet<ItemCompra> ItensCompra { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();

            modelBuilder.Entity<Proprietario>(entity => {
                entity.HasIndex(p => new { p.UsuarioId, p.Cpf }).IsUnique();
                entity.HasOne(t => t.Usuario)
                .WithMany(u => u.Proprietarios)
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PropriedadeRural>(entity => {
                entity.HasOne(p => p.Endereco)
                      .WithOne()
                      .HasForeignKey<PropriedadeRural>(p => p.EnderecoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Usuario)
                       .WithMany(u => u.PropriedadesRurais)
                       .HasForeignKey(p => p.UsuarioId)
                       .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Proprietario)
                       .WithMany(pr => pr.PropriedadesRurais)
                       .HasForeignKey(p => p.ProprietarioId)
                       .OnDelete(DeleteBehavior.Restrict);
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
