using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEstacionEntidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Estaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Estaciones", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "EstacionId",
                table: "Productos",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
                INSERT INTO Estaciones (Nombre, Activo)
                SELECT DISTINCT Estacion, 1 FROM Productos WHERE Estacion IS NOT NULL AND Estacion <> '';

                UPDATE p SET p.EstacionId = e.Id
                FROM Productos p INNER JOIN Estaciones e ON e.Nombre = p.Estacion;
            ");

            migrationBuilder.DropColumn(
                name: "Estacion",
                table: "Productos");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_EstacionId",
                table: "Productos",
                column: "EstacionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Estaciones_EstacionId",
                table: "Productos",
                column: "EstacionId",
                principalTable: "Estaciones",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Estaciones_EstacionId",
                table: "Productos");

            migrationBuilder.DropTable(
                name: "Estaciones");

            migrationBuilder.DropIndex(
                name: "IX_Productos_EstacionId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "EstacionId",
                table: "Productos");

            migrationBuilder.AddColumn<string>(
                name: "Estacion",
                table: "Productos",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
