# Media Management

**Status:** contract decided in Phase 1 (`ProductImage.MediaId` references); Media service
implementation (storage, variant generation, admin library) is planned for Phase 7.

## Ownership

The Media service is the single owner of every binary file (images, videos, PDFs) and its metadata
(alt text, dimensions, file size, responsive variants). Other services (Catalog, Content) only ever store
a `MediaId` reference — never a raw URL, and never the binary itself. This means media can be moved to a
different CDN/storage backend without touching any other service.

## Storage abstraction

```csharp
public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct);
    Task DeleteAsync(string key, CancellationToken ct);
    Task<Stream> OpenReadAsync(string key, CancellationToken ct);
    string GetPublicUrl(string key);
}
```

- **Development:** MinIO (S3-compatible, runs in `docker-compose.yml`).
- **Production:** any S3-compatible bucket or Azure Blob Storage — swap the `IFileStorage` implementation
  via DI, nothing above the abstraction changes.

Binary image data is never stored in SQL Server.

## Upload pipeline (planned, Phase 7)

1. Validate file type/extension/size against an allow-list (reject anything else, including based on
   content sniffing, not just extension).
2. Strip potentially sensitive EXIF metadata (GPS, device info) from photos before persisting.
3. Generate a unique, collision-free storage key (not the original filename, to avoid path traversal /
   overwrite issues).
4. Generate responsive raster variants at `320 / 640 / 960 / 1280 / 1600 / 2048`px, plus WebP/AVIF where
   the source format benefits, while preserving the original at full quality for admin/download use.
5. Generate a thumbnail for admin grid views.
6. Persist metadata (dimensions, size, alt text, title, folder/collection, usage references) in the Media
   database; publish a `MediaDeleted` event when a file is removed so consumers can react.

## Frontend contract

Product/project imagery is always requested at the smallest size that satisfies the layout (never a full
2048px original for a 300px card). `object-fit: cover` is used for lifestyle/hero imagery; `object-fit:
contain` is used wherever the complete tile sample must remain fully visible (e.g. color swatches,
technical diagrams). Every image reserves its aspect ratio up front to avoid layout shift, and uses a
blur/skeleton placeholder while loading.
