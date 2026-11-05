using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaIndiceUnicoNomeTalhao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Talhoes_PropriedadeRuralId_Nome",
                table: "Talhoes",
                columns: new[] { "PropriedadeRuralId", "Nome" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_Talhoes_PropriedadeRuralId",
                table: "Talhoes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Talhoes_PropriedadeRuralId",
                table: "Talhoes",
                column: "PropriedadeRuralId");

            migrationBuilder.DropIndex(
                name: "IX_Talhoes_PropriedadeRuralId_Nome",
                table: "Talhoes");
        }
    }
}
