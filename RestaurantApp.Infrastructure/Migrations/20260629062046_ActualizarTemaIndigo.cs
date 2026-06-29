using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarTemaIndigo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "TemasVisuales",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ColorAdvertencia", "ColorAdvertenciaClaro", "ColorBorde", "ColorError", "ColorErrorClaro", "ColorExito", "ColorExitoClaro", "ColorFondo", "ColorInfo", "ColorInfoClaro", "ColorPrimario", "ColorPrimarioClaro", "ColorPrimarioOscuro", "ColorTexto", "ColorTextoTenue" },
                values: new object[] { "#d97706", "#fef3c7", "#e2e5f0", "#dc2626", "#fee2e2", "#16a34a", "#dcfce7", "#f4f5fb", "#0284c7", "#e0f2fe", "#4f46e5", "#e0e7ff", "#3730a3", "#1e2233", "#6b7280" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "TemasVisuales",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ColorAdvertencia", "ColorAdvertenciaClaro", "ColorBorde", "ColorError", "ColorErrorClaro", "ColorExito", "ColorExitoClaro", "ColorFondo", "ColorInfo", "ColorInfoClaro", "ColorPrimario", "ColorPrimarioClaro", "ColorPrimarioOscuro", "ColorTexto", "ColorTextoTenue" },
                values: new object[] { "#b8860b", "#fff3d6", "#e8ddd3", "#b3261e", "#fbe9e7", "#4c7a4e", "#e3eee0", "#faf6f1", "#2f5d62", "#e0eded", "#c1502e", "#f3dcd2", "#8f3a1f", "#3b2a23", "#8a7b72" });
        }
    }
}
