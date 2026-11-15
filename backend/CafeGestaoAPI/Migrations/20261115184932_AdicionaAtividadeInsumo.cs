using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaAtividadeInsumo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AtividadesInsumo",
                columns: table => new
                {
                    InsumoId = table.Column<int>(type: "int", nullable: false),
                    AtividadeManejoId = table.Column<int>(type: "int", nullable: false),
                    QuantidadeUtilizada = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadesInsumo", x => new { x.InsumoId, x.AtividadeManejoId });
                    table.ForeignKey(
                        name: "FK_AtividadesInsumo_AtividadesManejo_AtividadeManejoId",
                        column: x => x.AtividadeManejoId,
                        principalTable: "AtividadesManejo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AtividadesInsumo_Insumos_InsumoId",
                        column: x => x.InsumoId,
                        principalTable: "Insumos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadesInsumo_AtividadeManejoId",
                table: "AtividadesInsumo",
                column: "AtividadeManejoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AtividadesInsumo");
        }
    }
}
