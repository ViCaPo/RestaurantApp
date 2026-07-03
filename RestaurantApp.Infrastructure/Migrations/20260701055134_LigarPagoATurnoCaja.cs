using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LigarPagoATurnoCaja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TurnoCajaId",
                table: "Pagos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_TurnoCajaId",
                table: "Pagos",
                column: "TurnoCajaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pagos_TurnosCaja_TurnoCajaId",
                table: "Pagos",
                column: "TurnoCajaId",
                principalTable: "TurnosCaja",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pagos_TurnosCaja_TurnoCajaId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Pagos_TurnoCajaId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "TurnoCajaId",
                table: "Pagos");
        }
    }
}
