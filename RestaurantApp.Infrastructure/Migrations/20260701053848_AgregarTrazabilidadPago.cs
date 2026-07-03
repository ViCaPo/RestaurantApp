using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTrazabilidadPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutorizacionTarjeta",
                table: "Pagos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenciaTransaccion",
                table: "Pagos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UltimosDigitosTarjeta",
                table: "Pagos",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutorizacionTarjeta",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "ReferenciaTransaccion",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "UltimosDigitosTarjeta",
                table: "Pagos");
        }
    }
}
