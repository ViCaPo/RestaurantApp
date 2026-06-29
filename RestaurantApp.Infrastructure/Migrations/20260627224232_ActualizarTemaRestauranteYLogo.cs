using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarTemaRestauranteYLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "TemasVisuales",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreRestaurante",
                table: "TemasVisuales",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "TemasVisuales",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ColorAdvertencia", "ColorAdvertenciaClaro", "ColorBorde", "ColorError", "ColorErrorClaro", "ColorExito", "ColorExitoClaro", "ColorFondo", "ColorInfo", "ColorInfoClaro", "ColorPrimario", "ColorPrimarioClaro", "ColorPrimarioOscuro", "ColorTexto", "ColorTextoTenue", "LogoUrl", "NombreRestaurante" },
                values: new object[] { "#b8860b", "#fff3d6", "#e8ddd3", "#b3261e", "#fbe9e7", "#4c7a4e", "#e3eee0", "#faf6f1", "#2f5d62", "#e0eded", "#c1502e", "#f3dcd2", "#8f3a1f", "#3b2a23", "#8a7b72", null, "Mi Restaurante" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "TemasVisuales");

            migrationBuilder.DropColumn(
                name: "NombreRestaurante",
                table: "TemasVisuales");

            migrationBuilder.UpdateData(
                table: "TemasVisuales",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ColorAdvertencia", "ColorAdvertenciaClaro", "ColorBorde", "ColorError", "ColorErrorClaro", "ColorExito", "ColorExitoClaro", "ColorFondo", "ColorInfo", "ColorInfoClaro", "ColorPrimario", "ColorPrimarioClaro", "ColorPrimarioOscuro", "ColorTexto", "ColorTextoTenue" },
                values: new object[] { "#8a6d00", "#fff8e1", "#e3e1dd", "#b00020", "#fdecea", "#2e7d32", "#e6f4ea", "#f7f7f5", "#0d47a1", "#e3f2fd", "#0f6b5c", "#d9ece8", "#0b4f44", "#2a2a2a", "#6b6b6b" });
        }
    }
}
