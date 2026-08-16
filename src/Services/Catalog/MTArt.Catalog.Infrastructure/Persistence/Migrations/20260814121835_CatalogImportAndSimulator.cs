using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MTArt.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogImportAndSimulator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CatalogKind",
                schema: "catalog",
                table: "Products",
                type: "nvarchar(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "Unknown");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                schema: "catalog",
                table: "Products",
                type: "nvarchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "MAD");

            migrationBuilder.AddColumn<bool>(
                name: "IsDemo",
                schema: "catalog",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSimulatorReady",
                schema: "catalog",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "PatternId",
                schema: "catalog",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerM2",
                schema: "catalog",
                table: "Products",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriceVisibility",
                schema: "catalog",
                table: "Products",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Public");

            migrationBuilder.AddColumn<string>(
                name: "SourceCatalog",
                schema: "catalog",
                table: "Products",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourcePage",
                schema: "catalog",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                schema: "catalog",
                table: "ProductImages",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDemo",
                schema: "catalog",
                table: "Colors",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                schema: "catalog",
                table: "Colors",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MaterialType",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Universal");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.Sql("UPDATE [catalog].[Colors] SET [Slug] = LOWER([Code]) WHERE [Slug] IS NULL OR [Slug] = ''");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160,
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TextureImageId",
                schema: "catalog",
                table: "Colors",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextureImageUrl",
                schema: "catalog",
                table: "Colors",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                schema: "catalog",
                table: "Collections",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDemo",
                schema: "catalog",
                table: "Collections",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CatalogImportSessions",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceCatalog = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    PageCount = table.Column<int>(type: "int", nullable: false),
                    ProductsDetected = table.Column<int>(type: "int", nullable: false),
                    ProjectsDetected = table.Column<int>(type: "int", nullable: false),
                    UnknownPages = table.Column<int>(type: "int", nullable: false),
                    ImportedCount = table.Column<int>(type: "int", nullable: false),
                    NeedsReviewCount = table.Column<int>(type: "int", nullable: false),
                    ErrorSummary = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogImportSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PatternCategories",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatternCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TilePatterns",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BasePreviewImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BasePreviewImageUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    VectorAssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VectorAssetUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RegionCount = table.Column<int>(type: "int", nullable: false),
                    IsCustomizable = table.Column<bool>(type: "bit", nullable: false),
                    IsSimulatorReady = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TilePatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CatalogImportPages",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PageNumber = table.Column<int>(type: "int", nullable: false),
                    ImportId = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Classification = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    SuggestedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    SuggestedReference = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    SuggestedCategory = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    DetectedShape = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    ExtractedPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    PriceUnit = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    DominantColors = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ImportConfidence = table.Column<double>(type: "float", nullable: false),
                    NeedsReview = table.Column<bool>(type: "bit", nullable: false),
                    ImportedProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogImportPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogImportPages_CatalogImportSessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "catalog",
                        principalTable: "CatalogImportSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatternCategoryTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatternCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatternCategoryTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatternCategoryTranslations_PatternCategories_PatternCategoryId",
                        column: x => x.PatternCategoryId,
                        principalSchema: "catalog",
                        principalTable: "PatternCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TilePatternRegions",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatternId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RegionKey = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DefaultColorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TilePatternRegions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TilePatternRegions_TilePatterns_PatternId",
                        column: x => x.PatternId,
                        principalSchema: "catalog",
                        principalTable: "TilePatterns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TilePatternTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatternId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TilePatternTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TilePatternTranslations_TilePatterns_PatternId",
                        column: x => x.PatternId,
                        principalSchema: "catalog",
                        principalTable: "TilePatterns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_CatalogKind",
                schema: "catalog",
                table: "Products",
                column: "CatalogKind");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsDemo",
                schema: "catalog",
                table: "Products",
                column: "IsDemo");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsSimulatorReady",
                schema: "catalog",
                table: "Products",
                column: "IsSimulatorReady");

            migrationBuilder.CreateIndex(
                name: "IX_Colors_IsDemo",
                schema: "catalog",
                table: "Colors",
                column: "IsDemo");

            migrationBuilder.CreateIndex(
                name: "IX_Colors_MaterialType",
                schema: "catalog",
                table: "Colors",
                column: "MaterialType");

            migrationBuilder.CreateIndex(
                name: "IX_Colors_Slug",
                schema: "catalog",
                table: "Colors",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogImportPages_ImportId",
                schema: "catalog",
                table: "CatalogImportPages",
                column: "ImportId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogImportPages_SessionId",
                schema: "catalog",
                table: "CatalogImportPages",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_PatternCategories_Code",
                schema: "catalog",
                table: "PatternCategories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PatternCategories_Slug",
                schema: "catalog",
                table: "PatternCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PatternCategoryTranslations_PatternCategoryId_LanguageCode",
                schema: "catalog",
                table: "PatternCategoryTranslations",
                columns: new[] { "PatternCategoryId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TilePatternRegions_PatternId_RegionKey",
                schema: "catalog",
                table: "TilePatternRegions",
                columns: new[] { "PatternId", "RegionKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TilePatterns_CategoryId",
                schema: "catalog",
                table: "TilePatterns",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TilePatterns_IsSimulatorReady",
                schema: "catalog",
                table: "TilePatterns",
                column: "IsSimulatorReady");

            migrationBuilder.CreateIndex(
                name: "IX_TilePatterns_Reference",
                schema: "catalog",
                table: "TilePatterns",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TilePatterns_Slug",
                schema: "catalog",
                table: "TilePatterns",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TilePatternTranslations_PatternId_LanguageCode",
                schema: "catalog",
                table: "TilePatternTranslations",
                columns: new[] { "PatternId", "LanguageCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogImportPages",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "PatternCategoryTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "TilePatternRegions",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "TilePatternTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CatalogImportSessions",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "PatternCategories",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "TilePatterns",
                schema: "catalog");

            migrationBuilder.DropIndex(
                name: "IX_Products_CatalogKind",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsDemo",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsSimulatorReady",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Colors_IsDemo",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropIndex(
                name: "IX_Colors_MaterialType",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropIndex(
                name: "IX_Colors_Slug",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "CatalogKind",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Currency",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsDemo",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsSimulatorReady",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PatternId",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PricePerM2",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PriceVisibility",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SourceCatalog",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SourcePage",
                schema: "catalog",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                schema: "catalog",
                table: "ProductImages");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "IsDemo",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "MaterialType",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "Slug",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "TextureImageId",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "TextureImageUrl",
                schema: "catalog",
                table: "Colors");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                schema: "catalog",
                table: "Collections");

            migrationBuilder.DropColumn(
                name: "IsDemo",
                schema: "catalog",
                table: "Collections");
        }
    }
}
