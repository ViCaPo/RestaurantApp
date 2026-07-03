using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarConfigTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConfigsTicket",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MostrarLogo = table.Column<bool>(type: "bit", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rfc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MostrarMeseroCajero = table.Column<bool>(type: "bit", nullable: false),
                    MostrarPropina = table.Column<bool>(type: "bit", nullable: false),
                    MostrarReferencia = table.Column<bool>(type: "bit", nullable: false),
                    MensajePie = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnchoPapelMm = table.Column<int>(type: "int", nullable: false),
                    ImprimirAutomatico = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfigsTicket", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ConfigsTicket",
                columns: new[] { "Id", "AnchoPapelMm", "Direccion", "ImprimirAutomatico", "MensajePie", "MostrarLogo", "MostrarMeseroCajero", "MostrarPropina", "MostrarReferencia", "Rfc", "Telefono" },
                values: new object[] { 1, 80, "", true, "¡Gracias por su visita!", true, true, true, true, "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfigsTicket");
        }
    }
}
