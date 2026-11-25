using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class ColheitaUmParaMuitosAtividade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Colheitas_AtividadesManejo_AtividadeManejoId",
                table: "Colheitas");

            migrationBuilder.DropIndex(
                name: "IX_Colheitas_AtividadeManejoId",
                table: "Colheitas");

            migrationBuilder.CreateIndex(
                name: "IX_Colheitas_AtividadeManejoId",
                table: "Colheitas",
                column: "AtividadeManejoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Colheitas_AtividadesManejo_AtividadeManejoId",
                table: "Colheitas",
                column: "AtividadeManejoId",
                principalTable: "AtividadesManejo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Colheitas_AtividadesManejo_AtividadeManejoId",
                table: "Colheitas");

            migrationBuilder.DropIndex(
                name: "IX_Colheitas_AtividadeManejoId",
                table: "Colheitas");

            migrationBuilder.CreateIndex(
                name: "IX_Colheitas_AtividadeManejoId",
                table: "Colheitas",
                column: "AtividadeManejoId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Colheitas_AtividadesManejo_AtividadeManejoId",
                table: "Colheitas",
                column: "AtividadeManejoId",
                principalTable: "AtividadesManejo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
