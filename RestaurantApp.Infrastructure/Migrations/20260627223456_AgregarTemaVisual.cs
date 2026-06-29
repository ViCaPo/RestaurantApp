using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTemaVisual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TemasVisuales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ColorFondo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorSuperficie = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorBorde = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorTexto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorTextoTenue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorPrimario = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorPrimarioClaro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorPrimarioOscuro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorExito = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorExitoClaro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorError = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorErrorClaro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorAdvertencia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorAdvertenciaClaro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorInfoClaro = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemasVisuales", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "TemasVisuales",
                columns: new[] { "Id", "ColorAdvertencia", "ColorAdvertenciaClaro", "ColorBorde", "ColorError", "ColorErrorClaro", "ColorExito", "ColorExitoClaro", "ColorFondo", "ColorInfo", "ColorInfoClaro", "ColorPrimario", "ColorPrimarioClaro", "ColorPrimarioOscuro", "ColorSuperficie", "ColorTexto", "ColorTextoTenue" },
                values: new object[] { 1, "#8a6d00", "#fff8e1", "#e3e1dd", "#b00020", "#fdecea", "#2e7d32", "#e6f4ea", "#f7f7f5", "#0d47a1", "#e3f2fd", "#0f6b5c", "#d9ece8", "#0b4f44", "#ffffff", "#2a2a2a", "#6b6b6b" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemasVisuales");
        }
    }
}
