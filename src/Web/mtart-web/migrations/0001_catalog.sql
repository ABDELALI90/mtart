-- MT ART public catalog schema for Cloudflare D1 (SQLite).
-- Derived from CatalogDbContext / CatalogDbContextModelSnapshot (SQL Server schema "catalog").
-- Owned Slug value objects are flattened to slug TEXT columns.
-- GUIDs are stored as TEXT. Booleans are INTEGER 0/1.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_id TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS category_translations (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE (category_id, language_code)
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  cover_image_id TEXT,
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS collection_translations (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  story TEXT,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE (collection_id, language_code)
);

CREATE TABLE IF NOT EXISTS colors (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL,
  material_type TEXT NOT NULL,
  hex_approximation TEXT,
  rgb TEXT,
  source TEXT,
  image_id TEXT,
  image_url TEXT,
  texture_image_id TEXT,
  texture_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS color_translations (
  id TEXT PRIMARY KEY,
  color_id TEXT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE (color_id, language_code)
);

CREATE TABLE IF NOT EXISTS shapes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS shape_translations (
  id TEXT PRIMARY KEY,
  shape_id TEXT NOT NULL REFERENCES shapes(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (shape_id, language_code)
);

CREATE TABLE IF NOT EXISTS finishes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS finish_translations (
  id TEXT PRIMARY KEY,
  finish_id TEXT NOT NULL REFERENCES finishes(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (finish_id, language_code)
);

CREATE TABLE IF NOT EXISTS formats (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  width_cm REAL NOT NULL,
  height_cm REAL NOT NULL,
  thickness_cm REAL NOT NULL,
  units_per_m2 REAL NOT NULL,
  weight_per_unit_kg REAL NOT NULL,
  weight_per_m2_kg REAL NOT NULL,
  shape_id TEXT NOT NULL REFERENCES shapes(id),
  diagram_image_id TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  material_type INTEGER NOT NULL DEFAULT 0,
  has_verified_technical_data INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS format_translations (
  id TEXT PRIMARY KEY,
  format_id TEXT NOT NULL REFERENCES formats(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT,
  description TEXT,
  UNIQUE (format_id, language_code)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  collection_id TEXT REFERENCES collections(id),
  shape_id TEXT REFERENCES shapes(id),
  finish_id TEXT REFERENCES finishes(id),
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  is_customizable INTEGER NOT NULL DEFAULT 0,
  is_in_stock INTEGER NOT NULL DEFAULT 0,
  is_simulator_ready INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  catalog_kind TEXT NOT NULL,
  price_per_m2 REAL,
  currency TEXT NOT NULL DEFAULT 'MAD',
  price_visibility TEXT NOT NULL,
  minimum_order_m2 REAL,
  units_per_square_meter REAL,
  weight_per_square_meter_kg REAL,
  thickness_cm REAL,
  country_of_origin TEXT,
  material TEXT,
  production_lead_time TEXT,
  source_catalog TEXT,
  source_page INTEGER,
  pattern_id TEXT,
  pattern_slug TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS product_translations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  craftsmanship TEXT,
  installation_advice TEXT,
  maintenance_advice TEXT,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE (product_id, language_code)
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  image_url TEXT,
  role TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id TEXT NOT NULL REFERENCES colors(id),
  format_id TEXT NOT NULL REFERENCES formats(id),
  finish_id TEXT REFERENCES finishes(id),
  sku TEXT NOT NULL UNIQUE,
  reference TEXT NOT NULL,
  stock_status TEXT NOT NULL,
  units_per_m2 REAL NOT NULL,
  weight_per_m2_kg REAL NOT NULL,
  thickness_cm REAL NOT NULL,
  minimum_order REAL
);

CREATE TABLE IF NOT EXISTS product_related_products (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id TEXT NOT NULL REFERENCES products(id),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_categories_display_order ON categories (display_order);
CREATE INDEX IF NOT EXISTS ix_collections_display_order ON collections (display_order);
CREATE INDEX IF NOT EXISTS ix_collections_is_demo ON collections (is_demo);
CREATE INDEX IF NOT EXISTS ix_colors_family ON colors (family);
CREATE INDEX IF NOT EXISTS ix_colors_material_type ON colors (material_type);
CREATE INDEX IF NOT EXISTS ix_colors_source ON colors (source);
CREATE INDEX IF NOT EXISTS ix_colors_is_demo ON colors (is_demo);
CREATE INDEX IF NOT EXISTS ix_colors_display_order ON colors (display_order);
CREATE INDEX IF NOT EXISTS ix_shapes_display_order ON shapes (display_order);
CREATE INDEX IF NOT EXISTS ix_finishes_display_order ON finishes (display_order);
CREATE INDEX IF NOT EXISTS ix_formats_shape_id ON formats (shape_id);
CREATE INDEX IF NOT EXISTS ix_formats_material_type ON formats (material_type);
CREATE INDEX IF NOT EXISTS ix_formats_display_order ON formats (display_order);
CREATE INDEX IF NOT EXISTS ix_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS ix_products_reference ON products (reference);
CREATE INDEX IF NOT EXISTS ix_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS ix_products_collection_id ON products (collection_id);
CREATE INDEX IF NOT EXISTS ix_products_shape_id ON products (shape_id);
CREATE INDEX IF NOT EXISTS ix_products_finish_id ON products (finish_id);
CREATE INDEX IF NOT EXISTS ix_products_status ON products (status);
CREATE INDEX IF NOT EXISTS ix_products_catalog_kind ON products (catalog_kind);
CREATE INDEX IF NOT EXISTS ix_products_display_order ON products (display_order);
CREATE INDEX IF NOT EXISTS ix_products_is_demo ON products (is_demo);
CREATE INDEX IF NOT EXISTS ix_products_is_featured ON products (is_featured);
CREATE INDEX IF NOT EXISTS ix_products_is_simulator_ready ON products (is_simulator_ready);
CREATE INDEX IF NOT EXISTS ix_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS ix_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS ix_product_variants_color_id ON product_variants (color_id);
CREATE INDEX IF NOT EXISTS ix_product_variants_format_id ON product_variants (format_id);
CREATE INDEX IF NOT EXISTS ix_product_variants_finish_id ON product_variants (finish_id);
CREATE INDEX IF NOT EXISTS ix_product_related_product_id ON product_related_products (product_id);
CREATE INDEX IF NOT EXISTS ix_category_translations_category_id ON category_translations (category_id);
CREATE INDEX IF NOT EXISTS ix_collection_translations_collection_id ON collection_translations (collection_id);
CREATE INDEX IF NOT EXISTS ix_color_translations_color_id ON color_translations (color_id);
CREATE INDEX IF NOT EXISTS ix_shape_translations_shape_id ON shape_translations (shape_id);
CREATE INDEX IF NOT EXISTS ix_finish_translations_finish_id ON finish_translations (finish_id);
CREATE INDEX IF NOT EXISTS ix_format_translations_format_id ON format_translations (format_id);
CREATE INDEX IF NOT EXISTS ix_product_translations_product_id ON product_translations (product_id);
CREATE INDEX IF NOT EXISTS ix_product_translations_language ON product_translations (language_code);
CREATE INDEX IF NOT EXISTS ix_products_pattern_slug ON products (pattern_slug);
