using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarLogoTicketYConfigImpresionEstacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnchoPapelComandaMm",
                table: "Estaciones",
                type: "int",
                nullable: false,
                defaultValue: 80);

            migrationBuilder.AddColumn<bool>(
                name: "ImprimirComandaAutomatico",
                table: "Estaciones",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "ConfigsTicket",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ConfigsTicket",
                keyColumn: "Id",
                keyValue: 1,
                column: "LogoUrl",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnchoPapelComandaMm",
                table: "Estaciones");

            migrationBuilder.DropColumn(
                name: "ImprimirComandaAutomatico",
                table: "Estaciones");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "ConfigsTicket");
        }
    }
}
