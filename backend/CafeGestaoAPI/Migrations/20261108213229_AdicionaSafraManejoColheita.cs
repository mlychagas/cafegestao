using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeGestaoAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaSafraManejoColheita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Safras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AnoAgricola = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFechamento = table.Column<DateOnly>(type: "date", nullable: true),
                    ProdutividadeEstimada = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    UnidadeMedida = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PropriedadeRuralId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Safras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Safras_PropriedadesRurais_PropriedadeRuralId",
                        column: x => x.PropriedadeRuralId,
                        principalTable: "PropriedadesRurais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TiposManejo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nome = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposManejo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposManejo_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AtividadesManejo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Descricao = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataPlanejada = table.Column<DateOnly>(type: "date", nullable: false),
                    DataConclusao = table.Column<DateOnly>(type: "date", nullable: true),
                    HorasPrevistas = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: true),
                    HorasTrabalhadas = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: true),
                    Observacao = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TipoManejoId = table.Column<int>(type: "int", nullable: false),
                    SafraId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadesManejo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AtividadesManejo_Safras_SafraId",
                        column: x => x.SafraId,
                        principalTable: "Safras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AtividadesManejo_TiposManejo_TipoManejoId",
                        column: x => x.TipoManejoId,
                        principalTable: "TiposManejo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Colheitas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Quantidade = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: false),
                    UnidadeMedida = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormaColheita = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Observacao = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SafraId = table.Column<int>(type: "int", nullable: false),
                    AtividadeManejoId = table.Column<int>(type: "int", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Colheitas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Colheitas_AtividadesManejo_AtividadeManejoId",
                        column: x => x.AtividadeManejoId,
                        principalTable: "AtividadesManejo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Colheitas_Safras_SafraId",
                        column: x => x.SafraId,
                        principalTable: "Safras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TalhoesAtividadeManejo",
                columns: table => new
                {
                    TalhaoId = table.Column<int>(type: "int", nullable: false),
                    AtividadeManejoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TalhoesAtividadeManejo", x => new { x.TalhaoId, x.AtividadeManejoId });
                    table.ForeignKey(
                        name: "FK_TalhoesAtividadeManejo_AtividadesManejo_AtividadeManejoId",
                        column: x => x.AtividadeManejoId,
                        principalTable: "AtividadesManejo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TalhoesAtividadeManejo_Talhoes_TalhaoId",
                        column: x => x.TalhaoId,
                        principalTable: "Talhoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TalhoesColheita",
                columns: table => new
                {
                    TalhaoId = table.Column<int>(type: "int", nullable: false),
                    ColheitaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TalhoesColheita", x => new { x.TalhaoId, x.ColheitaId });
                    table.ForeignKey(
                        name: "FK_TalhoesColheita_Colheitas_ColheitaId",
                        column: x => x.ColheitaId,
                        principalTable: "Colheitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TalhoesColheita_Talhoes_TalhaoId",
                        column: x => x.TalhaoId,
                        principalTable: "Talhoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadesManejo_SafraId",
                table: "AtividadesManejo",
                column: "SafraId");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadesManejo_TipoManejoId",
                table: "AtividadesManejo",
                column: "TipoManejoId");

            migrationBuilder.CreateIndex(
                name: "IX_Colheitas_AtividadeManejoId",
                table: "Colheitas",
                column: "AtividadeManejoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Colheitas_SafraId",
                table: "Colheitas",
                column: "SafraId");

            migrationBuilder.CreateIndex(
                name: "IX_Safras_PropriedadeRuralId_AnoAgricola",
                table: "Safras",
                columns: new[] { "PropriedadeRuralId", "AnoAgricola" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TalhoesAtividadeManejo_AtividadeManejoId",
                table: "TalhoesAtividadeManejo",
                column: "AtividadeManejoId");

            migrationBuilder.CreateIndex(
                name: "IX_TalhoesColheita_ColheitaId",
                table: "TalhoesColheita",
                column: "ColheitaId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposManejo_UsuarioId_Nome",
                table: "TiposManejo",
                columns: new[] { "UsuarioId", "Nome" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TalhoesAtividadeManejo");

            migrationBuilder.DropTable(
                name: "TalhoesColheita");

            migrationBuilder.DropTable(
                name: "Colheitas");

            migrationBuilder.DropTable(
                name: "AtividadesManejo");

            migrationBuilder.DropTable(
                name: "Safras");

            migrationBuilder.DropTable(
                name: "TiposManejo");
        }
    }
}
