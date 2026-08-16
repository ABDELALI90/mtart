namespace MTArt.SharedKernel.Pagination;

/// <summary>Server-side paged payload. Every public list endpoint returns this shape.</summary>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int PageNumber, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public static PagedResult<T> Empty(int pageNumber, int pageSize) => new([], pageNumber, pageSize, 0);
}

public class PaginationQuery
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int PageNumber { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value is > 0 and <= MaxPageSize ? value : Math.Clamp(value, 1, MaxPageSize);
    }
}
