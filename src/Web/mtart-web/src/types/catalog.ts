/**
 * TypeScript mirrors of the Catalog API DTOs (see
 * src/Services/Catalog/MTArt.Catalog.Application/**\/Dtos/*.cs). Property names/casing match the
 * actual JSON responses (System.Text.Json camelCases record properties by default) - do not rename
 * these without checking the backend DTO first.
 */

export type ProductStatus = 'Draft' | 'Published' | 'Archived';
export type StockStatusValue = 'InStock' | 'LowStock' | 'MadeToOrder' | 'ContactUs';
export type ColorFamily =
  | 'White'
  | 'Cream'
  | 'Beige'
  | 'Yellow'
  | 'Orange'
  | 'Terracotta'
  | 'Red'
  | 'Pink'
  | 'Purple'
  | 'Green'
  | 'Turquoise'
  | 'Blue'
  | 'Brown'
  | 'Grey'
  | 'Black'
  | 'Metallic'
  | 'Special';

export type MaterialType = 'Universal' | 'Zellige' | 'CementTile' | 'Terracotta' | 'Bejmat';
export type PriceVisibility = 'Public' | 'QuoteOnly' | 'Hidden';
export type CatalogPageKind = 'Unknown' | 'Patterned' | 'Plain' | 'Border' | 'Patchwork' | 'Project' | 'Custom' | 'Marketing' | 'ColorSample';
export type ProductImageRole = 'Primary' | 'Hover' | 'Gallery' | 'TechnicalDiagram' | 'Lifestyle';

/** Mirrors CategoryDto. */
export interface Category {
  id: string;
  code: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  imageId: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Mirrors CollectionDto. */
export interface Collection {
  id: string;
  slug: string;
  name: string;
  story: string | null;
  description: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
}

/** Mirrors ColorDto. */
export interface Color {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  hexApproximation: string | null;
  imageId: string | null;
  imageUrl: string | null;
  textureImageUrl: string | null;
  family: ColorFamily;
  materialType: MaterialType;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  source?: string | null;
  rgb?: string | null;
}

/** Mirrors ShapeDto. */
export interface Shape {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

/** Mirrors FinishDto. */
export interface Finish {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

/** Mirrors FormatDto. */
export interface Format {
  id: string;
  reference: string;
  name: string | null;
  widthCm: number;
  heightCm: number;
  thicknessCm: number;
  unitsPerM2: number;
  weightPerUnitKg: number;
  weightPerM2Kg: number;
  shapeId: string;
  shapeName: string;
  diagramImageId: string | null;
  displayOrder: number;
  isActive: boolean;
  materialType: MaterialType;
  hasVerifiedTechnicalData: boolean;
}

/** Mirrors ProductListItemDto - the card-sized projection used on listing pages. */
export interface ProductListItem {
  id: string;
  reference: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  collectionId: string | null;
  collectionSlug: string | null;
  primaryImageId: string | null;
  hoverImageId: string | null;
  primaryImageUrl: string | null;
  hoverImageUrl: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isCustomizable: boolean;
  isSimulatorReady: boolean;
  isInStock: boolean;
  status: ProductStatus;
  catalogKind: CatalogPageKind;
  pricePerM2: number | null;
  currency: string;
  priceVisibility: PriceVisibility;
  patternSlug: string | null;
  representativeColorNames: string[];
  representativeFormatLabels: string[];
}

/** Mirrors ProductVariantDto. */
export interface ProductVariant {
  id: string;
  sku: string;
  reference: string;
  colorId: string;
  colorCode: string;
  colorName: string;
  colorHexApproximation: string | null;
  formatId: string;
  formatLabel: string;
  finishId: string | null;
  finishName: string | null;
  stockStatus: StockStatusValue;
  unitsPerM2: number;
  weightPerM2Kg: number;
  thicknessCm: number;
  minimumOrder: number | null;
}

/** Mirrors ProductImageDto. */
export interface ProductImage {
  id: string;
  mediaId: string;
  imageUrl: string | null;
  role: ProductImageRole;
  displayOrder: number;
}

/** Mirrors RelatedProductDto. */
export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  primaryImageId: string | null;
}

/** Mirrors ProductDetailDto. */
export interface ProductDetail {
  id: string;
  reference: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  craftsmanship: string | null;
  installationAdvice: string | null;
  maintenanceAdvice: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  collectionId: string | null;
  collectionSlug: string | null;
  collectionName: string | null;
  shapeId: string | null;
  shapeName: string | null;
  finishId: string | null;
  finishName: string | null;
  isFeatured: boolean;
  isNew: boolean;
  isCustomizable: boolean;
  isInStock: boolean;
  minimumOrderM2: number | null;
  unitsPerSquareMeter: number | null;
  weightPerSquareMeterKg: number | null;
  thicknessCm: number | null;
  countryOfOrigin: string | null;
  material: string | null;
  productionLeadTime: string | null;
  pricePerM2: number | null;
  currency: string;
  priceVisibility: PriceVisibility;
  isSimulatorReady: boolean;
  catalogKind: CatalogPageKind;
  patternId: string | null;
  patternSlug: string | null;
  status: ProductStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  relatedProducts: RelatedProduct[];
}

/** Mirrors ProductSortOrder (backend enum: Featured = 0, Newest = 1, ReferenceAsc = 2). */
export type ProductSortOrder = 'Featured' | 'Newest' | 'ReferenceAsc';

export interface ProductListParams {
  lang: string;
  category?: string;
  collection?: string;
  color?: string;
  shape?: string;
  format?: string;
  finish?: string;
  inStock?: boolean;
  customizable?: boolean;
  q?: string;
  kind?: CatalogPageKind;
  sort?: ProductSortOrder;
  page?: number;
  pageSize?: number;
}

export interface PatternCategory {
  id: string;
  code: string;
  slug: string;
  name: string;
  displayOrder: number;
}

export interface PatternRegion {
  id: string;
  regionKey: string;
  displayName: string;
  defaultColorId: string | null;
  defaultColorCode: string | null;
  displayOrder: number;
}

export interface TilePatternListItem {
  id: string;
  reference: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  previewImageUrl: string | null;
  vectorAssetUrl: string | null;
  regionCount: number;
  isSimulatorReady: boolean;
  isCustomizable: boolean;
  displayOrder: number;
}

export interface TilePatternDetail {
  id: string;
  reference: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  formatId: string | null;
  formatLabel: string | null;
  previewImageUrl: string | null;
  vectorAssetUrl: string | null;
  regionCount: number;
  isCustomizable: boolean;
  isSimulatorReady: boolean;
  regions: PatternRegion[];
  widthCm?: number | null;
  heightCm?: number | null;
  unitsPerM2?: number | null;
  weightPerM2Kg?: number | null;
  pricePerM2?: number | null;
  currency?: string | null;
  priceVisibility?: PriceVisibility | null;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CatalogImportStatus {
  sessionId: string | null;
  sourceCatalog: string;
  status: string;
  pageCount: number;
  productsDetected: number;
  projectsDetected: number;
  unknownPages: number;
  imported: number;
  needsReview: number;
}

export interface CatalogImportPage {
  id: string;
  page: number;
  importId: string;
  classification: string;
  suggestedName: string | null;
  suggestedReference: string | null;
  suggestedCategory: string | null;
  detectedShape: string | null;
  extractedPrice: number | null;
  priceUnit: string | null;
  imageUrl: string | null;
  needsReview: boolean;
  importedProductId: string | null;
  importConfidence: number;
}
