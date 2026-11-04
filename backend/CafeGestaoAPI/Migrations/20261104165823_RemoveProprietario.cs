using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProprietario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropriedadesRurais_Proprietarios_ProprietarioId",
                table: "PropriedadesRurais");

            migrationBuilder.DropTable(
                name: "Proprietarios");

            migrationBuilder.DropIndex(
                name: "IX_PropriedadesRurais_ProprietarioId",
                table: "PropriedadesRurais");

            migrationBuilder.DropColumn(
                name: "ProprietarioId",
                table: "PropriedadesRurais");

            migrationBuilder.AddColumn<string>(
                name: "CpfProprietario",
                table: "PropriedadesRurais",
                type: "varchar(14)",
                maxLength: 14,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "NomeProprietario",
                table: "PropriedadesRurais",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CpfProprietario",
                table: "PropriedadesRurais");

            migrationBuilder.DropColumn(
                name: "NomeProprietario",
                table: "PropriedadesRurais");

            migrationBuilder.AddColumn<int>(
                name: "ProprietarioId",
                table: "PropriedadesRurais",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Proprietarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Cpf = table.Column<string>(type: "varchar(14)", maxLength: 14, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataNascimento = table.Column<DateOnly>(type: "date", nullable: false),
                    Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Telefone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proprietarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proprietarios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PropriedadesRurais_ProprietarioId",
                table: "PropriedadesRurais",
                column: "ProprietarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Proprietarios_UsuarioId_Cpf",
                table: "Proprietarios",
                columns: new[] { "UsuarioId", "Cpf" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PropriedadesRurais_Proprietarios_ProprietarioId",
                table: "PropriedadesRurais",
                column: "ProprietarioId",
                principalTable: "Proprietarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
