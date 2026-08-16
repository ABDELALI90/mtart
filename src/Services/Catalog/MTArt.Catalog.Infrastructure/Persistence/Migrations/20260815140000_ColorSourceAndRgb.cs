using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MTArt.Catalog.Infrastructure.Persistence;

#nullable disable

namespace MTArt.Catalog.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(CatalogDbContext))]
    [Migration("20260815140000_ColorSourceAndRgb")]
    public partial class ColorSourceAndRgb : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Rgb",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Colors_Source",
                schema: "catalog",
                table: "Colors",
                column: "Source");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Colors_Source",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "Rgb",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "catalog",
                table: "Colors");
        }
    }
}
