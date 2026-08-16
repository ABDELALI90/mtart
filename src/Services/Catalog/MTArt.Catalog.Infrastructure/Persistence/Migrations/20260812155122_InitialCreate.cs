using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MTArt.Catalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Collections",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CoverImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collections", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Colors",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    HexApproximation = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: true),
                    ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Family = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Colors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Finishes",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Finishes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Formats",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    WidthCm = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    HeightCm = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    ThicknessCm = table.Column<decimal>(type: "decimal(6,2)", nullable: false),
                    UnitsPerM2 = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    WeightPerUnitKg = table.Column<decimal>(type: "decimal(8,3)", nullable: false),
                    WeightPerM2Kg = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    ShapeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DiagramImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CollectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShapeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FinishId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsFeatured = table.Column<bool>(type: "bit", nullable: false),
                    IsNew = table.Column<bool>(type: "bit", nullable: false),
                    IsCustomizable = table.Column<bool>(type: "bit", nullable: false),
                    IsInStock = table.Column<bool>(type: "bit", nullable: false),
                    MinimumOrderM2 = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    UnitsPerSquareMeter = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    WeightPerSquareMeterKg = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    ThicknessCm = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    CountryOfOrigin = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Material = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ProductionLeadTime = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shapes",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shapes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CategoryTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShortDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryTranslations_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "catalog",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CollectionTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CollectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Story = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollectionTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CollectionTranslations_Collections_CollectionId",
                        column: x => x.CollectionId,
                        principalSchema: "catalog",
                        principalTable: "Collections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ColorTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ColorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColorTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ColorTranslations_Colors_ColorId",
                        column: x => x.ColorId,
                        principalSchema: "catalog",
                        principalTable: "Colors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FinishTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FinishId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinishTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinishTranslations_Finishes_FinishId",
                        column: x => x.FinishId,
                        principalSchema: "catalog",
                        principalTable: "Finishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormatTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormatTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormatTranslations_Formats_FormatId",
                        column: x => x.FormatId,
                        principalSchema: "catalog",
                        principalTable: "Formats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductImages",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MediaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductImages_Products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductRelatedProducts",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RelatedProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductRelatedProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductRelatedProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShortDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Craftsmanship = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    InstallationAdvice = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    MaintenanceAdvice = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductTranslations_Products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductVariants",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ColorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FinishId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Sku = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    StockStatus = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    UnitsPerM2 = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    WeightPerM2Kg = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    ThicknessCm = table.Column<decimal>(type: "decimal(6,2)", nullable: false),
                    MinimumOrder = table.Column<decimal>(type: "decimal(8,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariants_Products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShapeTranslations",
                schema: "catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShapeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShapeTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShapeTranslations_Shapes_ShapeId",
                        column: x => x.ShapeId,
                        principalSchema: "catalog",
                        principalTable: "Shapes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Code",
                schema: "catalog",
                table: "Categories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug",
                schema: "catalog",
                table: "Categories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CategoryTranslations_CategoryId_LanguageCode",
                schema: "catalog",
                table: "CategoryTranslations",
                columns: new[] { "CategoryId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Collections_Slug",
                schema: "catalog",
                table: "Collections",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CollectionTranslations_CollectionId_LanguageCode",
                schema: "catalog",
                table: "CollectionTranslations",
                columns: new[] { "CollectionId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Colors_Code",
                schema: "catalog",
                table: "Colors",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ColorTranslations_ColorId_LanguageCode",
                schema: "catalog",
                table: "ColorTranslations",
                columns: new[] { "ColorId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Finishes_Code",
                schema: "catalog",
                table: "Finishes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinishTranslations_FinishId_LanguageCode",
                schema: "catalog",
                table: "FinishTranslations",
                columns: new[] { "FinishId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Formats_Reference",
                schema: "catalog",
                table: "Formats",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Formats_ShapeId",
                schema: "catalog",
                table: "Formats",
                column: "ShapeId");

            migrationBuilder.CreateIndex(
                name: "IX_FormatTranslations_FormatId_LanguageCode",
                schema: "catalog",
                table: "FormatTranslations",
                columns: new[] { "FormatId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId",
                schema: "catalog",
                table: "ProductImages",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductRelatedProducts_ProductId",
                schema: "catalog",
                table: "ProductRelatedProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId",
                schema: "catalog",
                table: "Products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CollectionId",
                schema: "catalog",
                table: "Products",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Reference",
                schema: "catalog",
                table: "Products",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Slug",
                schema: "catalog",
                table: "Products",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Status",
                schema: "catalog",
                table: "Products",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductTranslations_ProductId_LanguageCode",
                schema: "catalog",
                table: "ProductTranslations",
                columns: new[] { "ProductId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ColorId",
                schema: "catalog",
                table: "ProductVariants",
                column: "ColorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_FormatId",
                schema: "catalog",
                table: "ProductVariants",
                column: "FormatId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ProductId",
                schema: "catalog",
                table: "ProductVariants",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_Sku",
                schema: "catalog",
                table: "ProductVariants",
                column: "Sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shapes_Code",
                schema: "catalog",
                table: "Shapes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShapeTranslations_ShapeId_LanguageCode",
                schema: "catalog",
                table: "ShapeTranslations",
                columns: new[] { "ShapeId", "LanguageCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CollectionTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ColorTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "FinishTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "FormatTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ProductImages",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ProductRelatedProducts",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ProductTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ProductVariants",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ShapeTranslations",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Collections",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Colors",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Finishes",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Formats",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Products",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Shapes",
                schema: "catalog");
        }
    }
}
