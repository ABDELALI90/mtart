using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MTArt.Catalog.Infrastructure.Persistence;

#nullable disable

namespace MTArt.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(CatalogDbContext))]
    [Migration("20260814140000_FormatMaterialAndBjmatSupport")]
    public partial class FormatMaterialAndBjmatSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasVerifiedTechnicalData",
                schema: "catalog",
                table: "Formats",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MaterialType",
                schema: "catalog",
                table: "Formats",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Universal");

            migrationBuilder.CreateIndex(
                name: "IX_Formats_MaterialType",
                schema: "catalog",
                table: "Formats",
                column: "MaterialType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Formats_MaterialType",
                schema: "catalog",
                table: "Formats");

            migrationBuilder.DropColumn(
                name: "HasVerifiedTechnicalData",
                schema: "catalog",
                table: "Formats");

            migrationBuilder.DropColumn(
                name: "MaterialType",
                schema: "catalog",
                table: "Formats");
        }
    }
}
