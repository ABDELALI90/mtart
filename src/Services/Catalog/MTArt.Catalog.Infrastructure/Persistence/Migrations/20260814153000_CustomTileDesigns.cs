using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MTArt.Catalog.Infrastructure.Persistence;

#nullable disable

namespace MTArt.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(CatalogDbContext))]
    [Migration("20260814153000_CustomTileDesigns")]
    public partial class CustomTileDesigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomTileDesigns",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    WidthCm = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    HeightCm = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    GeometryJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SvgMarkup = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ThumbnailSvg = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RepeatMode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ColorSummaryJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SourceMouldId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsEditable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomTileDesigns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomTileDesigns_Reference",
                schema: "catalog",
                table: "CustomTileDesigns",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomTileDesigns_CreatedAt",
                schema: "catalog",
                table: "CustomTileDesigns",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomTileDesigns",
                schema: "catalog");
        }
    }
}
