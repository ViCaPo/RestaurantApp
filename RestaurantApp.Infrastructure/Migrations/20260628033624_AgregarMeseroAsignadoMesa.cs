using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMeseroAsignadoMesa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MeseroAsignadoId",
                table: "Mesas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Mesas_MeseroAsignadoId",
                table: "Mesas",
                column: "MeseroAsignadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Mesas_Usuarios_MeseroAsignadoId",
                table: "Mesas",
                column: "MeseroAsignadoId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mesas_Usuarios_MeseroAsignadoId",
                table: "Mesas");

            migrationBuilder.DropIndex(
                name: "IX_Mesas_MeseroAsignadoId",
                table: "Mesas");

            migrationBuilder.DropColumn(
                name: "MeseroAsignadoId",
                table: "Mesas");
        }
    }
}
