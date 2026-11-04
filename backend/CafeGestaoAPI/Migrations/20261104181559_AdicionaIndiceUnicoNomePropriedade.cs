using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaIndiceUnicoNomePropriedade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PropriedadesRurais_UsuarioId_Nome",
                table: "PropriedadesRurais",
                columns: new[] { "UsuarioId", "Nome" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_PropriedadesRurais_UsuarioId",
                table: "PropriedadesRurais");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PropriedadesRurais_UsuarioId",
                table: "PropriedadesRurais",
                column: "UsuarioId");

            migrationBuilder.DropIndex(
                name: "IX_PropriedadesRurais_UsuarioId_Nome",
                table: "PropriedadesRurais");
        }
    }
}
